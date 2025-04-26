"use client";

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link for navigation
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
} from "@/components/ui/breadcrumb" // Import Breadcrumb components
import { Skeleton } from "@/components/ui/skeleton" // Import Skeleton
import { Mic, MicOff, PauseCircle, PlayCircle, Loader2, Sparkles, CheckCircle2, AlertTriangle, ListChecks, Lightbulb, ArrowRight } from 'lucide-react'; // Add recording icons and Loader2, Sparkles, and new icons
import { motion } from 'framer-motion';
import React, { useState, useEffect, useRef } from 'react'; // Import hooks
import { toast } from '@/components/ui/use-toast'; // Import toast
import ReactMarkdown from 'react-markdown'; // Import for rendering feedback
import remarkGfm from 'remark-gfm'; // Import for markdown rendering

// Define the structure for parsed feedback
interface ParsedFeedback {
  Strengths?: string;
  "Areas for Improvement"?: string;
  "STAR Method Breakdown"?: string;
  "Revised Example Answer"?: string;
  [key: string]: string | undefined; // Allow other potential keys if AI adds extra sections
}

// Helper function to parse feedback markdown into sections
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

  return sections;
};

export default function BehavioralQuestionPage() {
  const params = useParams();
  const router = useRouter(); // Initialize router
  const categorySlug = params.categorySlug as string;
  const questionSlug = params.questionSlug as string;

  // Find the current category and question index based on slugs
  const currentCategory = CATEGORIZED_BEHAVIORAL_QUESTIONS[categorySlug];
  const initialQuestionIndex = currentCategory?.questions.findIndex(
    (q) => q.slug === questionSlug
  ) ?? -1;

  // State for current question index *within the category*
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(initialQuestionIndex);

  // State for recording
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [userAnswer, setUserAnswer] = useState(""); // State for typed answer
  const [parsedFeedback, setParsedFeedback] = useState<ParsedFeedback | null>(null); // State for parsed feedback object
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  // Derive the current question object based on the index
  const currentQuestion = currentCategory?.questions[currentQuestionIndex];

  // Handle cases where category or question is not found
  useEffect(() => {
    if (!currentCategory || initialQuestionIndex === -1) {
        toast({ title: "Question or Category not found", variant: "destructive" });
        // Optionally redirect
        // router.replace('/dashboard');
    }
    // Reset state when slugs change (navigating directly to a new question URL)
    resetForNewQuestion(); 
    setCurrentQuestionIndex(initialQuestionIndex); // Ensure index is correct if params change
  }, [categorySlug, questionSlug, currentCategory, initialQuestionIndex, router]);

  // Setup Media Recorder and Mic Permissions
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
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunks.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          console.log("Recording stopped. Audio Blob:", audioBlob);
          // TODO: Send blob for transcription/analysis or create playback URL
          audioChunks.current = []; // Clear chunks
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

    // Cleanup function
    return () => {
      mediaRecorder?.stream.getTracks().forEach(track => track.stop());
    };
  }, []); // Run only once on mount

  // Recording Handlers
  const handleStartRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "inactive") {
      audioChunks.current = [];
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      toast({ title: "Recording Started" });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop(); // onstop handler will process the blob
    }
    setIsRecording(false);
    setIsPaused(false);
    toast({ title: "Recording Stopped" });
  };

  const handlePauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause();
      setIsPaused(true);
      toast({ title: "Recording Paused" });
    }
  };

  const handleResumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();
      setIsPaused(false);
      toast({ title: "Recording Resumed" });
    }
  };

  // Function to reset state for a new question
  const resetForNewQuestion = () => {
      setUserAnswer("");
      setParsedFeedback(null);
      setIsGeneratingFeedback(false);
      // Optionally reset recording state if needed
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
          handleStopRecording(); // Stop recording if active
      }
      setIsRecording(false);
      setIsPaused(false);
  };

  // Function to get AI Feedback
  const handleGetFeedback = async () => {
    if (!userAnswer.trim()) {
      toast({ title: "Please enter your answer first.", variant: "destructive" });
      return;
    }
    if (!currentQuestion) return; // Check based on current index

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
      // Parse the raw feedback and set the structured state
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
      setParsedFeedback(null); // Ensure parsed feedback is null on error
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  // Function to navigate to the next question *within the category*
  const handleNextQuestion = () => {
    if (!currentCategory) return;
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < currentCategory.questions.length) {
      const nextQuestion = currentCategory.questions[nextIndex];
      resetForNewQuestion();
      setCurrentQuestionIndex(nextIndex);
      // Update URL: Only the questionSlug changes
      router.push(`/behavioral/${categorySlug}/${nextQuestion.slug}`, { scroll: false });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast({ title: `Category Complete!`, description: `You finished all questions in ${currentCategory.title}.` });
      // Maybe navigate back to dashboard or category list?
      // router.push('/dashboard'); 
    }
  };

  // Early return if category/question not found initially
  if (!currentCategory || !currentQuestion) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading question or category/question not found...</p>
      </div>
    );
  }

  const isLastQuestionInCategory = currentQuestionIndex === currentCategory.questions.length - 1;

  return (
    <motion.div
      key={currentQuestionIndex}
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Breadcrumbs - Use currentQuestion */}
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

      {/* Main Question Card - Use currentQuestion */}
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
                  <Button variant="outline" onClick={handleStartRecording} disabled={!mediaRecorder || isGeneratingFeedback}>
                    <Mic className="h-4 w-4 mr-2"/>
                    Record Answer
                  </Button>
                </motion.div>
              ) : (
                <div className="flex gap-2">
                  {isPaused ? (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" onClick={handleResumeRecording} className="border-amber-500 text-amber-500 hover:bg-amber-50" disabled={isGeneratingFeedback}>
                        <PlayCircle className="h-4 w-4 mr-2"/> Resume
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" onClick={handlePauseRecording} className="border-amber-500 text-amber-500 hover:bg-amber-50" disabled={isGeneratingFeedback}>
                        <PauseCircle className="h-4 w-4 mr-2"/> Pause
                      </Button>
                    </motion.div>
                  )}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="destructive" onClick={handleStopRecording} disabled={isGeneratingFeedback}>
                      <MicOff className="h-4 w-4 mr-2"/> Stop Recording
                    </Button>
                  </motion.div>
                </div>
              )}

              {/* Feedback Button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={handleGetFeedback} disabled={isGeneratingFeedback || !userAnswer.trim() || !!parsedFeedback} className="min-w-[160px]">
                    {isGeneratingFeedback ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {isGeneratingFeedback ? "Getting Feedback..." : (parsedFeedback ? "Feedback Received" : "Get Feedback")}
                  </Button>
              </motion.div>

              {/* Next Question Button - Conditionally Rendered */}
              {parsedFeedback && !isLastQuestionInCategory && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={handleNextQuestion} variant="outline">
                          Next Question
                          <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                  </motion.div>
              )}
              {/* Optionally show a different button or message on the last question */} 
              {parsedFeedback && isLastQuestionInCategory && (
                  <Button disabled variant="outline">All Questions Done!</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        {heading === "Strengths" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        {heading === "Areas for Improvement" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                        {heading === "STAR Method Breakdown" && <ListChecks className="h-5 w-5 text-blue-500" />}
                        {heading === "Revised Example Answer" && <Lightbulb className="h-5 w-5 text-purple-500" />}
                        {heading}
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