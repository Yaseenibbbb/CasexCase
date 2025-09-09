"use client"

import type React from "react"

// Force dynamic rendering for this client component
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, PauseCircle, PlayCircle, Calculator, HelpCircle, FileText, ImageIcon, Send, Loader2, Square, XCircle, X, LayoutGrid, Notebook, Pin } from "lucide-react"
import { Button, Textarea, Tooltip, Spinner, Card, CardBody, Image as NextUIImage } from "@heroui/react"
import { useAuth } from "@/context/auth-context"
import { caseService } from "@/lib/case-service"
import { CASE_TYPES, type CaseType } from "@/lib/data"
import { toast } from "@/components/ui/use-toast"
import type { SupabaseClient } from '@supabase/supabase-js'
import { parseReply, type Exhibit } from "@/lib/parseExhibits"
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from "@/lib/utils"
import { InterviewHeader } from "@/components/interview/InterviewHeader"
import { ChatMessage } from "@/components/interview/ChatMessage"
import { VoiceWaveform } from "@/components/interview/VoiceWaveform"
import { CalculatorWidget } from "@/components/interview/CalculatorWidget"
import { FrameworkCanvas } from "@/components/interview/FrameworkCanvas"
import { ExhibitPanel } from "@/components/interview/ExhibitPanel"
import { ProgressMeter } from "@/components/interview/ProgressMeter"

// --- Define Cassidy Voice ID --- 
const CASSIDY_VOICE_ID = "56AoDkrOh6qfVPDXZ7Pt";
// ------------------------------

// Define a type for the chart data we expect (Potentially redundant if Exhibit type is sufficient)
interface ChartDataPoint {
  label: string;
  value: number;
}

