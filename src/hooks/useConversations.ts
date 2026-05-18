'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Conversation, Message } from '@/types';
import {
  getStoredConversations,
  getStoredMessages,
  deleteStoredConversation,
} from '@/lib/storage';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    // Primary: read from localStorage
    const local = getStoredConversations();
    if (local.length > 0) {
      setConversations(local.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      setLoading(false);
      return;
    }

    // Fallback: try server (works for local mode where server DB persists)
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const loadMessages = useCallback(async (conversationId: string): Promise<Message[]> => {
    // Primary: read from localStorage
    const local = getStoredMessages(conversationId);
    if (local.length > 0) {
      return local;
    }

    // Fallback: try server
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // silently handle
    }
    return [];
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    // Delete from localStorage
    deleteStoredConversation(id);
    setConversations(prev => prev.filter(c => c.id !== id));

    // Also try deleting from server (best effort)
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
    } catch {
      // silently handle
    }
    return true;
  }, []);

  return { conversations, loading, fetchConversations, loadMessages, deleteConversation };
}
