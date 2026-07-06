'use client';

import { useState, useEffect } from 'react';
import type { Conversation } from '@/types';
import ConversationList from './ConversationList';

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
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery.trim()
    ? conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  const handlePin = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      import('@/lib/storage').then(({ updateStoredConversation, getStoredConversations }) => {
        updateStoredConversation(id, { pinned: !conv.pinned });
        const convs = getStoredConversations().map(c => c.id === id ? { ...c, pinned: !conv.pinned } : c);
        const uid = localStorage.getItem('axcis_user_id') || '';
        const key = uid ? `axcis_conv_${uid}` : 'axcis_conversations';
        localStorage.setItem(key, JSON.stringify(convs));
      });
    }
  };

  const handleRename = (id: string, title: string) => {
    import('@/lib/storage').then(({ updateStoredConversation, getStoredConversations }) => {
      updateStoredConversation(id, { title });
      const convs = getStoredConversations().map(c => c.id === id ? { ...c, title } : c);
      const uid = localStorage.getItem('axcis_user_id') || '';
      const key = uid ? `axcis_conv_${uid}` : 'axcis_conversations';
      localStorage.setItem(key, JSON.stringify(convs));
    });
  };

  return (
    <aside className="w-[260px] h-dvh flex flex-col bg-bg-secondary border-r border-border-default">
      <div className="px-4 pt-5 pb-3">
        <button onClick={onNewChat} className="flex items-center gap-3 w-full">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-sm font-bold shrink-0">A</div>
          <span className="text-sm font-semibold text-text-primary tracking-wide">AXCIS</span>
        </button>
      </div>

      <div className="px-3 mb-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-border-default text-xs text-text-tertiary">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent outline-none text-text-secondary placeholder-text-tertiary/60"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-text-tertiary hover:text-text-primary cursor-pointer">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <ConversationList
          conversations={filtered}
          activeId={activeConversationId}
          onSelect={onSelectConversation}
          onDelete={onDeleteConversation}
          onPin={handlePin}
          onRename={handleRename}
        />
      </div>

      <div className="px-4 py-3 border-t border-border-default flex items-center gap-3 text-xs text-text-tertiary/60">
        <a href="/settings" className="hover:text-text-secondary transition-colors">Settings</a>
        <a href="/privacy" className="hover:text-text-secondary transition-colors">Privacy</a>
        <a href="/terms" className="hover:text-text-secondary transition-colors">Terms</a>
      </div>
    </aside>
  );
}
