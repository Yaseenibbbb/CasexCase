"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, PauseCircle, PlayCircle, Calculator, HelpCircle, FileText, ImageIcon, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/auth-context"
import { caseService } from "@/lib/case-service"
import { CASE_TYPES } from "@/lib/data"
import { toast } from "@/components/ui/use-toast"
import type { CaseSession } from "@/lib/database.types"
import { parseReply, Exhibit } from "@/lib/parseExhibits"

// Import our custom components
import { InterviewHeader } from "@/components/interview/InterviewHeader"
import { ChatMessage } from "@/components/interview/ChatMessage"
import { VoiceWaveform } from "@/components/interview/VoiceWaveform"
import { CalculatorWidget } from "@/components/interview/CalculatorWidget"
import { FrameworkCanvas } from "@/components/interview/FrameworkCanvas"
import { ExhibitPanel } from "@/components/interview/ExhibitPanel"
import { ProgressMeter } from "@/components/interview/ProgressMeter"

// Define a type for the chart data we expect
interface ChartDataPoint {
  label: string;
  value: number;
  // Add other potential fields if needed, e.g., color
}

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [caseSession, setCaseSession] = useState<CaseSession | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [remainingTime, setRemainingTime] = useState(0)
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [showExhibit, setShowExhibit] = useState(false)
  const [currentExhibit, setCurrentExhibit] = useState<number>(0)
  const [isPinned, setIsPinned] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [exhibits, setExhibits] = useState<Exhibit[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isConnected, setIsConnected] = useState(true)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [isTtsEnabled, setIsTtsEnabled] = useState(true)
  const [chartData, setChartData] = useState<ChartDataPoint[] | null>(null)
  const hasInitialized = useRef(false)
  const audioChunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Fetch case session data
  useEffect(() => {
    console.log("[EFFECT] Running fetchCaseSession effect. User:", user ? user.id : 'null', "Initialized:", hasInitialized.current);
    
    if (hasInitialized.current) {
      console.log("[EFFECT] Already initialized (checked at top). Returning.");
      return;
    }
    if (!user) {
       console.log("[EFFECT] User not available yet (checked at top). Returning.");
       return;
    }

    const fetchCaseSession = async () => {
      console.log("[EFFECT] Inside fetchCaseSession async function.");
      hasInitialized.current = true; 
      console.log("[EFFECT] Set hasInitialized=true.");

      try {
        setIsLoading(true);
        const { data, error } = await caseService.getCaseSession(id);

        if (error || !data) {
          console.error("Error fetching case session:", error);
          toast({
            title: "Error",
            description: "Could not load the case session. Please try again.",
            variant: "destructive",
          });
          router.push("/dashboard");
          return;
        }

        setCaseSession(data);
        console.log(`[EFFECT] Case session fetched. Case Type from DB: ${data?.case_type}`);

        if (data.duration_minutes > 0) {
          setElapsedTime(data.duration_minutes * 60)
        }
        if (data.notes) {
          setNotes(data.notes)
        }
        const caseType = CASE_TYPES.find((c) => c.id === data.case_type)
        const duration = caseType?.duration || 45
        setRemainingTime(duration * 60 - data.duration_minutes * 60)

        if (caseType) {
          console.log("[EFFECT] Found caseType, calling triggerInitialAIMessage.");
          triggerInitialAIMessage(caseType);
        } else {
            console.warn("[EFFECT] Case type not found in CASE_TYPES for:", data.case_type);
            toast({
                title: "Warning",
                description: `Could not find details for case type: ${data.case_type}.`,
                variant: "default",
             });
        }

      } catch (error) {
        console.error("Error in fetchCaseSession:", error);
         toast({
            title: "Initialization Error",
            description: "Failed to initialize the interview session.",
            variant: "destructive",
         });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseSession();
  }, [id, user, router]);

  // Function to get the initial AI message
  const triggerInitialAIMessage = async (loadedCaseType: NonNullable<typeof caseType>) => {
    console.log(`[TRIGGER_INIT] Entered triggerInitialAIMessage for case type: ${loadedCaseType.id}`);
    const initialUserMessage = { role: 'user' as const, content: 'Please begin the case interview.' };
    const messagesForApi = [initialUserMessage]; 

    try {
      const caseTitle = loadedCaseType.title;
      // System prompt is handled by the API route based on caseType

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesForApi,
          caseType: loadedCaseType.id, // Send the specific case type ID
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Initial API request failed with status ${response.status}`);
      }

      const data = await response.json();
      // Use the raw response text here
      const rawAiResponse = data.response; 

      if (rawAiResponse) {
        // Parse the raw response
        const { prose, exhibits: newExhibits } = parseReply(rawAiResponse);
        console.log("[TRIGGER_INIT] Parsed initial response - Prose:", prose, "Exhibits:", newExhibits);

        const aiInitialMessage = {
          id: Date.now(),
          role: "assistant" as const,
          content: prose, // Use parsed prose
          timestamp: new Date().toISOString(),
          hasExhibit: newExhibits.length > 0, // Determine based on parsed exhibits
          exhibitId: null, // This specific ID logic might be deprecated/removed
          isEnd: false,
        };
        setMessages([aiInitialMessage]);

        // Update exhibits state
        if (newExhibits.length > 0) {
           setExhibits(newExhibits); // Set initial exhibits
        }

        // Play audio for the prose part only
        if (isTtsEnabled && prose) { 
          console.log(`[TRIGGER_INIT] TTS enabled. Requesting audio for initial prose.`);
          try {
            const audioResponse = await fetch('/api/speak', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ text: prose }), // Send only prose for TTS
            });
            if (!audioResponse.ok) throw new Error('Speak API failed');
            const audioBlob = await audioResponse.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            console.log(`[TRIGGER_INIT] Playing initial audio.`);
            audio.play().catch(e => console.error("Error playing initial audio:", e));
            audio.onended = () => URL.revokeObjectURL(audioUrl);
          } catch (ttsError) {
            console.error("Error playing initial AI audio:", ttsError);
          }
        }
        
        setCurrentStep(0); 

      } else {
        throw new Error("Empty initial response from API");
      }

    } catch (error) {
      console.error("Error triggering initial AI message:", error);
      toast({
        title: "AI Initialization Error",
        description: error instanceof Error ? error.message : "Could not start the AI interviewer.",
        variant: "destructive",
      });
      // Potentially redirect back or show a specific error state
    }
  };

  // Set up media recorder
  useEffect(() => {
    const setupMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunks.current.push(e.data)
          }
        }

        recorder.onstop = () => {
          // Process audio data here
          console.log("Recording stopped, processing audio...");
          if (audioChunks.current.length > 0) {
            const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' }); // Adjust mime type if needed
            console.log("Audio Blob created:", audioBlob);
            console.log("Blob size:", audioBlob.size);
            // In a real app, you would send this audioBlob to your backend/API
            // e.g., uploadToS3(audioBlob) or sendToTranscriptionAPI(audioBlob)
          } else {
            console.log("No audio data recorded.");
          }
          // In a real app, you would send this to your backend for processing
          audioChunks.current = []; // Clear chunks after processing
        }

        setMediaRecorder(recorder)
      } catch (error) {
        console.error("Error accessing microphone:", error)
        toast({
          title: "Microphone Access Denied",
          description: "Please enable microphone access to use the interview feature.",
          variant: "destructive",
        })
      }
    }

    setupMediaRecorder()

    return () => {
      // Clean up
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop()
      }
    }
  }, [])

  // Timer functionality
  useEffect(() => {
    if (isRecording && !isPaused) {
      startTimeRef.current = Date.now() - elapsedTime * 1000

      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
          setElapsedTime(elapsed)

          // Update remaining time
          const caseType = caseSession ? CASE_TYPES.find((c) => c.id === caseSession.case_type) : null
          const totalSeconds = (caseType?.duration || 45) * 60
          const remaining = Math.max(0, totalSeconds - elapsed)
          setRemainingTime(remaining)
        }
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, isPaused, elapsedTime, caseSession])

  // Save progress periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (caseSession && (isRecording || elapsedTime > 0)) {
        handleSaveProgress()
      }
    }, 30000) // Save every 30 seconds

    return () => clearInterval(saveInterval)
  }, [caseSession, isRecording, elapsedTime, notes])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Simulate network connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(navigator.onLine)
    }

    window.addEventListener("online", checkConnection)
    window.addEventListener("offline", checkConnection)

    return () => {
      window.removeEventListener("online", checkConnection)
      window.removeEventListener("offline", checkConnection)
    }
  }, [])

  const handleStartRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "inactive") {
      audioChunks.current = []
      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)
      toast({
        title: "Recording Started",
        description: "Your interview is now being recorded.",
      })
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop()
    }
    setIsRecording(false)
    setIsPaused(false)

    // Save progress when stopping
    handleSaveProgress()
  }

  const handlePauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause()
    }
    setIsPaused(true)
  }

  const handleResumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume()
    }
    setIsPaused(false)
  }

  const handleSaveProgress = async () => {
    if (!caseSession || !user) return

    try {
      const { error } = await caseService.updateCaseSession(caseSession.id, {
        duration_minutes: Math.floor(elapsedTime / 60),
        notes: notes,
      })

      if (error) {
        console.error("Error saving progress:", error)
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleCompleteInterview = async () => {
    if (!caseSession || !user) return

    try {
      // Stop recording if active
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop()
      }

      // Update case session as completed
      const { error } = await caseService.updateCaseSession(caseSession.id, {
        duration_minutes: Math.floor(elapsedTime / 60),
        notes: notes,
        completed: true,
        performance_rating: "Good", // This would be determined by AI in a real app
      })

      if (error) {
        console.error("Error completing interview:", error)
        toast({
          title: "Error",
          description: "Could not complete the interview. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Add skill assessment
      await caseService.addSkillAssessment({
        user_id: user.id,
        session_id: caseSession.id,
        math_score: 75, // These would be determined by AI in a real app
        structure_score: 80,
        creativity_score: 70,
      })

      toast({
        title: "Interview Completed",
        description: "Your case interview has been saved and analyzed.",
      })

      // Navigate to results page
      router.push(`/interview/${id}/results`)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: "user" as const,
      content: inputMessage,
      timestamp: new Date().toISOString(),
      hasExhibit: false,
      exhibitId: null,
      isEnd: false,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    console.log(`[SEND_MSG] Sending user message. Current history length: ${updatedMessages.length}`);

    // Prepare messages for API (limit history if needed)
    const messagesForApi = updatedMessages.slice(-10).map(msg => ({ role: msg.role, content: msg.content }));

    try {
      console.log(`[SEND_MSG] Calling /api/chat with caseType: ${caseSession?.case_type}`);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesForApi,
          caseType: caseSession?.case_type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const rawAiResponse = data.response;

      if (rawAiResponse) {
          // Parse the raw response
          const { prose, exhibits: newExhibits } = parseReply(rawAiResponse);
          console.log("[SEND_MSG] Parsed AI response - Prose:", prose, "Exhibits:", newExhibits);

          const aiResponseMessage = {
            id: Date.now() + 1, // Ensure unique ID
            role: "assistant" as const,
            content: prose, // Use parsed prose
            timestamp: new Date().toISOString(),
            hasExhibit: newExhibits.length > 0,
            exhibitId: null, // Deprecate this?
            isEnd: false, // Determine end based on content later if needed
          };
          setMessages(prev => [...prev, aiResponseMessage]);

          // Update exhibits state - Append new exhibits
          if (newExhibits.length > 0) {
             setExhibits(prev => [...prev, ...newExhibits]);
          }

          // Play audio for the prose part
          if (isTtsEnabled && prose) {
            console.log(`[SEND_MSG] TTS enabled. Requesting audio for AI response.`);
            try {
                 const audioResponse = await fetch('/api/speak', {
                   method: 'POST',
                   headers: {'Content-Type': 'application/json'},
                   body: JSON.stringify({ text: prose }), // Send prose for TTS
                 });
                  if (!audioResponse.ok) throw new Error('Speak API failed');
                  const audioBlob = await audioResponse.blob();
                  const audioUrl = URL.createObjectURL(audioBlob);
                  const audio = new Audio(audioUrl);
                  
                  console.log("Playing AI audio response...");
                  audio.play().catch(e => console.error("Error playing audio:", e));

                  // Optional: Clean up the object URL after playing
                  audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    console.log("Audio finished, URL revoked.");
                  };
            } catch (ttsError) {
                 console.error("Error calling speak API or playing audio:", ttsError);
            }
          }
          
      } else {
        console.warn("[SEND_MSG] Received empty response content from API.");
        // Optionally add a message indicating empty response
      }

    } catch (error) {
      console.error("Error sending message or processing response:", error);
      toast({
        title: "Error",
        description: "Could not get response from AI. Please check connection or try again.",
        variant: "destructive",
      });
      // Add a message indicating AI error?
      const aiErrorMessage = {
         id: Date.now() + 1,
         role: "assistant" as const,
         content: "Sorry, I encountered an error. Please try again.",
         timestamp: new Date().toISOString(),
         isError: true, // Add flag if needed
      };
      setMessages(prev => [...prev, aiErrorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send message on Shift+Enter
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }

    // Handle keyboard shortcuts
    if (e.ctrlKey) {
      switch (e.key) {
        case "e":
          e.preventDefault()
          setShowExhibit(!showExhibit)
          break
        case "n":
          e.preventDefault()
          setShowNotes(!showNotes)
          break
        case "m":
          e.preventDefault()
          if (isRecording && !isPaused) {
            handlePauseRecording()
          } else if (isRecording && isPaused) {
            handleResumeRecording()
          } else {
            handleStartRecording()
          }
          break
      }
    }
  }

  const handleAddClarification = () => {
    setInputMessage("Could you please clarify what you mean by...?")
    // Focus the input
    const inputElement = document.getElementById("message-input")
    if (inputElement) {
      inputElement.focus()
    }
  }

  const handleExitInterview = () => {
    handleSaveProgress()
    router.push("/dashboard")
  }

  // Find case type details (includes exhibits)
  const caseType = caseSession
    ? CASE_TYPES.find((c) => c.id === caseSession!.case_type)
    : null;

  // Derive exhibits from caseType, provide empty array as fallback
  const currentExhibits = caseType?.exhibits || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Navigation Bar */}
      <InterviewHeader
        caseType={caseType ?? null}
        isRecording={isRecording}
        isPaused={isPaused}
        elapsedTime={elapsedTime}
        remainingTime={remainingTime}
        isConnected={isConnected}
        isTtsEnabled={isTtsEnabled}
        onExit={handleExitInterview}
        onTtsToggle={setIsTtsEnabled}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col ${showExhibit && isPinned ? "mr-[350px]" : ""}`}>
          {/* Chat Transcript */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900">
            <div className="max-w-4xl mx-auto">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onExhibitClick={() => {
                    console.log(`[onExhibitClick] Triggered for message ID: ${message.id}, Exhibit ID: ${message.exhibitId}`);
                    if (message.hasExhibit && message.exhibitId && caseSession) {
                      const caseType = CASE_TYPES.find((c) => c.id === caseSession.case_type);
                      const currentExhibits = caseType?.exhibits || [];
                      const numExhibitId = parseInt(String(message.exhibitId), 10);
                      console.log(`[onExhibitClick] Looking for Exhibit ID: ${numExhibitId} in caseType: ${caseSession.case_type}`);
                      console.log(`[onExhibitClick] currentExhibits:`, JSON.stringify(currentExhibits));
                      const exhibitIndex = currentExhibits.findIndex(ex => ex.id === numExhibitId);
                      console.log(`[onExhibitClick] Found exhibit index: ${exhibitIndex}`);
                      if (exhibitIndex !== -1) {
                        setCurrentExhibit(exhibitIndex);
                        setShowExhibit(true);
                      } else {
                        console.warn(`[onExhibitClick] Exhibit with ID ${numExhibitId} clicked but not found in CASE_TYPES.`);
                        toast({ title: "Exhibit Not Found", description: `Details for Exhibit ${numExhibitId} could not be loaded.`, variant: "destructive" });
                      }
                    } else {
                      console.warn("[onExhibitClick] Clicked but message lacked exhibit info or session.");
                    }
                  }}
                />
              ))}
              <div ref={messagesEndRef} />

              {/* Voice waveform when recording */}
              {isRecording && !isPaused && (
                <div className="flex justify-end mb-4">
                  <VoiceWaveform />
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleAddClarification}
                    className="rounded-lg bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4 mr-1.5 text-purple-500" />
                    Need Clarification?
                  </Button>

                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setShowNotes(!showNotes)}
                    className={`rounded-lg transition-colors ${ 
                      showNotes
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-200/70 dark:hover:bg-purple-900/50"
                        : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <FileText className="h-4 w-4 mr-1.5" />
                    Scratchpad
                  </Button>

                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setShowCalculator(!showCalculator)}
                    className={`rounded-lg transition-colors ${ 
                      showCalculator
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-200/70 dark:hover:bg-purple-900/50"
                        : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <Calculator className="h-4 w-4 mr-1.5" />
                    Calculator
                  </Button>

                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setShowExhibit(!showExhibit)}
                    className={`rounded-lg transition-colors ${ 
                      showExhibit
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-200/70 dark:hover:bg-purple-900/50"
                        : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <ImageIcon className="h-4 w-4 mr-1.5" />
                    Exhibits
                  </Button>

                  {!isRecording ? (
                    <Button
                      onClick={handleStartRecording}
                      variant="default"
                      size="default"
                      className="rounded-lg bg-green-600 hover:bg-green-700 ml-auto transition-colors"
                    >
                      <Mic className="h-4 w-4 mr-1.5" />
                      Start Recording
                    </Button>
                  ) : (
                    <>
                      {isPaused ? (
                        <Button
                          onClick={handleResumeRecording}
                          variant="outline"
                          size="sm"
                          className="rounded-lg border-amber-500 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950 ml-auto"
                        >
                          <PlayCircle className="h-4 w-4 mr-1.5" />
                          Resume
                        </Button>
                      ) : (
                        <Button
                          onClick={handlePauseRecording}
                          variant="outline"
                          size="sm"
                          className="rounded-lg border-amber-500 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950 ml-auto"
                        >
                          <PauseCircle className="h-4 w-4 mr-1.5" />
                          Pause
                        </Button>
                      )}
                      <Button onClick={handleStopRecording} variant="destructive" size="sm" className="rounded-lg">
                        <MicOff className="h-4 w-4 mr-1.5" />
                        Stop
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Textarea
                    id="message-input"
                    placeholder="Type your response here... (Shift+Enter to send)"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[100px] resize-none rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-600/50 transition-shadow duration-200"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="self-end rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-transform duration-150 ease-in-out hover:scale-105"
                  >
                    <Send className="h-4 w-4 mr-1.5" />
                    Send
                  </Button>
                </div>

                {/* Calculator Widget */}
                <AnimatePresence>
                  {showCalculator && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CalculatorWidget
                        onInsertResult={(result) => {
                          setInputMessage((prev) => `${prev}${prev ? " " : ""}${result}`)
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Exhibit Panel - Pass currentExhibits */}
        <AnimatePresence>
          {showExhibit && currentExhibits.length > 0 && (
            <div className={`w-[350px] ${isPinned ? "fixed top-[61px] right-0 bottom-0" : ""}`}>
              <ExhibitPanel
                exhibits={currentExhibits}
                currentExhibit={currentExhibit}
                onClose={() => setShowExhibit(false)}
                onPin={() => setIsPinned(!isPinned)}
                isPinned={isPinned}
                onNext={() => setCurrentExhibit((prev) => Math.min(prev + 1, currentExhibits.length - 1))}
                onPrev={() => setCurrentExhibit((prev) => Math.max(prev - 1, 0))}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Notes Panel (Slide from bottom) */}
      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 h-[40vh] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-20 shadow-lg"
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                Notes & Framework
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowNotes(false)} className="rounded-lg">
                  Close
                </Button>
              </div>
            </div>
            <div className="p-4 h-[calc(40vh-57px)] overflow-y-auto">
              <FrameworkCanvas value={notes} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Meter */}
      <div className="fixed bottom-4 right-4 z-30">
        <ProgressMeter currentStep={currentStep} />
      </div>

      {/* TODO: Replace placeholder with actual chart component */}
      {/* Example: Pass chartData to your chart component */}
      {/* <div className="fixed top-20 right-4 z-10 w-80 h-60 bg-white dark:bg-slate-800 shadow-lg rounded-lg p-4">
        <h4 className="font-medium mb-2">Market Share</h4>
        {chartData ? (
          <YourChartComponent data={chartData} />
        ) : (
          <p className="text-sm text-slate-500">No chart data available.</p>
        )}
      </div> */}
    </div>
  )
}
