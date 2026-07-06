'use client';

import { useState, useRef, useEffect } from 'react';
import type { Conversation } from '@/types';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ConversationList({ conversations, activeId, onSelect, onDelete, onPin, onRename }: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editRef.current) { editRef.current.focus(); editRef.current.select(); }
  }, [editingId]);

  const handleRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = () => {
    if (editingId && editTitle.trim()) onRename(editingId, editTitle.trim());
    setEditingId(null);
  };

  if (conversations.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-xs text-text-tertiary">No conversations yet</p>
      </div>
    );
  }

  const sorted = [...conversations].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  return (
    <div className="space-y-0.5">
      {sorted.map(conv => {
        const isActive = activeId === conv.id;
        const isEditing = editingId === conv.id;

        return (
          <div
            key={conv.id}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
              isActive ? 'bg-bg-elevated text-text-primary' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            }`}
            onClick={() => { if (!isEditing) onSelect(conv.id); }}
          >
            {isEditing ? (
              <input
                ref={editRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={saveRename}
                onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditingId(null); }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-bg-primary border border-border-accent rounded px-2 py-0.5 text-sm text-text-primary outline-none"
              />
            ) : (
              <>
                <svg className="w-3.5 h-3.5 shrink-0 opacity-40" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4C2 2.89543 2.89543 2 4 2H12C13.1046 2 14 2.89543 14 4V9C14 10.1046 13.1046 11 12 11H5L2 14V4Z" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span className="truncate flex-1 text-xs">{conv.title}</span>
                <span className="text-[10px] text-text-tertiary/50 shrink-0">{formatDate(conv.updatedAt)}</span>
                <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                  <button onClick={(e) => { e.stopPropagation(); onPin(conv.id); }} className="p-0.5 rounded text-text-tertiary/50 hover:text-text-secondary cursor-pointer">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M10 2L13 5L8 10L8.5 14.5L4 15L4.5 10.5L0 6L3 3L10 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleRename(conv); }} className="p-0.5 rounded text-text-tertiary/50 hover:text-text-secondary cursor-pointer">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M11 2L14 5L6 13H3V10L11 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }} className="p-0.5 rounded text-text-tertiary/50 hover:text-danger cursor-pointer">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
