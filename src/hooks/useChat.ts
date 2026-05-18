'use client';

import { useState, useCallback, useRef } from 'react';
import type { Message, Conversation } from '@/types';
import {
  saveConversation,
  saveMessage,
  getStoredMessages,
  updateStoredConversation,
} from '@/lib/storage';

interface UseChatReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sendMessage: (text: string, conversationId?: string) => Promise<void>;
  stopStreaming: () => void;
  isStreaming: boolean;
  activeAgent: { id: string; name: string } | null;
  currentToolCall: { name: string } | null;
  lastConversationId: string | null;
  error: string | null;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeAgent, setActiveAgent] = useState<{ id: string; name: string } | null>(null);
  const [currentToolCall, setCurrentToolCall] = useState<{ name: string } | null>(null);
  const [lastConversationId, setLastConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
    setCurrentToolCall(null);
    setActiveAgent(null);
  }, []);

  const sendMessage = useCallback(async (text: string, conversationId?: string) => {
    setError(null);
    setIsStreaming(true);
    setCurrentToolCall(null);

    const userMsg: Message = {
      id: `temp_${Date.now()}`,
      conversationId: conversationId || '',
      role: 'user',
      content: text,
      agentId: null,
      metadata: null,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    const assistantMsgId = `temp_asst_${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      conversationId: conversationId || '',
      role: 'assistant',
      content: '',
      agentId: null,
      metadata: null,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, assistantMsg]);

    abortRef.current = new AbortController();

    let historyForServer: { role: string; content: string }[] = [];
    if (conversationId) {
      const storedMsgs = getStoredMessages(conversationId);
      historyForServer = storedMsgs.slice(-20).map(m => ({
        role: m.role,
        content: m.content,
      }));
    }

    let finalConversationId = conversationId || '';
    let finalAssistantContent = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId || undefined,
          history: historyForServer,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);

              switch (eventType) {
                case 'conversation_created': {
                  const conv = data.conversation as Conversation;
                  finalConversationId = conv?.id || '';
                  setLastConversationId(finalConversationId);
                  if (conv) saveConversation(conv);
                  break;
                }

                case 'agent_selected':
                  setActiveAgent({ id: data.agentId, name: data.agentName });
                  setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId ? { ...m, agentId: data.agentId } : m
                  ));
                  break;

                case 'token':
                  finalAssistantContent += data.text;
                  setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId ? { ...m, content: m.content + data.text } : m
                  ));
                  break;

                case 'tool_start':
                  setCurrentToolCall({ name: data.toolName });
                  break;

                case 'tool_result':
                  setCurrentToolCall(null);
                  break;

                case 'done': {
                  if (data.conversationId) {
                    finalConversationId = data.conversationId;
                    setLastConversationId(data.conversationId);
                  }

                  const savedUserMsg: Message = {
                    ...userMsg,
                    id: data.messageId ? `user_${data.messageId}` : userMsg.id,
                    conversationId: finalConversationId,
                  };
                  saveMessage(savedUserMsg);

                  const savedAssistantMsg: Message = {
                    id: data.messageId || assistantMsgId,
                    conversationId: finalConversationId,
                    role: 'assistant',
                    content: finalAssistantContent,
                    agentId: null,
                    metadata: null,
                    createdAt: new Date().toISOString(),
                  };
                  saveMessage(savedAssistantMsg);

                  updateStoredConversation(finalConversationId, {
                    updatedAt: new Date().toISOString(),
                  });

                  setMessages(prev => prev.map(m => {
                    if (m.id === userMsg.id) return savedUserMsg;
                    if (m.id === assistantMsgId) return { ...m, id: savedAssistantMsg.id, conversationId: finalConversationId };
                    return m;
                  }));

                  break;
                }

                case 'error':
                  setError(data.message);
                  break;
              }
            } catch {
              // Ignore malformed JSON
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setMessages(prev => prev.filter(m => m.id !== assistantMsgId || m.content));
        return;
      }
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId || m.content));
    } finally {
      setIsStreaming(false);
      setCurrentToolCall(null);
      setActiveAgent(null);
      abortRef.current = null;
    }
  }, []);

  return { messages, setMessages, sendMessage, stopStreaming, isStreaming, activeAgent, currentToolCall, lastConversationId, error };
}
