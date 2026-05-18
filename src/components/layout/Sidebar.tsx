'use client';

import { useState, useEffect } from 'react';
import type { Conversation } from '@/types';
import ConversationList from './ConversationList';
import ThemeSelector from '@/components/ThemeSelector';
import { getStoredTheme, applyTheme } from '@/lib/themes';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}: SidebarProps) {
  const [currentTheme, setCurrentTheme] = useState('black');

  useEffect(() => {
    const stored = getStoredTheme();
    setCurrentTheme(stored);
    applyTheme(stored);
  }, []);

  return (
    <aside className="w-[300px] h-screen flex flex-col border-r border-border-default bg-bg-secondary shrink-0">
      {/* Logo & Brand */}
      <div className="px-5 py-4 border-b border-border-default">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-bg-elevated border border-border-default flex items-center justify-center border-gradient">
            <div className="w-3.5 h-3.5 rounded-full bg-accent glow-accent-sm" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-text-primary tracking-wide">AXCIS AI</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-success/10 text-success border border-success/20">
                <span className="w-1 h-1 rounded-full bg-success" />
                Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* New Chat */}
      <div className="px-3 pt-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-accent/8 border border-accent/15 text-accent text-sm font-medium hover:bg-accent/15 transition-all cursor-pointer group"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:rotate-90 duration-200">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Conversations */}
      <div className="px-3 pt-3">
        <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider px-1">History</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-3">
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={onSelectConversation}
          onDelete={onDeleteConversation}
        />
      </div>

      {/* Bottom section - Theme + Status */}
      <div className="border-t border-border-default p-3 space-y-2">
        {/* Theme selector */}
        <ThemeSelector currentTheme={currentTheme} onThemeChange={setCurrentTheme} />

        {/* Status bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
            <span className="text-[11px] text-text-tertiary font-medium">
              Connected
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
