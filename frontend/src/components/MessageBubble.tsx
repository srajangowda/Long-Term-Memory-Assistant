import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import { Message } from '../types/chat';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex items-start gap-3 w-full my-3.5 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-medium border ${
          isUser
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
            : 'bg-slate-800 text-indigo-400 border-slate-700 shadow-sm'
        }`}
        aria-label={isUser ? 'User Avatar' : 'Assistant Avatar'}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble Container */}
      <div
        className={`flex flex-col max-w-[85%] md:max-w-[75%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed break-words ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm whitespace-pre-wrap'
              : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm shadow-sm'
          }`}
        >
          {isUser ? (
            message.content
          ) : (
            <div className="prose-chat text-sm leading-relaxed text-slate-100">
              <ReactMarkdown
                components={{
                  strong: ({ children }) => (
                    <strong className="font-semibold text-white tracking-wide">{children}</strong>
                  ),
                  p: ({ children }) => (
                    <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside ml-4 mb-2.5 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside ml-4 mb-2.5 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed pl-0.5">{children}</li>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-base font-semibold text-slate-100 mt-3 mb-1.5">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-sm font-semibold text-slate-100 mt-2.5 mb-1">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-medium text-slate-200 mt-2 mb-1">{children}</h3>
                  ),
                  code: ({ children }) => (
                    <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-indigo-500 pl-3 my-2 text-slate-300 italic">{children}</blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[11px] text-slate-500 mt-1 px-1 select-none">
          {message.timestamp}
        </span>
      </div>
    </div>
  );
};
