'use client';

import { useRef, useEffect } from 'react';
import type { Message } from '@/types';
import MessageBubble from './MessageBubble';
import Image from 'next/image';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  activeAgent: { id: string; name: string } | null;
  currentToolCall: { name: string } | null;
  onSuggestionClick?: (text: string) => void;
  isOnline: boolean;
}

const SUGGESTIONS = [
  { text: 'What are the trending AI tools right now?', icon: 'search' },
  { text: 'Explain quantum computing simply', icon: 'brain' },
  { text: 'Help me write a professional email', icon: 'write' },
  { text: 'Find remote developer jobs', icon: 'search' },
];

export default function MessageList({ messages, isStreaming, activeAgent, currentToolCall, onSuggestionClick, isOnline }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, currentToolCall]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center animate-fade-in max-w-md">
          {/* Core orb */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-accent/10 blur-2xl animate-pulse-glow" />
            <Image
              src="/images/axcis-core.png"
              alt="AXCIS AI"
              width={112}
              height={112}
              className="relative rounded-3xl animate-float"
              priority
            />
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-2 glow-text">AXCIS</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-2">
            Your personal AI assistant. Ask me anything.
          </p>
          <p className="text-text-tertiary text-xs mb-8">
            {isOnline ? 'Online - Web search available' : 'Offline - Using local AI'}
          </p>

          {/* Suggestion chips */}
          <div className="grid grid-cols-2 gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s.text}
                onClick={() => onSuggestionClick?.(s.text)}
                className="group flex items-center gap-2.5 px-4 py-3 text-left text-xs text-text-secondary border border-border-default rounded-xl hover:bg-bg-elevated hover:border-accent/20 hover:text-text-primary transition-all cursor-pointer"
              >
                <span className="shrink-0 w-7 h-7 rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-tertiary group-hover:text-accent group-hover:border-accent/20 transition-colors">
                  {s.icon === 'search' && (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  )}
                  {s.icon === 'brain' && (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2C5.5 2 3 4 3 7C3 10 5 12 5 14H11C11 12 13 10 13 7C13 4 10.5 2 8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M6 14V15M10 14V15M8 2V1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  )}
                  {s.icon === 'write' && (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                  )}
                </span>
                <span className="line-clamp-2">{s.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-1">
        {messages.map((msg, idx) => {
          const isLast = idx === messages.length - 1;
          const showStreaming = isLast && isStreaming && msg.role === 'assistant';
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={showStreaming}
              agentName={showStreaming ? activeAgent?.name : undefined}
              currentToolCall={showStreaming ? currentToolCall : undefined}
            />
          );
        })}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
