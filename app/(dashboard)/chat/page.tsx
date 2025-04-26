'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SendHorizontal, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  suggestions?: string[];
}

const initialMessage: Message = {
    id: Date.now(), 
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const getSimulatedSuggestions = (userQuery: string): string[] => {
      if (userQuery.toLowerCase().includes("framework")) {
          return ["Explain Porter's Five Forces", "Compare SWOT and PESTLE", "How to apply MECE?"]
      }
      if (userQuery.toLowerCase().includes("practice") || userQuery.toLowerCase().includes("drill")) {
          return ["Market Sizing Practice", "Profitability Diagnosis Drill", "Brainstorming Practice"] 
      }
       if (userQuery.toLowerCase().includes("critique") || userQuery.toLowerCase().includes("feedback")) {
          return ["Critique my approach (I'll paste)", "How can I improve clarity?", "Is my structure logical?"] 
      }
      return ["Explain a common framework", "Give me a practice question", "How to structure my answer?"]
  };

  const handleSubmit = async (userText: string) => {
    if (!userText.trim() || isAiLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: userText,
      sender: 'user',
    };

    const messagesWithoutSuggestions = messages.map(m => ({ ...m, suggestions: undefined }));
    const updatedMessages = [...messagesWithoutSuggestions, userMessage];
    setMessages(updatedMessages);
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages.slice(-6) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response from AI coach.");
      }

      const data = await response.json();

      if (data.response) {
         const aiResponse: Message = {
            id: Date.now() + 1,
            text: data.response,
            sender: 'ai',
            suggestions: getSimulatedSuggestions(userText) 
         };
         setMessages((prev) => [...prev, aiResponse]);
      } else {
          throw new Error("Invalid response format from AI coach.");
      }
    } catch (error) {
        console.error("Error fetching AI response:", error);
        const errorResponse: Message = {
           id: Date.now() + 1,
           text: `Sorry, I encountered an error. ${error instanceof Error ? error.message : ''}`,
           sender: 'ai'
        };
         setMessages((prev) => [...prev, errorResponse]);
    } finally {
       setIsAiLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleSubmit(input);
      setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
      setInput('');
      handleSubmit(suggestion);
  };

  const handleClearChat = () => {
      setMessages([initialMessage]);
      setInput('');
      setIsAiLoading(false);
  };

  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeStyle = resolvedTheme === 'dark' ? vscDarkPlus : vs;
    return !inline && match ? (
      <SyntaxHighlighter style={codeStyle} language={match[1]} PreTag="div" {...props}>
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
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
            <Button variant="outline" size="sm" onClick={handleClearChat} className="text-xs">
                 <RefreshCw size={14} className="mr-1.5" /> 
                 Clear Chat
            </Button>
       </div>

      {/* Message Display Area */}
      <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
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
                    <Card className={`max-w-[75%] shadow-sm rounded-t-xl ${msg.sender === 'user' ? 'rounded-bl-xl bg-purple-600 text-white dark:bg-purple-700' : 'rounded-br-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}> 
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

      {/* Input Area */}
      <form onSubmit={handleFormSubmit} className="flex items-center gap-3 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
        <Input
          type="text"
          placeholder="Ask your AI coach anything..."
          value={input}
          onChange={handleInputChange}
          className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent dark:bg-transparent"
          autoComplete="off"
          disabled={isAiLoading}
        />
        <Button type="submit" size="icon" className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 flex-shrink-0" disabled={!input.trim() || isAiLoading}>
          <SendHorizontal size={18} />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </motion.div>
  );
} 