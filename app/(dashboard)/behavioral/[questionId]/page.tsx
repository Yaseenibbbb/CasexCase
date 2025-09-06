"use client";

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CATEGORIZED_BEHAVIORAL_QUESTIONS, BehavioralQuestion, BehavioralQuestionCategory } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { Mic, MicOff, PauseCircle, PlayCircle, Loader2, Sparkles, CheckCircle2, AlertTriangle, ListChecks, Lightbulb, ArrowRight, Copy, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import React, { useState, useEffect, useRef, useMemo, useCallback, startTransition } from 'react';
import { toast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Define the structure for parsed feedback
interface ParsedFeedback {
  Strengths?: string;
  "Areas for Improvement"?: string;
  "STAR Method Breakdown"?: string;
  "Revised Example Answer"?: string;
  [key: string]: string | undefined;
}

// Helper function to parse feedback markdown into sections with fallback
const parseFeedback = (feedback: string): ParsedFeedback => {
  const sections: ParsedFeedback = {};
  const knownHeadings = [
    "Strengths",
    "Areas for Improvement",
    "STAR Method Breakdown",
    "Revised Example Answer",
  ];
  
  // Regex to split by '## Heading\n' - ensures we capture content after the heading newline
  const parts = feedback.split(/##\s+(Strengths|Areas for Improvement|STAR Method Breakdown|Revised Example Answer)\s*\n/);

  let currentHeading: keyof ParsedFeedback | null = null;

  // Start from index 1 as index 0 is the content before the first heading (if any)
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    // Check if the part is one of our known headings
    if (knownHeadings.includes(part)) {
        currentHeading = part as keyof ParsedFeedback;
    } else if (currentHeading) {
        // This part is the content for the previously identified heading
        sections[currentHeading] = part;
        currentHeading = null; // Reset heading, wait for the next one
    }
  }

  // Clean up: remove potential leading/trailing whitespace from content
  for(const key in sections){
      if(sections[key]){
          sections[key] = sections[key]?.trim();
      }
  }

  // Fallback: if no known sections found, treat the whole string as "Revised Example Answer"
  if (Object.keys(sections).length === 0) {
    sections["Revised Example Answer"] = feedback.trim();
  }

  return sections;
};

export default function BehavioralQuestionPage() {
  const { categorySlug, questionSlug } = useParams() as { categorySlug: string; questionSlug: string };
  const router = useRouter();

  // Find the current category and question index based on slugs
  const currentCategory = CATEGORIZED_BEHAVIORAL_QUESTIONS[categorySlug];
  const initialQuestionIndex = currentCategory?.questions.findIndex(
    (q) => q.slug === questionSlug
  ) ?? -1;

  // Early return if category/question not found - prevents flashing UI
  if (!currentCategory || initialQuestionIndex === -1) {
    return <div className="container mx-auto px-4 py-8 text-center">Not found.</div>;
  }

  // State for current question index *within the category*
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(initialQuestionIndex);

  // State for recording
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [parsedFeedback, setParsedFeedback] = useState<ParsedFeedback | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  // Memoized derived values to avoid recompute churn
  const currentQuestion = useMemo(() => 
    currentCategory?.questions[currentQuestionIndex], 
    [currentCategory, currentQuestionIndex]
  );
  
  const isLastQuestionInCategory = useMemo(() => 
    currentQuestionIndex === currentCategory.questions.length - 1,
    [currentQuestionIndex, currentCategory.questions.length]
  );

  // Autosave functionality
  useEffect(() => {
    const key = `behav:${categorySlug}/${questionSlug}`;
    const saved = localStorage.getItem(key);
    if (saved) setUserAnswer(saved);
  }, [categorySlug, questionSlug]);

  useEffect(() => {
    const key = `behav:${categorySlug}/${questionSlug}`;
    const id = setTimeout(() => localStorage.setItem(key, userAnswer), 400);
    return () => clearTimeout(id);
  }, [categorySlug, questionSlug, userAnswer]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isGeneratingFeedback && userAnswer.trim())
        handleGetFeedback();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isGeneratingFeedback, userAnswer]);

  // Prefetch next question for smoother navigation
  useEffect(() => { 
    const next = currentCategory?.questions[currentQuestionIndex + 1]?.slug;
    if (next) router.prefetch?.(`/behavioral/${categorySlug}/${next}`);
  }, [categorySlug, currentCategory, currentQuestionIndex, router]);

  // Reset state when slugs change (navigating directly to a new question URL)
  useEffect(() => {
    resetForNewQuestion(); 
    setCurrentQuestionIndex(initialQuestionIndex);
  }, [categorySlug, questionSlug, initialQuestionIndex]);

  // Setup Media Recorder with proper cleanup
  useEffect(() => {
    const setupMediaRecorder = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          toast({
            title: "Unsupported Browser",
            description: "Audio recording is not supported in this browser.",
            variant: "destructive",
          });
          return;
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        // Audio format fallback
        const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');
        
        const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunks.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, { type: mime || 'audio/webm' });
          console.log("Recording stopped. Audio Blob:", audioBlob);
          audioChunks.current = [];
        };

        setMediaRecorder(recorder);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        toast({
          title: "Microphone Access Denied",
          description: "Please enable microphone access to use recording.",
          variant: "destructive",
        });
      }
    };

    setupMediaRecorder();

    // Cleanup function with proper stream reference
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    };
  }, []);

  // Recording Handlers with useCallback
  const handleStartRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === "inactive") {
      audioChunks.current = [];
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      toast({ title: "Recording Started" });
    }
  }, [mediaRecorder]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    toast({ title: "Recording Stopped" });
  }, [mediaRecorder]);

  const handlePauseRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause();
      setIsPaused(true);
      toast({ title: "Recording Paused" });
    }
  }, [mediaRecorder]);

  const handleResumeRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();
      setIsPaused(false);
      toast({ title: "Recording Resumed" });
    }
  }, [mediaRecorder]);

  // Function to reset state for a new question
  const resetForNewQuestion = useCallback(() => {
    setUserAnswer("");
    setParsedFeedback(null);
    setIsGeneratingFeedback(false);
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      handleStopRecording();
    }
    setIsRecording(false);
    setIsPaused(false);
  }, [mediaRecorder, handleStopRecording]);

  // Function to get AI Feedback
  const handleGetFeedback = useCallback(async () => {
    if (!userAnswer.trim()) {
      toast({ title: "Please enter your answer first.", variant: "destructive" });
      return;
    }
    if (!currentQuestion) return;

    setIsGeneratingFeedback(true);
    setParsedFeedback(null);

    try {
      const response = await fetch('/api/behavioral-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionTitle: currentQuestion.title,
          questionDescription: currentQuestion.description,
          userAnswer: userAnswer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get feedback from AI.");
      }

      const data = await response.json();
      if (data.feedback && typeof data.feedback === 'string') {
        setParsedFeedback(parseFeedback(data.feedback));
      } else {
        throw new Error("Invalid feedback format received from API.");
      }

    } catch (error) {
      console.error("Error getting AI feedback:", error);
      toast({
        title: "Feedback Error",
        description: error instanceof Error ? error.message : "Could not retrieve feedback.",
        variant: "destructive",
      });
      setParsedFeedback(null);
    } finally {
      setIsGeneratingFeedback(false);
    }
  }, [userAnswer, currentQuestion]);

  // Function to navigate to the next question with smooth transitions
  const handleNextQuestion = useCallback(() => {
    if (!currentCategory) return;
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < currentCategory.questions.length) {
      const nextQuestion = currentCategory.questions[nextIndex];
      resetForNewQuestion();
      setCurrentQuestionIndex(nextIndex);
      
      startTransition(() => {
        router.push(`/behavioral/${categorySlug}/${nextQuestion.slug}`, { scroll: true });
      });
    } else {
      toast({ title: `Category Complete!`, description: `You finished all questions in ${currentCategory.title}.` });
    }
  }, [currentCategory, currentQuestionIndex, resetForNewQuestion, router, categorySlug]);

  // Function to clear feedback and allow re-editing
  const handleTryAgain = useCallback(() => {
    setParsedFeedback(null);
  }, []);

  // Function to copy answer to clipboard
  const handleCopyAnswer = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard!" });
  }, []);

  return (
    <motion.div
      key={currentQuestionIndex}
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{currentQuestion.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Main Question Card */}
      <Card className="max-w-3xl mx-auto dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {React.createElement(currentQuestion.icon, { className: "h-6 w-6 text-purple-600 dark:text-purple-400" })}
            {currentQuestion.title}
          </CardTitle>
          <CardDescription className="pt-1 pl-9">
            {currentQuestion.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Your Answer:
            </p>
            <Textarea
              placeholder={`Structure your answer for "${currentQuestion.title}" here...\nConsider using the STAR method (Situation, Task, Action, Result).`}
              className="min-h-[200px] dark:bg-slate-800"
              rows={8}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={isGeneratingFeedback}
            />
            <div className="flex justify-end items-center gap-3 pt-4">
              {/* Dynamic Recording Button */}
              {!isRecording ? (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    onClick={handleStartRecording} 
                    disabled={!mediaRecorder || isGeneratingFeedback}
                    aria-label="Start recording"
                    title="Start recording"
                  >
                    <Mic className="h-4 w-4 mr-2"/>
                    Record Answer
                  </Button>
                </motion.div>
              ) : (
                <div className="flex gap-2">
                  {isPaused ? (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        onClick={handleResumeRecording} 
                        className="border-amber-500 text-amber-500 hover:bg-amber-50" 
                        disabled={isGeneratingFeedback}
                        aria-label="Resume recording"
                        title="Resume recording"
                      >
                        <PlayCircle className="h-4 w-4 mr-2"/> Resume
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        onClick={handlePauseRecording} 
                        className="border-amber-500 text-amber-500 hover:bg-amber-50" 
                        disabled={isGeneratingFeedback}
                        aria-label="Pause recording"
                        title="Pause recording"
                      >
                        <PauseCircle className="h-4 w-4 mr-2"/> Pause
                      </Button>
                    </motion.div>
                  )}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="destructive" 
                      onClick={handleStopRecording} 
                      disabled={isGeneratingFeedback}
                      aria-label="Stop recording"
                      title="Stop recording"
                    >
                      <MicOff className="h-4 w-4 mr-2"/> Stop Recording
                    </Button>
                  </motion.div>
                </div>
              )}

              {/* Feedback Button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={handleGetFeedback} 
                  disabled={isGeneratingFeedback || !userAnswer.trim() || !!parsedFeedback} 
                  className="min-w-[160px]"
                  aria-busy={isGeneratingFeedback}
                >
                  {isGeneratingFeedback ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {isGeneratingFeedback ? "Getting Feedback..." : (parsedFeedback ? "Feedback Received" : "Get Feedback")}
                </Button>
              </motion.div>

              {/* Try Again Button - shown when feedback is received */}
              {parsedFeedback && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={handleTryAgain} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </motion.div>
              )}

              {/* Next Question Button */}
              {parsedFeedback && !isLastQuestionInCategory && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={handleNextQuestion} variant="outline">
                    Next Question
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              )}
              
              {parsedFeedback && isLastQuestionInCategory && (
                <Button disabled variant="outline">All Questions Done!</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility: Live region for async states */}
      <div role="status" aria-live="polite" className="sr-only">
        {isGeneratingFeedback ? 'Generating feedback' : (parsedFeedback ? 'Feedback ready' : '')}
      </div>

      {/* AI Feedback Section or Skeleton Loader */}
      {isGeneratingFeedback && (
        <div className="mt-6 max-w-3xl mx-auto space-y-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden">
              <CardHeader>
                <Skeleton className="h-5 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {parsedFeedback && !isGeneratingFeedback && (
        <div className="mt-6 max-w-3xl mx-auto space-y-4">
          {Object.entries(parsedFeedback).map(([heading, content], index) => (
            content && (
              <motion.div
                key={heading}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.1 }}
              >
                <Card className="dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {heading === "Strengths" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        {heading === "Areas for Improvement" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                        {heading === "STAR Method Breakdown" && <ListChecks className="h-5 w-5 text-blue-500" />}
                        {heading === "Revised Example Answer" && <Lightbulb className="h-5 w-5 text-purple-500" />}
                        {heading}
                      </div>
                      {heading === "Revised Example Answer" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyAnswer(content)}
                          aria-label="Copy answer"
                          title="Copy answer"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm dark:prose-invert max-w-none pt-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  </CardContent>
                </Card>
              </motion.div>
            )
          ))}
        </div>
      )}
    </motion.div>
  );
}