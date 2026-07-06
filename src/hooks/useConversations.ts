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
    const local = getStoredConversations();
    if (local.length > 0) {
      setConversations(local.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const loadMessages = useCallback(async (conversationId: string): Promise<Message[]> => {
    return getStoredMessages(conversationId);
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    deleteStoredConversation(id);
    setConversations(prev => prev.filter(c => c.id !== id));
    return true;
  }, []);

  return { conversations, loading, fetchConversations, loadMessages, deleteConversation };
}
