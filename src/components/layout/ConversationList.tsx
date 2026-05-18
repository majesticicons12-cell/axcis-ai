'use client';

import type { Conversation } from '@/types';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ConversationList({ conversations, activeId, onSelect, onDelete }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-text-tertiary text-xs">No conversations yet</p>
        <p className="text-text-tertiary text-[11px] mt-1">Start chatting to see history here</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {conversations.map(conv => (
        <div
          key={conv.id}
          className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            activeId === conv.id
              ? 'bg-bg-elevated text-text-primary'
              : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
          }`}
          onClick={() => onSelect(conv.id)}
        >
          <svg className="w-3.5 h-3.5 shrink-0 opacity-50" viewBox="0 0 16 16" fill="none">
            <path d="M2 4C2 2.89543 2.89543 2 4 2H12C13.1046 2 14 2.89543 14 4V9C14 10.1046 13.1046 11 12 11H5L2 14V4Z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="text-sm truncate flex-1">{conv.title}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
            className="hidden group-hover:block shrink-0 p-0.5 rounded text-text-tertiary hover:text-danger transition-colors cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
