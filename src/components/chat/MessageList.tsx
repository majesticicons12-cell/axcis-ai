'use client';

import { useRef, useEffect } from 'react';
import type { Message } from '@/types';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  activeAgent: { id: string; name: string } | null;
  currentToolCall: { name: string } | null;
  onSuggestionClick?: (text: string) => void;
}

const QUICK_ACTIONS = [
  'Analyze my market',
  'Validate my idea',
  'Find investors',
  'Pricing strategy',
];

export default function MessageList({ messages, isStreaming, activeAgent, currentToolCall, onSuggestionClick }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, currentToolCall]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 flex items-center justify-center mx-auto mb-5">
            <img src="/logo/axcis-logo.png" alt="AXCIS" className="w-12 h-12 object-cover" />
          </div>
          <h1 className="text-lg font-semibold text-text-primary mb-2">What are you building?</h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-6">
            Tell me about your startup idea, and I will help you research the market, validate the concept, find competitors, and build a strategy.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_ACTIONS.map((text) => (
              <button
                key={text}
                onClick={() => onSuggestionClick?.(text)}
                className="px-4 py-2 rounded-xl bg-bg-tertiary border border-border-default text-xs text-text-secondary hover:text-text-primary hover:border-accent/30 hover:bg-accent/5 cursor-pointer transition-all"
              >
                {text}
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
            <div key={msg.id} className="animate-in">
              <MessageBubble
                message={msg}
                isStreaming={showStreaming}
                agentName={showStreaming ? activeAgent?.name : undefined}
                currentToolCall={showStreaming ? currentToolCall : undefined}
              />
            </div>
          );
        })}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
