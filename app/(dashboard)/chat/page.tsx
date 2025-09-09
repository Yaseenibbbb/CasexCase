'use client';

// Force dynamic rendering for this client component
export const dynamic = 'force-dynamic'

import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SendHorizontal, Loader2, Trash2, RefreshCw, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from 'next-themes';

// Lazy load syntax highlighter for better performance
const SyntaxHighlighter = lazy(() => import('react-syntax-highlighter').then(module => ({ default: module.Prism })));

type UiMsg = { id: string; sender: "user" | "ai"; text: string; suggestions?: string[]; isError?: boolean };

interface Message extends UiMsg {}

// Helper function to convert messages to ChatML format
const toChatML = (history: UiMsg[], systemPrompt: string) => {
  return [
    { role: "system", content: systemPrompt },
    ...history.map(m => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    })),
  ] as { role: "system" | "user" | "assistant"; content: string }[];
};

const initialMessage: Message = {
    id: crypto.randomUUID(), 
    text: "Hello! How can I help you prepare for your case interviews today? Ask me about frameworks, practice a mini-case, or critique your approach.", 
    sender: 'ai',
    suggestions: ["Explain Profitability Framework", "Give me a market sizing drill", "Critique my STAR answer (I'll paste it)"]
};


export default function ChatPage() {
  const { resolvedTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // System prompt for chat coach mode
  const coachPrompt = `You are an expert case interview coach. Provide concise, actionable advice for consulting case interviews. 

Guidelines:
- Keep responses conversational and practical
- Focus on frameworks, structure, and common pitfalls
- Provide specific examples when helpful
- End responses with 2-3 relevant follow-up suggestions as a JSON array: {"suggestions": ["suggestion1", "suggestion2", "suggestion3"]}
- Be encouraging but direct about improvements needed`;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll on messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Scroll when loading state changes (for loader appearance)
  useEffect(() => {
    scrollToBottom();
  }, [isAiLoading, scrollToBottom]);

  // Cleanup: abort requests on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // The streaming sender
  const sendStreaming = useCallback(
    async ({
      history,
      userText,
      systemPrompt,
      mode = "chat" as "chat" | "interview",
    }: {
      history: UiMsg[];
      userText: string;
      systemPrompt: string;
      mode?: "chat" | "interview";
    }) => {
      // push user message
      const userMsg: UiMsg = { id: crypto.randomUUID(), sender: "user", text: userText };
      setMessages(prev => [...prev, userMsg]);

      // create empty AI placeholder
      const aiId = crypto.randomUUID();
      setMessages(prev => [...prev, { id: aiId, sender: "ai", text: "" }]);

      // abort previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: toChatML([...history, userMsg], systemPrompt).slice(-12),
            mode,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body!.getReader();
        const dec = new TextDecoder();
        let acc = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });

          // update the placeholder bubble
          setMessages(prev => prev.map(m => (m.id === aiId ? { ...m, text: acc } : m)));
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Streaming error:", error);
          setMessages(prev => prev.map(m => 
            m.id === aiId 
              ? { ...m, text: `Sorry, I encountered an error. ${error.message ?? ''}`, isError: true }
              : m
          ));
        } else {
          // Request was aborted, remove the placeholder message
          setMessages(prev => prev.filter(m => m.id !== aiId));
        }
      }
    },
    []
  );

  const handleSubmit = useCallback(async (userText: string) => {
    if (!userText.trim() || isAiLoading) return;

    setIsAiLoading(true);

    try {
      await sendStreaming({
        history: messages,
        userText,
        systemPrompt: coachPrompt,
        mode: "chat",
      });
    } finally {
      setIsAiLoading(false);
    }
  }, [messages, isAiLoading, sendStreaming, coachPrompt]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleSubmit(input);
      setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
      setInput('');
      handleSubmit(suggestion);
  };

  const handleClearChat = useCallback(() => {
      // Abort any ongoing request
      abortRef.current?.abort();
      setMessages([initialMessage]);
      setInput('');
      setIsAiLoading(false);
  }, []);

  const handleRetry = useCallback((messageId: string) => {
      // Find the user message before this error message
      const errorIndex = messages.findIndex(m => m.id === messageId);
      if (errorIndex > 0) {
          const userMessage = messages[errorIndex - 1];
          if (userMessage.sender === 'user') {
              // Remove the error message and retry
              setMessages(prev => prev.slice(0, errorIndex));
              handleSubmit(userMessage.text);
          }
      }
  }, [messages, handleSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isAiLoading) {
        handleSubmit(input);
        setInput('');
      }
    }
  };

  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeStyle = resolvedTheme === 'dark' ? 'vscDarkPlus' : 'vs';
    
    return !inline && match ? (
      <Suspense fallback={<code className={className} {...props}>{children}</code>}>
        <SyntaxHighlighter 
          style={codeStyle} 
          language={match[1]} 
          PreTag="div" 
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </Suspense>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  };

  return (
    <motion.div
      className="container mx-auto px-4 py-8 flex flex-col h-[calc(100vh-120px)] bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
       <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Avatar className="h-7 w-7 border border-indigo-200 dark:border-indigo-800 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs">AI</AvatarFallback>
                </Avatar>
                AI Case Coach Chat
            </h1>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearChat} 
              className="text-xs"
              aria-label="Clear chat history"
              title="Clear chat history"
            >
                 <RefreshCw size={14} className="mr-1.5" /> 
                 Clear Chat
            </Button>
       </div>

      {/* Message Display Area with accessibility */}
      <div 
        className="flex-grow overflow-y-auto mb-4 pr-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((msg, index) => (
            <React.Fragment key={msg.id}>
                <motion.div
                    className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                >
                    {msg.sender === 'ai' && (
                    <Avatar className="h-8 w-8 border border-indigo-200 dark:border-indigo-800 flex-shrink-0 mb-1">
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs">AI</AvatarFallback>
                    </Avatar>
                    )}
                    <Card className={`max-w-[75%] shadow-sm rounded-t-xl ${msg.sender === 'user' ? 'rounded-bl-xl bg-purple-600 text-white dark:bg-purple-700' : msg.isError ? 'rounded-br-xl bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800' : 'rounded-br-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}> 
                        <CardContent className="p-3 text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-li:my-0.5">
                        {msg.sender === 'ai' ? (
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]} 
                                components={{
                                    code: CodeBlock,
                                }}>
                                {msg.text}
                            </ReactMarkdown>
                        ) : (
                            msg.text
                        )}
                        </CardContent>
                        {/* Retry button for error messages */}
                        {msg.isError && (
                          <div className="px-3 pb-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetry(msg.id)}
                              className="text-xs h-7"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          </div>
                        )}
                    </Card>
                    {msg.sender === 'user' && (
                    <Avatar className="h-8 w-8 border border-purple-200 dark:border-purple-800 flex-shrink-0 mb-1">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">U</AvatarFallback>
                    </Avatar>
                    )}
                </motion.div>

                {msg.sender === 'ai' && msg.suggestions && msg.suggestions.length > 0 && index === messages.length - 1 && !isAiLoading && (
                    <motion.div 
                        className="flex flex-wrap gap-2 justify-start pl-11 mt-2 mb-3"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                    >
                        {msg.suggestions.map((suggestion, sIndex) => (
                            <Button 
                                key={sIndex} 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-auto py-1 px-2.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                {suggestion}
                            </Button>
                        ))}
                    </motion.div>
                )}
            </React.Fragment>
        ))}
        {isAiLoading && (
            <motion.div 
                className="flex items-end gap-3 justify-start"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <Avatar className="h-8 w-8 border border-indigo-200 dark:border-indigo-800 flex-shrink-0 mb-1">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs">AI</AvatarFallback>
                </Avatar>
                 <Card className="max-w-[75%] shadow-sm rounded-t-xl rounded-br-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"> 
                    <CardContent className="p-3 text-sm flex items-center gap-2">
                         <Loader2 className="h-4 w-4 animate-spin text-slate-500 dark:text-slate-400" />
                         <span className="text-slate-500 dark:text-slate-400 italic text-xs">Thinking...</span>
                     </CardContent>
                 </Card>
            </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with better UX */}
      <form onSubmit={handleFormSubmit} className="flex items-center gap-3 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
        <Input
          type="text"
          placeholder="Ask your AI coach anything..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent dark:bg-transparent"
          autoComplete="off"
          disabled={isAiLoading}
          enterKeyHint="send"
          aria-label="Type your message to the AI coach"
        />
        <Button 
          type="submit" 
          size="icon" 
          className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 flex-shrink-0" 
          disabled={!input.trim() || isAiLoading}
          aria-label="Send message"
        >
          <SendHorizontal size={18} />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </motion.div>
  );
}