// Define interaction states
type InteractionState = 'IDLE' | 'USER_TURN' | 'AI_PROCESSING' | 'AI_SPEAKING' | 'USER_RECORDING';

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [caseSession, setCaseSession] = useState<any | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [remainingTime, setRemainingTime] = useState(0)
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [showExhibit, setShowExhibit] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [exhibits, setExhibits] = useState<Exhibit[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isConnected, setIsConnected] = useState(true)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [isTtsEnabled, setIsTtsEnabled] = useState(true)
  const audioChunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const [interactionState, setInteractionState] = useState<InteractionState>('IDLE')
  const [isInterviewActive, setIsInterviewActive] = useState(false)
  const [selectedExhibitId, setSelectedExhibitId] = useState<number | null>(null)
  const [panelExhibitIndex, setPanelExhibitIndex] = useState(0)
  const [sessionVoiceId, setSessionVoiceId] = useState<string | null>(null)
  const [caseContext, setCaseContext] = useState<any>(null) // Store structured case data for AI context
  
  // --- Add state for conditional rendering (to replace comments) ---
  const [showLeftPanel_DEBUG, setShowLeftPanel_DEBUG] = useState(true); 
  const [showRightPanel_DEBUG, setShowRightPanel_DEBUG] = useState(true);
  const [showExhibitModal_DEBUG, setShowExhibitModal_DEBUG] = useState(false);
  // ----------------------------------------------------------------

  // --- State for Sentence-by-Sentence TTS --- 
  const [ttsSentenceQueue, setTtsSentenceQueue] = useState<string[]>([]);
  const [ttsAudioQueue, setTtsAudioQueue] = useState<string[]>([]); // Store audio URLs
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(0);
  const [isTTSPlaying, setIsTTSPlaying] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null); 
  // --- Ref to prevent double initial trigger --- 
  const initialLoadTriggeredRef = useRef<boolean>(false);
  // -------------------------------------------

  // --- Calculator Helpers (Keep related logic together) ---
  const closeCalculator = useCallback(() => {
    setShowCalculator(false);
  }, []);
  const calculatorRef = useClickOutside<HTMLDivElement>(closeCalculator);
  const handleInsertCalculatorResult = useCallback((result: string) => {
    setInputMessage((prev) => prev + result);
    // closeCalculator(); 
  }, []);
  // --------------------------------------------------------

  // --- TTS Helper Functions (Define BEFORE use) ---
  const splitIntoSentences = (text: string): string[] => {
    if (!text) return [];
    const sentences = text.match(/[^.!?]+[.!?\s]*|[^.!?]+$/g) || [];
    return sentences.map(s => s.trim()).filter(s => s.length > 0);
  };

  // --- Unified Audio Playback Function --- 
  const playAudioForCurrentIndex = useCallback(async () => {
    if (!ttsSentenceQueue || currentPlayingIndex >= ttsSentenceQueue.length) {
      console.log("[playAudio] Index out of bounds or queue empty.");
      // The cleanup effect will handle the end state
      return; 
    }

    const sentence = ttsSentenceQueue[currentPlayingIndex];
    console.log(`[playAudio] Playing index ${currentPlayingIndex}: "${sentence.substring(0,30)}..."`);
    
    // Cleanup previous player if exists
    if (audioPlayerRef.current) {
       audioPlayerRef.current.onended = null;
       audioPlayerRef.current.onerror = null;
       // Don't pause here, let the new audio start
    }

    try {
      const audioResponse = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sentence, voiceId: CASSIDY_VOICE_ID }),
      });
      if (!audioResponse.ok) throw new Error('Speak API failed for sentence');
      const audioBlob = await audioResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const newAudio = new Audio(audioUrl);
      audioPlayerRef.current = newAudio;

      const handleEnded = () => {
          console.log(`[playAudio] Finished index ${currentPlayingIndex}`);
          URL.revokeObjectURL(audioUrl);
          setCurrentPlayingIndex(prev => prev + 1); // Increment index
          audioPlayerRef.current = null; // Clear ref after finish
      };

      const handleError = (e: Event | string) => {
          console.error(`[playAudio] Audio playback error for index ${currentPlayingIndex}:`, e);
          URL.revokeObjectURL(audioUrl);
          setCurrentPlayingIndex(prev => prev + 1); // Increment index to skip failed sentence
          audioPlayerRef.current = null; // Clear ref after error
      };
      
      newAudio.addEventListener('ended', handleEnded);
      newAudio.addEventListener('error', handleError);

      await newAudio.play();
      console.log(`[playAudio] Started playback for index ${currentPlayingIndex}`);
    } catch (error) {
      console.error(`[playAudio] Error fetching/playing audio for index ${currentPlayingIndex}:`, error);
      setCurrentPlayingIndex(prev => prev + 1); // Increment index to skip failed fetch
    }
  }, [currentPlayingIndex, ttsSentenceQueue]); // Dependencies

  // --- Modified startSentenceTTS to use a single chat bubble --- 
  const startSentenceTTS = (prose: string) => { 
    const sentences = splitIntoSentences(prose);
    if (sentences.length > 0) {
      console.log("[startTTS] Starting TTS Queue. Sentences count:", sentences.length);
      
      // Stop any ongoing playback immediately
      if (audioPlayerRef.current) {
          console.log("[startTTS] Stopping previous audio.");
          audioPlayerRef.current.pause();
          audioPlayerRef.current.onended = null; 
          audioPlayerRef.current.onerror = null;
          audioPlayerRef.current = null;
      }
      
      // *** MODIFIED: Add a single message bubble for the entire prose ***
      const newMessageId = Date.now() + Math.random();
      const fullMessage = {
        id: newMessageId,
        role: "assistant" as const,
        content: prose,
        timestamp: new Date().toISOString(),
        hasExhibit: false, 
        exhibitId: null,
        isEnd: false,
      };
      
      setMessages(prev => {
        // Check if the last message has the same content to avoid duplicates
        if (prev.length > 0 && prev[prev.length - 1].content === prose) {
          return prev;
        }
        return [...prev, fullMessage];
      });

      // Set up the audio queue and start playing state
      setTtsSentenceQueue(sentences); 
      setCurrentPlayingIndex(0); // Reset index to start
      setIsTTSPlaying(true); 
      setInteractionState('AI_SPEAKING'); 
    } else {
      console.log("[startTTS] No sentences found to play.");
      setInteractionState('USER_TURN'); 
    }
  };

  // --- Modified Playback Trigger Effect to handle single bubble --- 
  useEffect(() => {
      console.log(`[Playback Effect] Check - isTTSPlaying: ${isTTSPlaying}, index: ${currentPlayingIndex}, queueLength: ${ttsSentenceQueue.length}`);
      if (isTTSPlaying && currentPlayingIndex < ttsSentenceQueue.length) {
          // *** MODIFIED: No longer adding UI bubbles per sentence, just play the audio ***
          console.log(`[Playback Effect] Playing audio for index ${currentPlayingIndex}.`);
          playAudioForCurrentIndex();
      }
  }, [isTTSPlaying, currentPlayingIndex, ttsSentenceQueue, playAudioForCurrentIndex]); 

  // --- Cleanup Effect (Re-added) --- 
  useEffect(() => {
    // Check if playing, index reached end, AND the queue had items initially
    if (isTTSPlaying && currentPlayingIndex >= ttsSentenceQueue.length && ttsSentenceQueue.length > 0) {
      console.log("[TTS Cleanup Effect] End condition met. Cleaning up and setting USER_TURN.");
      
      // Stop and clear any lingering audio player
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.onended = null;
        audioPlayerRef.current.onerror = null;
        audioPlayerRef.current = null;
      }

      // Reset TTS state
      setIsTTSPlaying(false);
      setTtsSentenceQueue([]);
      setCurrentPlayingIndex(0); // Reset index for next time

      // Set interaction state
      setInteractionState('USER_TURN');
      console.log("[TTS Cleanup Effect] State hopefully set to USER_TURN.");
    }
  }, [isTTSPlaying, currentPlayingIndex, ttsSentenceQueue.length]); // Dependencies

  // Fetch case session data
  useEffect(() => {
    const initializeInterview = async () => {
      try {
        setIsLoading(true);
        
        // Check for offline session data first
        let sessionData = null;
        if (id.startsWith('offline-session-')) {
          const storedData = sessionStorage.getItem(`case-session-${id}`);
          if (storedData) {
            sessionData = JSON.parse(storedData);
            console.log("[Interview] Loaded offline session data:", sessionData);
          }
        }
        
        // If no offline data found, try to fetch from Supabase
        if (!sessionData) {
          const { data, error } = await caseService.getCaseSession(id);
          if (error || !data) {
            toast({
              title: "Error",
              description: "Could not load interview session",
              variant: "destructive",
            });
            return;
          }
          sessionData = data;
        }
        
        setCaseSession(sessionData);
        setIsInterviewActive(true);
        setShowLeftPanel_DEBUG(true);
        setShowRightPanel_DEBUG(true);
        
        // Debug: Log the session data structure
        console.log("[Interview] Full session data:", sessionData);
        console.log("[Interview] Generated case data:", sessionData?.generated_case_data);
        
        // Store structured case context for AI evaluation
        if (sessionData.generated_case_data) {
          const caseData = sessionData.generated_case_data as any;
          setCaseContext({
            caseMeta: caseData.caseMeta,
            sections: caseData.sections,
            exhibits: caseData.exhibits,
            solutionGuide: caseData.solutionGuide,
            caseType: sessionData.case_type,
            caseTitle: sessionData.case_title
          });
        }
        
        // Initialize messages if empty
        if (!messages.length && sessionData.case_type && sessionData.generated_case_data) {
          const caseType = CASE_TYPES.find(type => type.id === sessionData.case_type);
          if (caseType) {
            await triggerInitialAIMessage(caseType, sessionData.generated_case_data);
          }
        }
      } catch (error) {
        console.error("Failed to initialize interview:", error);
        toast({
          title: "Error",
          description: "Failed to initialize interview",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id && !initialLoadTriggeredRef.current) {
      initialLoadTriggeredRef.current = true;
      initializeInterview();
    }
  }, [id]);

  // *** Modify function signature to accept generatedData ***
  const triggerInitialAIMessage = async (loadedCaseType: CaseType, generatedData: any) => {
    console.log(`[TRIGGER_INIT] Entered triggerInitialAIMessage for case type: ${loadedCaseType.id}`);

    setInteractionState('AI_PROCESSING'); // Briefly show processing while we set up

    try {
      // --- Use the passed generatedData --- 
      if (!generatedData) {
         // Use a slightly more specific error message now
         throw new Error("Generated case data provided to trigger function is missing.");
      }
      
      // Store case context for the AI
      setCaseContext({
        caseMeta: generatedData.caseMeta || {},
        sections: generatedData.sections || {},
        exhibits: generatedData.exhibits || [],
        solutionGuide: generatedData.solutionGuide || null
      });

      // Try to use the new live interviewer system first
      try {
        const response = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'interview',
            caseMeta: generatedData.caseMeta || {},
            userMessage: 'Start the interview with the first message template.'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const initialPresentationText = data.text;
          const initialExhibits = generatedData?.exhibits || [];

          // Add the initial AI message
          const initialMessage = {
            id: Date.now(),
            type: 'ai' as const,
            content: initialPresentationText,
            timestamp: new Date(),
            isTyping: false
          };

          setMessages([initialMessage]);
          
          // Start TTS for the initial presentation
          if (isTtsEnabled && initialPresentationText) {
            await startSentenceTTS(initialPresentationText);
          }

          setInteractionState('USER_TURN');
          return;
        }
      } catch (apiError) {
        console.warn('[TRIGGER_INIT] New AI chat API failed, falling back to old system:', apiError);
      }
      
      // Fallback to old system
      let initialPresentationText = '';
      let initialExhibits = [];
      
      // Check for new CaseByCase structure first
      if (generatedData?.sections?.interviewerScript) {
        // Extract opening prompt from interviewer script
        const scriptMatch = generatedData.sections.interviewerScript.match(/\*\*Opening Prompt[^*]*\*\*:?\s*([^*]+)/i);
        if (scriptMatch) {
          initialPresentationText = scriptMatch[1].trim();
        } else {
          // If no specific opening prompt found, use the first paragraph or the whole script
          const firstParagraph = generatedData.sections.interviewerScript.split('\n')[0];
          initialPresentationText = firstParagraph || generatedData.sections.interviewerScript;
        }
        
        // Add full case details to the presentation (TTS-friendly)
        const caseTitle = generatedData.caseMeta?.title || 'Case Study';
        const background = generatedData.sections?.background || '';
        const objectives = generatedData.sections?.objectives || '';
        const tasks = generatedData.sections?.tasks || '';
        
        // Create comprehensive case presentation (TTS-friendly, no markdown)
        let fullCasePresentation = initialPresentationText;
        
        if (caseTitle) {
          fullCasePresentation += `\n\n${caseTitle}`;
        }
        
        if (background) {
          fullCasePresentation += `\n\nBackground: ${background}`;
        }
        
        if (objectives) {
          fullCasePresentation += `\n\nObjectives: ${objectives}`;
        }
        
        if (tasks) {
          fullCasePresentation += `\n\nYour Task: ${tasks}`;
        }
        
        initialPresentationText = fullCasePresentation;
        initialExhibits = generatedData?.exhibits || [];
      } else if (generatedData?.caseFacts?.initialPresentationText) {
        // Fallback to old structure
        initialPresentationText = generatedData.caseFacts.initialPresentationText;
        initialExhibits = generatedData?.exhibits || [];
      } else if (generatedData?.caseMeta) {
        // Handle demo mode structure - create a proper opening based on case data
        const caseTitle = generatedData.caseMeta.title || 'this case study';
        const industry = generatedData.caseMeta.industry || 'business';
        const company = generatedData.caseMeta.company || 'the client';
        const background = generatedData.sections?.background || '';
        const tasks = generatedData.sections?.tasks || '';
        
        let fullCasePresentation = `Hello, I'm Polly, your case interviewer. We'll be discussing ${caseTitle} involving ${company} in the ${industry} industry.`;
        
        if (background) {
          fullCasePresentation += `\n\nBackground: ${background}`;
        }
        
        if (tasks) {
          fullCasePresentation += `\n\nYour Task: ${tasks}`;
        } else {
          fullCasePresentation += `\n\nYour task is to work through this problem and provide a recommendation.`;
        }
        
        fullCasePresentation += `\n\nLet's start by hearing your approach.`;
        
        initialPresentationText = fullCasePresentation;
        initialExhibits = generatedData?.exhibits || [];
      }

      if (!initialPresentationText) {
         console.error("[TRIGGER_INIT] Could not find initialPresentationText in generated_case_data:", generatedData);
         // Create a fallback presentation text instead of throwing error
         const caseType = loadedCaseType?.title || "this case";
         const fallbackText = `Hello, I'm Polly, your case interviewer today. We'll be discussing ${caseType}. Your task today is to work through this case and provide a recommendation. Let's start by hearing your approach to this problem.`;
         console.log("[TRIGGER_INIT] Using fallback presentation text:", fallbackText);
         
         // Update state with fallback
         if (isTtsEnabled) {
            startSentenceTTS(fallbackText);
         } else {
            const fallbackMessage = {
               id: Date.now(),
               role: "assistant" as const,
               content: fallbackText,
               timestamp: new Date().toISOString(),
               hasExhibit: false,
               exhibitId: null,
               isEnd: false,
            };
            setMessages([fallbackMessage]);
            setInteractionState('USER_TURN');
         }
         return; // Exit function after handling fallback
      }
      
      console.log("[TRIGGER_INIT] Using pre-generated presentation text:", initialPresentationText);
      console.log("[TRIGGER_INIT] Using pre-generated exhibits:", initialExhibits);
      
      // Update exhibits state if there are any pre-generated ones
      if (initialExhibits.length > 0) {
           setExhibits(initialExhibits);
      }
      
      // Play audio using the new sentence-by-sentence method
      if (isTtsEnabled && initialPresentationText) {
         startSentenceTTS(initialPresentationText); 
      } else {
          console.log("[TRIGGER_INIT] TTS not enabled or no prose. Adding full message.");
          // *** If TTS disabled, add the full content as one bubble ***
          const fullMessage = {
              id: Date.now(),
              role: "assistant" as const,
              content: initialPresentationText,
              timestamp: new Date().toISOString(),
              // Check if any initial exhibits need linking? 
              // For simplicity, assume initial presentation doesn't *introduce* an exhibit inline.
              hasExhibit: false, 
              exhibitId: null, 
              isEnd: false, 
          };
          setMessages([fullMessage]);
          setInteractionState('USER_TURN'); 
      }

      setCurrentStep(0); 
      setIsInterviewActive(true); // Mark interview as active
      // --- END NEW LOGIC --- 

    } catch (error) {
      console.error("Error triggering initial AI message:", error);
      toast({
        title: "AI Initialization Error",
        description: error instanceof Error ? error.message : "Could not start the AI interviewer.",
        variant: "destructive",
      });
      setIsInterviewActive(false);
      setInteractionState('IDLE'); // Reset state on error
      // Reset TTS state if error occurs during setup
      setIsTTSPlaying(false);
      setTtsSentenceQueue([]);
      if (audioPlayerRef.current) { audioPlayerRef.current.pause(); audioPlayerRef.current = null; }
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
    if (isInterviewActive && !isPaused) {
      startTimeRef.current = Date.now() - elapsedTime * 1000

      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = Date.now()
          const elapsed = Math.floor((now - startTimeRef.current) / 1000)
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
  }, [isInterviewActive, isPaused, elapsedTime, caseSession])

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
    if (interactionState !== 'USER_TURN') {
        console.warn("[RECORD] Cannot start recording, not user's turn. State:", interactionState);
        return;
    }
    if (mediaRecorder) {
      console.log("[RECORD] Starting recording...");
      audioChunks.current = []; // Clear previous chunks
      mediaRecorder.start();
      setIsRecording(true);
      setInteractionState('USER_RECORDING'); // Update state
    } else {
        console.error("[RECORD] MediaRecorder not initialized.");
         toast({ title: "Error", description: "Could not start recording. Please check microphone permissions.", variant: "destructive" });
    }
  }

  const handleStopRecording = async () => { // Make async if transcription is async
    if (interactionState !== 'USER_RECORDING') {
        console.warn("[RECORD] Cannot stop recording, not currently recording. State:", interactionState);
        return;
    }
    if (mediaRecorder) {
      console.log("[RECORD] Stopping recording...");
      mediaRecorder.stop(); 
      setIsRecording(false);
      setInteractionState('AI_PROCESSING'); // AI needs to process the audio

      // --- Placeholder for Transcription and AI Response --- 
      // 1. Combine audio chunks
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      audioChunks.current = []; // Clear chunks after creating blob

      if (audioBlob.size === 0) {
          console.warn("[RECORD] No audio data captured.");
          toast({ title: "Warning", description: "No audio was recorded.", variant: "default" });
          setInteractionState('USER_TURN'); // Go back to user turn if no audio
          return;
      }
      
      console.log("[RECORD] Audio Blob size:", audioBlob.size, "Type:", audioBlob.type);
      
      // 2. Send audioBlob to transcription API (replace with actual implementation)
      // const transcribedText = await transcribeAudio(audioBlob);
      // MOCK: Replace with actual transcription call
      const transcribedText = "This is the simulated transcribed text from the user's recording.";
      console.log("[RECORD] Mock Transcription:", transcribedText);
      
      // 3. Process the transcribed text like a regular message
      if (transcribedText) {
          await processOutgoingMessage(transcribedText, true); // Pass flag indicating it's from audio
      } else {
          console.error("[RECORD] Transcription failed or returned empty.");
          toast({ title: "Error", description: "Could not understand audio. Please try again.", variant: "destructive" });
          setInteractionState('USER_TURN'); // Let user try again
      }
      // --- End Placeholder ---

    } else {
        console.error("[RECORD] MediaRecorder not available to stop.");
    }
  };

  const handlePauseRecording = () => {
    if (!isInterviewActive) return;
    setIsPaused(true);
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause();
    }
    console.log("[TIMER] Paused");
  };

  const handleResumeRecording = () => {
    if (!isInterviewActive) return;
    setIsPaused(false);
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();
    }
    console.log("[TIMER] Resumed");
  };

  const handleSaveProgress = async () => {
    if (!caseSession || !user) return

    try {
      // For offline sessions, just update the stored data
      if (caseSession.id.startsWith('offline-session-')) {
        const updatedSession = {
          ...caseSession,
          duration_minutes: Math.floor(elapsedTime / 60),
          notes: notes,
          updated_at: new Date().toISOString()
        };
        sessionStorage.setItem(`case-session-${caseSession.id}`, JSON.stringify(updatedSession));
        setCaseSession(updatedSession);
        return;
      }

      // For regular sessions, update in Supabase
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

      // For offline sessions, just update the stored data
      if (caseSession.id.startsWith('offline-session-')) {
        const updatedSession = {
          ...caseSession,
          completed: true,
          performance_rating: "Good",
          duration_minutes: Math.floor(elapsedTime / 60),
          notes: notes,
          updated_at: new Date().toISOString()
        };
        sessionStorage.setItem(`case-session-${caseSession.id}`, JSON.stringify(updatedSession));
        console.log("[Interview Page] Offline session completed and stored:", updatedSession);

        toast({
          title: "Interview Completed",
          description: "Your offline interview session has been saved locally.",
        });

        router.push("/dashboard");
        return;
      }

      // For online sessions, update via Supabase
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
    if (interactionState !== 'USER_TURN') {
        console.warn("[SEND] Cannot send message, not user's turn. State:", interactionState);
        return;
    }
    const messageText = inputMessage.trim();
    if (!messageText) return; 

    setInputMessage(""); // Clear input immediately
    setInteractionState('AI_PROCESSING'); // AI needs to process the text
    
    await processOutgoingMessage(messageText, false); // Process the text message
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

  // --- Process Outgoing Message ---
  const processOutgoingMessage = async (userInput: string, fromAudio: boolean) => {
    console.log(`[PROCESS] Processing user input (fromAudio: ${fromAudio}):`, userInput);

    // Add user message to chat immediately
    const userMessage = {
        id: Date.now() + Math.random(), // Ensure unique ID
        role: "user" as const,
        content: userInput,
        timestamp: new Date().toISOString(),
        isAudio: fromAudio, // Indicate if it came from audio
    };
    // Use functional update to avoid stale state issues
    setMessages(prevMessages => [...prevMessages, userMessage]); 

    // Prepare messages for API (including the new user message)
    // Ensure correct format for API messages if different from display format
    const messagesForApi = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
    }));

    try {
        console.log(`[PROCESS] Sending to /api/ai-chat with caseType: ${caseSession?.case_type}`);

        // Try new live interviewer system first
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mode: 'interview',
                caseMeta: caseContext?.caseMeta || caseSession?.generated_case_data?.caseMeta || {},
                userMessage: userInput
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const rawAiResponse = data.text;

        if (rawAiResponse) {
            const { prose, exhibits: newExhibits } = parseReply(rawAiResponse);
            console.log("[PROCESS] Parsed AI response - Prose:", prose);
            // --- Log the actual exhibit structure ---
            console.log("[PROCESS] Parsed AI response - Exhibits Structure:", JSON.stringify(newExhibits, null, 2));
            // -----------------------------------------

            // --- Determine the exhibit ID if present ---
            // Assuming parseReply gives exhibits like [{ id: 1, content: "..."}]
            // And assuming only ONE exhibit can be introduced per AI message for simplicity now.
            // If multiple exhibits can be introduced, this logic needs refinement.
            const currentExhibitId = newExhibits.length > 0 ? newExhibits[0].id : null; 

            const messageId = Date.now(); // Generate ID once
            const aiResponseMessage = {
                id: messageId,
                role: "assistant" as const,
                content: "", // Start empty
                timestamp: new Date().toISOString(),
                hasExhibit: newExhibits.length > 0,
                exhibitId: currentExhibitId, // Assign the ID here
                isEnd: data.isEnd || false, 
            };
            // Add the empty message object
            setMessages(prevMessages => [...prevMessages, aiResponseMessage]);

            // Handle exhibits separately
            if (newExhibits.length > 0) {
                setExhibits(prevExhibits => [...prevExhibits, ...newExhibits]);
            }

            // Play TTS using the new sentence-by-sentence method
            if (isTtsEnabled && prose) {
                startSentenceTTS(prose); 
            } else {
                // *** If TTS disabled, add the full content as one bubble ***
                console.log("[PROCESS] TTS not enabled or no prose. Displaying full message.")
                const fullMessage = {
                    id: Date.now(),
                    role: "assistant" as const,
                    content: prose,
                    timestamp: new Date().toISOString(),
                    hasExhibit: newExhibits.length > 0,
                    exhibitId: newExhibits.length > 0 ? newExhibits[0].id : null, // Example: link first exhibit
                    isEnd: data.isEnd || false, 
                };
                setMessages(prevMessages => [...prevMessages, fullMessage]);
                
                 if (fullMessage.isEnd) {
                    setInteractionState('IDLE');
                 } else {
                    setInteractionState('USER_TURN');
                 }
            }

        } else {
            throw new Error("Empty response from API");
        }

    } catch (error) {
        console.error("Error with new AI chat API, falling back to old system:", error);
        
        // Fallback to old chat API
        try {
            const fallbackResponse = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: messagesForApi,
                    caseType: caseSession?.case_type,
                    generatedCaseData: caseSession?.generated_case_data 
                }),
            });

            if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                const rawAiResponse = fallbackData.response;

                if (rawAiResponse) {
                    const { prose, exhibits: newExhibits } = parseReply(rawAiResponse);
                    console.log("[PROCESS] Fallback - Parsed AI response - Prose:", prose);

                    const currentExhibitId = newExhibits.length > 0 ? newExhibits[0].id : null; 

                    const messageId = Date.now();
                    const aiResponseMessage = {
                        id: messageId,
                        role: "assistant" as const,
                        content: "",
                        timestamp: new Date().toISOString(),
                        hasExhibit: newExhibits.length > 0,
                        exhibitId: currentExhibitId,
                        isEnd: fallbackData.isEnd || false, 
                    };
                    setMessages(prevMessages => [...prevMessages, aiResponseMessage]);

                    if (newExhibits.length > 0) {
                        setExhibits(prevExhibits => [...prevExhibits, ...newExhibits]);
                    }

                    if (isTtsEnabled && prose) {
                        startSentenceTTS(prose); 
                    } else {
                        const fullMessage = {
                            id: Date.now(),
                            role: "assistant" as const,
                            content: prose,
                            timestamp: new Date().toISOString(),
                            hasExhibit: newExhibits.length > 0,
                            exhibitId: newExhibits.length > 0 ? newExhibits[0].id : null,
                            isEnd: fallbackData.isEnd || false, 
                        };
                        setMessages(prevMessages => [...prevMessages, fullMessage]);
                        
                        if (fullMessage.isEnd) {
                            setInteractionState('IDLE');
                        } else {
                            setInteractionState('USER_TURN');
                        }
                    }
                } else {
                    console.error("[PROCESS] Fallback - No AI response received");
                    setInteractionState('USER_TURN');
                }
            } else {
                console.error("[PROCESS] Fallback API also failed");
                setInteractionState('USER_TURN');
            }
        } catch (fallbackError) {
            console.error("[PROCESS] Fallback also failed:", fallbackError);
            toast({
                title: "Communication Error",
                description: "Could not communicate with the AI. Please try again.",
                variant: "destructive",
            });
            setInteractionState('USER_TURN');
        }
        
        // Reset TTS state as well
        setIsTTSPlaying(false);
        setTtsSentenceQueue([]);
        if (audioPlayerRef.current) { audioPlayerRef.current.pause(); audioPlayerRef.current = null; }
    };
};

  // --- MODIFIED: Exhibit Click Handler (Now primarily for potential future inline use) ---
  const handleExhibitClick = (exhibitId: number | null | undefined) => {
    console.log("[ExhibitClick] Clicked Exhibit ID:", exhibitId);
    if (exhibitId !== null && exhibitId !== undefined) {
      // Option 1: Still set selectedExhibitId if needed elsewhere
      setSelectedExhibitId(exhibitId);
      
      // Option 2: Directly open the panel to the clicked exhibit
      const index = exhibits.findIndex(ex => ex.id === exhibitId);
      if (index !== -1) {
        setPanelExhibitIndex(index); // Set panel index
        setShowExhibit(true); // Show the panel
      } else {
         console.warn("[ExhibitClick] Exhibit ID not found in current exhibits array.");
      }
      // setIsPinned(true); // Optional: Auto-pin when clicking inline
    } else {
      console.warn("[ExhibitClick] Clicked message has no exhibit ID.");
    }
  };

  // --- NEW: Handlers for Panel Navigation ---
  const handlePanelNext = () => {
    setPanelExhibitIndex((prev) => Math.min(prev + 1, exhibits.length - 1));
  };

  const handlePanelPrev = () => {
    setPanelExhibitIndex((prev) => Math.max(prev - 1, 0));
  };

  // --- NEW: Handler for the main Exhibits button ---
  const handleToggleExhibitPanel = () => {
    if (!showExhibit) {
      // Reset to first exhibit when opening, only if there are exhibits
      if (exhibits.length > 0) {
        setPanelExhibitIndex(0);
      } 
    }
    // Always toggle visibility
    setShowExhibit(prev => !prev);
  };

  const inputRef = useRef<HTMLTextAreaElement>(null); // Ref for the textarea

  // --- Add back memoized calculation needed by header ---
  const caseTypeData = useMemo(() => 
    caseSession?.case_type ? CASE_TYPES.find(ct => ct.id === caseSession.case_type) : null,
   [caseSession?.case_type]);
   
  const caseDuration = useMemo(() => 
    caseTypeData?.duration || 45, // Default to 45 if not found
  [caseTypeData]);
  //-------------------------------------------------------

  // --- Re-add calculation used by ProgressMeter --- 
  const progressPercent = useMemo(() => {
     if (!caseDuration || caseDuration <= 0) return 0;
     const totalDurationSeconds = caseDuration * 60;
     return Math.min(100, (elapsedTime / totalDurationSeconds) * 100);
  }, [elapsedTime, caseDuration]);
  // ---------------------------------------------

  // Utility to check if user requests visual info or is struggling
  const userRequestsExhibit = (userMessage: string, previousMessages: any[]): boolean => {
    const visualKeywords = [
      'show', 'visual', 'chart', 'table', 'graph', 'see', 'picture', 'image', 'exhibit', 'display', 'plot', 'diagram', 'figure'
    ];
    const struggleKeywords = [
      "don't understand", 'confused', 'clarify', 'explain again', 'repeat', 'lost', 'help', 'stuck'
    ];
    const lowerMsg = userMessage.toLowerCase();
    if (visualKeywords.some(k => lowerMsg.includes(k))) return true;
    if (struggleKeywords.some(k => lowerMsg.includes(k))) return true;
    // Check for repeated question (last user message same as previous user message)
    const userMsgs = previousMessages.filter(m => m.role === 'user');
    if (userMsgs.length >= 2 && userMsgs[userMsgs.length-1].content.trim() === userMsgs[userMsgs.length-2].content.trim()) {
      return true;
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!caseSession) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4 bg-background">
        <XCircle className="h-16 w-16 text-danger mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-foreground">Case Session Not Found</h2>
        <p className="text-foreground-500 mb-6 max-w-md">Could not load interview details. It might have been deleted or the ID is incorrect.</p>
        <Button color="primary" variant="flat" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-screen w-full flex-col bg-background overflow-hidden">
      <InterviewHeader
        caseType={caseTypeData ?? null}
        elapsedTime={elapsedTime}
        remainingTime={remainingTime}
        isConnected={isConnected}
        isTtsEnabled={isTtsEnabled}
        onExit={handleExitInterview}
        onTtsToggle={(enabled) => setIsTtsEnabled(enabled)} 
        currentStep={currentStep}
        caseTitle={caseSession?.case_title ?? "Case Interview"}
        totalDuration={caseDuration}
        onSave={handleSaveProgress}
        onComplete={handleCompleteInterview}
      />

      {/* Calculator Overlay */}
      {showCalculator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div ref={calculatorRef} className="relative max-w-full mx-4 shadow-2xl rounded-lg overflow-hidden">
            <CalculatorWidget 
              onInsertResult={handleInsertCalculatorResult} 
              onClose={() => setShowCalculator(false)} 
            />
          </div>
        </div>
      )}

      {/* Scratchpad/Notes Overlay */}
      {showNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl mx-4 shadow-2xl rounded-lg overflow-hidden">
            <FrameworkCanvas 
              value={notes} 
              onClose={() => setShowNotes(false)} 
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden bg-gradient-to-b from-background to-background/95">
        {/* Left Panel (Chat Area) - Conditionally Rendered */}
        {showLeftPanel_DEBUG && (
          <div className="flex flex-1 flex-col min-h-0 p-2 sm:p-3 lg:p-4 space-y-3 overflow-hidden order-2 lg:order-1 border-t lg:border-t-0 lg:border-r border-divider/30">
            <div ref={chatContainerRef} className="flex-1 min-h-0 flex flex-col-reverse overflow-y-auto pr-1 scroll-smooth scrollbar-thin scrollbar-thumb-content3 scrollbar-track-content1">
              <div className="space-y-3 pb-2">
                <AnimatePresence>
                  {messages.map((message, index) => {
                     const exhibitData = message.exhibitId ? exhibits.find(ex => ex.id === message.exhibitId) : null;
                     const previousMessage = messages[index - 1];
                     const showLabel = index === 0 || message.role !== previousMessage?.role; 
                     // Find the last user message before this one
                     let lastUserMsg = null;
                     for (let i = index - 1; i >= 0; i--) {
                       if (messages[i].role === 'user') {
                         lastUserMsg = messages[i].content;
                         break;
                       }
                     }
                     // Only show exhibit if this is an assistant message and the last user message requested/struggled
                     const shouldShowExhibit = message.role === 'assistant' && lastUserMsg && userRequestsExhibit(lastUserMsg, messages);
                     return (
                       <motion.div key={message.id || index} 
                         initial={{ opacity: 0, y: 10 }} 
                         animate={{ opacity: 1, y: 0 }} 
                         exit={{ opacity: 0, transition: { duration: 0.2 } }} 
                         layout
                         className={message.role === "assistant" ? "ml-0 mr-10 sm:ml-2 sm:mr-16" : "ml-10 mr-0 sm:ml-16 sm:mr-2"}
                       >
                         <ChatMessage
                           message={message} 
                           exhibitData={shouldShowExhibit ? exhibitData : null} 
                           showLabel={showLabel} 
                           onExhibitClick={() => handleExhibitClick(message.exhibitId)} 
                         />
                       </motion.div>
                     );
                  })}
                </AnimatePresence>
                {interactionState === 'AI_PROCESSING' && (
                  <div className="flex justify-start max-w-[80%] ml-1 sm:ml-3">
                     <Card shadow="sm" className="bg-content2/80 border border-content2">
                        <CardBody className="flex-row items-center gap-2 py-1.5 px-3">
                           <Spinner size="sm" color="primary" />
                           <span className="text-small text-foreground-500">AI is thinking...</span>
                        </CardBody>
                     </Card>
                  </div> 
                )}
                <div ref={messagesEndRef} /> 
              </div>
            </div>
            <div className="relative border-t border-divider/50 pt-3 bg-background/50 backdrop-blur-sm rounded-t-md">
               {isRecording && ( 
                  <div className="absolute bottom-full left-0 right-0 flex justify-center items-center bg-background/80 backdrop-blur-sm p-1.5 rounded-t-lg z-10 border-t border-l border-r border-danger/20">
                     <VoiceWaveform />
                     <span className="ml-2 text-sm font-medium text-danger animate-pulse">Recording...</span>
                  </div>
                )}
               <div className="flex items-end space-x-2">
                <Textarea
                   ref={inputRef} 
                   placeholder={
                     interactionState === 'AI_PROCESSING' ? "Wait for AI response..." :
                     interactionState === 'AI_SPEAKING' ? "AI is speaking..." :
                     interactionState === 'USER_RECORDING' ? "Recording audio..." :
                     "Type your response or question..."
                   }
                   value={inputMessage}
                   onChange={(e) => setInputMessage(e.target.value)}
                   onKeyDown={handleKeyDown}
                   minRows={1}
                   maxRows={5} 
                   variant="bordered"
                   className="flex-1 resize-none text-sm rounded-lg"
                   isDisabled={(interactionState as InteractionState) !== 'USER_TURN' && (interactionState as InteractionState) !== 'IDLE'} 
                   aria-label="Chat input"
                 />
                 <div className="flex items-center space-x-1.5">
                    <Tooltip content={isRecording ? "Stop Recording" : "Start Recording"} placement="top">
                        <Button
                          variant="flat" size="md" isIconOnly 
                          onClick={isRecording ? handleStopRecording : handleStartRecording}
                          isDisabled={((interactionState as InteractionState) !== 'USER_TURN' && (interactionState as InteractionState) !== 'USER_RECORDING') || ((interactionState as InteractionState) === 'USER_RECORDING' && !isRecording)} 
                          aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                          color={isRecording ? "danger" : "default"} 
                          className={`rounded-full ${isRecording ? 'animate-pulse bg-danger/20' : ''}`}
                        >
                          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />} 
                        </Button>
                    </Tooltip>
                    <Tooltip content="Send Message" placement="top">
                        <Button
                          color="primary" size="md" isIconOnly
                          onClick={handleSendMessage}
                          isDisabled={!inputMessage.trim() || (interactionState as InteractionState) !== 'USER_TURN' || isRecording} 
                          isLoading={(interactionState as InteractionState) === 'AI_PROCESSING'} 
                          aria-label="Send message"
                          className="rounded-full"
                        >
                          {! ((interactionState as InteractionState) === 'AI_PROCESSING') && <Send className="h-4 w-4" />}
                        </Button>
                    </Tooltip>
                 </div>
               </div>
            </div>
          </div>
        )}
        {/* Right Panel - Conditionally Rendered */}
        {showRightPanel_DEBUG && (
          <div className="flex flex-col w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-l border-divider/30 p-3 sm:p-4 space-y-3 bg-content1/30 backdrop-blur-sm overflow-y-auto h-60 lg:h-full min-h-0 order-1 lg:order-2">
            <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
              <span className="inline-block w-1.5 h-4 bg-primary rounded-sm"></span> 
              Tools & Exhibits
            </h2>

            {/* Case Showcase */}
            <Card className="bg-content1/70 backdrop-blur-sm shadow-sm border border-content2/30">
              <CardBody className="p-3">
                <h3 className="text-base font-semibold mb-1.5 text-foreground line-clamp-1 border-l-2 border-primary pl-2">
                  {(
                    caseSession?.generated_case_data?.caseMeta?.title ||
                    caseSession?.case_title ||
                    caseSession?.generated_case_data?.caseFacts?.ClientName ||
                    caseSession?.generated_case_data?.caseFacts?.BuyerName ||
                    caseSession?.generated_case_data?.caseFacts?.TargetName ||
                    caseSession?.case_title ||
                    'Case Study'
                  )}
                </h3>
                <p className="text-sm text-foreground-600 mb-1.5 line-clamp-3">
                  {(
                    caseSession?.generated_case_data?.sections?.background ||
                    caseSession?.generated_case_data?.caseFacts?.CompanyBackground ||
                    caseSession?.generated_case_data?.caseFacts?.BuyerBackground ||
                    caseSession?.generated_case_data?.caseFacts?.ClientBackground ||
                    caseSession?.generated_case_data?.caseFacts?.TargetBackground ||
                    caseSession?.generated_case_data?.sections?.objectives ||
                    caseSession?.generated_case_data?.sections?.tasks ||
                    "This is a case study interview. Work through the problem systematically and provide your recommendations."
                  )}
                </p>
                <p className="text-xs text-foreground-500 mb-1 line-clamp-1">
                  {(
                    caseSession?.generated_case_data?.caseMeta?.industry ||
                    caseSession?.generated_case_data?.caseFacts?.StrategicContext ||
                    caseSession?.generated_case_data?.caseFacts?.MarketContext ||
                    caseSession?.generated_case_data?.caseFacts?.Industry ||
                    caseSession?.case_type ||
                    ''
                  )}
                </p>
                <div className="text-xs text-foreground-500 bg-content2/30 p-2 rounded-sm">
                  <span className="font-medium text-primary-500">Case Type:</span>{" "}
                  {(
                    caseSession?.case_type?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) ||
                    'Diagnostic'
                  )}
                </div>
                
                {/* Debug: Show raw case data structure */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-xs">
                    <details>
                      <summary className="cursor-pointer font-medium">Debug: Case Data</summary>
                      <pre className="mt-1 text-xs overflow-auto max-h-32">
                        {JSON.stringify(caseSession?.generated_case_data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Progress Meter */}
            <div className="bg-content1/70 backdrop-blur-sm shadow-sm border border-content2/30 rounded-lg p-3">
              <div className="flex justify-between items-center mb-1.5">
                <h3 className="text-sm font-medium text-foreground-600">Progress</h3>
                <span className="text-xs font-medium text-primary-500">{Math.round(progressPercent)}%</span>
              </div>
              <ProgressMeter 
                currentStep={currentStep}
              />
            </div>

            {/* Tool Buttons */}
            <div className="mt-auto pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 mb-1">
                  <h3 className="text-sm font-medium text-foreground-600 mb-1.5">Interview Tools</h3>
                </div>
                {/* Calculator Button */}
                <Button 
                  variant="flat" 
                  onClick={() => setShowCalculator(prev => !prev)}
                  startContent={<Calculator size={14} />}
                  className="text-xs bg-content2/40 hover:bg-content2/70 font-medium"
                  size="sm"
                >
                  Calculator
                </Button>
                {/* Exhibits Button */}
                <Button 
                  variant="flat" 
                  onClick={handleToggleExhibitPanel}
                  isDisabled={exhibits.length === 0}
                  startContent={<FileText size={14} />}
                  className="text-xs bg-content2/40 hover:bg-content2/70 font-medium"
                  size="sm"
                >
                  {showExhibit ? "Hide Exhibits" : "Show Exhibits"}
                </Button>
                {/* Scratchpad Button */}
                <Button 
                  variant="flat" 
                  onClick={() => setShowNotes(prev => !prev)}
                  startContent={<Notebook size={14} />}
                  className="text-xs bg-content2/40 hover:bg-content2/70 font-medium"
                  size="sm"
                >
                  Scratchpad
                </Button>
                {/* Need Clarification Button */}
                <Button 
                  variant="flat" 
                  onClick={handleAddClarification}
                  isDisabled={interactionState !== 'AI_SPEAKING' && interactionState !== 'AI_PROCESSING'}
                  startContent={<HelpCircle size={14} />}
                  className="text-xs bg-content2/40 hover:bg-content2/70 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  size="sm"
                >
                  Clarify
                </Button>
                {/* Pause/Resume Timer Button */}
                <Button 
                  variant="flat" 
                  onClick={() => setIsPaused(prev => !prev)}
                  startContent={isPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                  className="text-xs bg-content2/40 hover:bg-content2/70 font-medium"
                  size="sm"
                >
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                {/* End Interview Button */}
                <Button 
                  variant="flat" 
                  color="danger"
                  onClick={handleCompleteInterview}
                  startContent={<XCircle size={14} />}
                  className="text-xs bg-danger/10 hover:bg-danger/20 font-medium"
                  size="sm"
                >
                  End Case
                </Button>
              </div>
            </div>

            {/* Pinned Exhibit View */}
            {isPinned && exhibits.length > 0 && (
              <div className="mt-2">
                <Card className="border border-primary/30 bg-content1/70 backdrop-blur-sm shadow-sm">
                  <CardBody className="p-3">
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-1 text-foreground-600">
                      <Pin size={14} className="text-primary" />
                      Pinned Exhibit
                    </h3>
                    {exhibits[panelExhibitIndex] && (
                      <div className="text-sm">
                        <h4 className="font-medium">{exhibits[panelExhibitIndex].title || `Exhibit ${panelExhibitIndex + 1}`}</h4>
                        {/* Simple preview of pinned exhibit content would go here */}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            )}

            {/* Exhibits Panel (when opened) */}
            {showExhibit && exhibits.length > 0 && (
              <div className="mt-2 flex-shrink-0">
                <ExhibitPanel
                  exhibits={exhibits}
                  currentIndex={panelExhibitIndex}
                  onNext={handlePanelNext}
                  onPrev={handlePanelPrev}
                  onClose={handleToggleExhibitPanel}
                  onPin={() => setIsPinned(!isPinned)} 
                  isPinned={isPinned} 
                />
              </div> 
            )}
          </div>
        )}
      </div>

      {/* Exhibit Modal - Conditionally Rendered */}
      {showExhibitModal_DEBUG && selectedExhibitId !== null && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={() => setSelectedExhibitId(null)} 
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-auto p-4 sm:p-6 relative text-foreground border border-content2/30" 
            onClick={(e) => e.stopPropagation()} 
          >
            <Button isIconOnly variant="light" color="default" className="absolute top-2 right-2" onClick={() => setSelectedExhibitId(null)} aria-label="Close exhibit view">
              <X className="h-5 w-5" />
            </Button>
            
            {(() => {
                // Find the exhibit *outside* the IIFE
                const exhibitToShow = exhibits.find(ex => ex.id === selectedExhibitId);

                // Conditionally render based on exhibit existence
                if (!exhibitToShow) {
                  return <p>Exhibit not found.</p>;
                } else {
                  // Render exhibit details directly, using non-null assertion (!)
                  if (exhibitToShow!.type === 'image' && typeof exhibitToShow!.data === 'string') {
                    return <NextUIImage src={exhibitToShow!.data} alt={exhibitToShow!.title} className="max-w-full h-auto rounded-md" />;
                  } else if (exhibitToShow!.type === 'table' && typeof exhibitToShow!.data === 'object' && exhibitToShow!.data !== null && 'headers' in exhibitToShow!.data && 'rows' in exhibitToShow!.data) {
                    const headers = exhibitToShow!.data.headers as string[];
                    const rows = exhibitToShow!.data.rows as string[][];
                    return (
                       <div className="overflow-x-auto">
                         <table className="w-full text-sm border-collapse">
                            <thead><tr className="border-b border-divider bg-content2">{headers.map((h, i)=><th key={i} className="p-2 text-left font-medium text-foreground-600">{h}</th>)}</tr></thead>
                            <tbody>{rows.map((r, i)=><tr key={i} className="border-b border-divider last:border-none hover:bg-content2"><>{r.map((c, j)=><td key={j} className="p-2 text-foreground">{c}</td>)}</></tr>)}</tbody>
                         </table>
                       </div>
                    );
                  } else if (typeof exhibitToShow!.data === 'object' && exhibitToShow!.data !== null) {
                    return <pre className="text-xs whitespace-pre-wrap bg-content2/30 p-3 rounded-md">{JSON.stringify(exhibitToShow!.data, null, 2)}</pre>;
                  } else if (typeof exhibitToShow!.data === 'string') {
                     return <p className="bg-content2/30 p-3 rounded-md">{exhibitToShow!.data as string}</p>;
                  } else {
                    return <p>Cannot display exhibit data.</p>;
                  }
                }
            })()}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
