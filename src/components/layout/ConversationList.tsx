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
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function ConversationList({ conversations, activeId, onSelect, onDelete, onPin, onRename }: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    const closeContextMenu = () => setContextMenu(null);
    document.addEventListener('click', closeContextMenu);
    return () => document.removeEventListener('click', closeContextMenu);
  }, []);

  const handleRenameStart = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setContextMenu(null);
  };

  const handleRenameSave = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameSave();
    if (e.key === 'Escape') { setEditingId(null); setEditTitle(''); }
  };

  const handleContextMenu = (e: React.MouseEvent, conv: Conversation) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id: conv.id, x: e.clientX, y: e.clientY });
  };

  const sorted = [...conversations].sort((a, b) => {
    if ((a.pinned && !b.pinned)) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  const pinned = sorted.filter(c => c.pinned);
  const others = sorted.filter(c => !c.pinned);

  const renderConv = (conv: Conversation) => {
    const isActive = activeId === conv.id;
    const isEditing = editingId === conv.id;

    return (
      <div
        key={conv.id}
        className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
          isActive
            ? 'bg-bg-elevated text-text-primary'
            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
        }`}
        onClick={() => onSelect(conv.id)}
        onContextMenu={(e) => handleContextMenu(e, conv)}
      >
        {conv.pinned && (
          <svg className="w-3 h-3 shrink-0 text-accent/70" viewBox="0 0 16 16" fill="none">
            <path d="M9.5 2L12 4.5L7.5 9L8 13.5L3.5 14L4 9.5L-0.5 5L2 2.5L9.5 2Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.3" />
          </svg>
        )}
        {!conv.pinned && (
          <svg className="w-3.5 h-3.5 shrink-0 opacity-50" viewBox="0 0 16 16" fill="none">
            <path d="M2 4C2 2.89543 2.89543 2 4 2H12C13.1046 2 14 2.89543 14 4V9C14 10.1046 13.1046 11 12 11H5L2 14V4Z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}

        {isEditing ? (
          <input
            ref={editRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRenameSave}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-bg-primary border border-accent/30 rounded px-2 py-0.5 text-sm text-text-primary outline-none"
          />
        ) : (
          <span className="text-sm truncate flex-1">{conv.title}</span>
        )}

        <span className="hidden group-hover:flex shrink-0 items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onPin(conv.id); }}
            className="p-0.5 rounded text-text-tertiary hover:text-accent transition-colors cursor-pointer"
            title={conv.pinned ? 'Unpin' : 'Pin to top'}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M10 2L13 5L8 10L8.5 14.5L4 15L4.5 10.5L0 6L3 3L10 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleRenameStart(conv); }}
            className="p-0.5 rounded text-text-tertiary hover:text-accent transition-colors cursor-pointer"
            title="Rename"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M11 2L14 5L6 13H3V10L11 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
            className="p-0.5 rounded text-text-tertiary hover:text-danger transition-colors cursor-pointer"
            title="Delete"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </span>

        <span className="hidden lg:block shrink-0 text-[10px] text-text-tertiary group-hover:hidden">
          {formatDate(conv.updatedAt)}
        </span>
      </div>
    );
  };

  if (conversations.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-text-tertiary text-xs">No conversations yet</p>
        <p className="text-text-tertiary text-[11px] mt-1">Start chatting to see history here</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-0.5">
        {pinned.length > 0 && others.length > 0 && (
          <div className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider px-2 mb-1">Pinned</div>
        )}
        {pinned.map(renderConv)}
        {pinned.length > 0 && others.length > 0 && (
          <div className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider px-2 my-2 pt-2 border-t border-border-subtle">Recent</div>
        )}
        {others.map(renderConv)}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-bg-elevated border border-border-default rounded-xl shadow-xl p-1.5 min-w-[140px] animate-scale-in"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {conversations.find(c => c.id === contextMenu.id)?.pinned ? (
            <button
              onClick={() => onPin(contextMenu.id)}
              className="w-full text-left text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg px-3 py-2 transition-colors"
            >
              Unpin from top
            </button>
          ) : (
            <button
              onClick={() => onPin(contextMenu.id)}
              className="w-full text-left text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg px-3 py-2 transition-colors flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10 2L13 5L8 10L8.5 14.5L4 15L4.5 10.5L0 6L3 3L10 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
              Pin to top
            </button>
          )}
          <button
            onClick={() => handleRenameStart(conversations.find(c => c.id === contextMenu.id)!)}
            className="w-full text-left text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg px-3 py-2 transition-colors flex items-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11 2L14 5L6 13H3V10L11 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
            Rename
          </button>
          <div className="border-t border-border-subtle my-1" />
          <button
            onClick={() => onDelete(contextMenu.id)}
            className="w-full text-left text-xs text-danger hover:text-danger/80 hover:bg-danger/10 rounded-lg px-3 py-2 transition-colors flex items-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Delete
          </button>
        </div>
      )}
    </>
  );
}
