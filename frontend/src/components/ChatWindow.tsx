import React, { useEffect, useRef } from 'react';
import { Message } from '../types/chat';
import { MessageBubble } from './MessageBubble';
import { Bot, Sparkles, AlertCircle, MessageSquare } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSelectPrompt?: (prompt: string) => void;
  onDismissError?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  error,
  onSelectPrompt,
  onDismissError,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const starterPrompts = [
    'Explain machine learning in simple terms',
    'What is the difference between SQL and NoSQL?',
    'How does long-term memory work in AI?',
    'What are the key principles of clean code?',
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-4xl mx-auto flex flex-col min-h-full">
        {/* Empty State */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 shadow-inner">
              <Bot className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-semibold text-slate-100 tracking-tight mb-2">
              Welcome to the Long-Term Memory Assistant
            </h2>

            <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
              You are currently running <span className="text-indigo-300 font-medium">Phase 1 (Basic AI Chat)</span>.
              The assistant communicates with Google Gemini with in-session context.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 max-w-lg mb-8 flex items-start gap-2.5 text-left">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-slate-200">Phase 1 Architecture Note:</span>
                <p className="mt-0.5">
                  Conversations are maintained in memory for this session only. Permanent vector & graph memory will be introduced in subsequent phases.
                </p>
              </div>
            </div>

            {/* Prompt suggestions */}
            <div className="w-full max-w-lg">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Suggested conversation starters
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectPrompt && onSelectPrompt(prompt)}
                    className="text-left text-xs p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 transition-all text-ellipsis overflow-hidden"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages List */}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Loading State: "Thinking..." */}
        {isLoading && (
          <div className="flex items-start gap-3 w-full my-3.5 animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-indigo-400 border border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex flex-col max-w-[85%] md:max-w-[75%] items-start">
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 text-slate-300 text-sm flex items-center gap-2.5 shadow-sm">
                <span className="flex space-x-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
                </span>
                <span className="text-slate-400 text-xs italic">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="my-3 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            {onDismissError && (
              <button
                onClick={onDismissError}
                className="text-rose-400 hover:text-rose-200 underline font-medium text-xs ml-2 shrink-0"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

