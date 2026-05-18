'use client';

import { useState, useCallback, useRef } from 'react';
import type { Message, Conversation } from '@/types';
import {
  saveConversation,
  saveMessage,
  getStoredMessages,
  updateStoredConversation,
} from '@/lib/storage';
import { offlineAI } from '@/lib/offline-ai';

interface UseChatReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sendMessage: (text: string, conversationId?: string) => Promise<void>;
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

  const sendMessageOffline = useCallback(async (text: string, conversationId?: string) => {
    const convId = conversationId || `offline_${Date.now()}`;

    // Create conversation if new
    if (!conversationId) {
      const conv: Conversation = {
        id: convId,
        title: text.slice(0, 50),
        agentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveConversation(conv);
      setLastConversationId(convId);
    }

    // Add user message
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      conversationId: convId,
      role: 'user',
      content: text,
      agentId: null,
      metadata: null,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    saveMessage(userMsg);

    // Add empty assistant message
    const assistantMsgId = `asst_${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      conversationId: convId,
      role: 'assistant',
      content: '',
      agentId: null,
      metadata: null,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, assistantMsg]);
    setActiveAgent({ id: 'axcis', name: 'AXCIS (Offline)' });

    // Auto-load cached model if not ready yet
    if (!offlineAI.isReady) {
      if (offlineAI.isModelCached()) {
        // Model was downloaded before - load it from browser cache
        try {
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: 'Loading offline AI model...' } : m
          ));
          const activeId = offlineAI.getActiveModelId();
          await offlineAI.initialize(activeId || undefined);
        } catch {
          const errorMsg = 'Failed to load offline AI model. Try re-downloading it when you have internet.';
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: errorMsg } : m
          ));
          const savedMsg: Message = { ...assistantMsg, content: errorMsg };
          saveMessage(savedMsg);
          updateStoredConversation(convId, { updatedAt: new Date().toISOString() });
          return;
        }
      } else {
        // No model downloaded at all
        const offlineResponse = "No offline AI model downloaded yet. Connect to the internet and download a model from the sidebar (Offline AI Models section) to use AI without internet.";
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: offlineResponse } : m
        ));
        const savedMsg: Message = { ...assistantMsg, content: offlineResponse };
        saveMessage(savedMsg);
        updateStoredConversation(convId, { updatedAt: new Date().toISOString() });
        return;
      }
    }

    // Use offline AI model
    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      let fullResponse = '';
      await offlineAI.generate(text, history, (token) => {
        fullResponse += token;
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: fullResponse } : m
        ));
      });

      const savedMsg: Message = { ...assistantMsg, content: fullResponse };
      saveMessage(savedMsg);
      updateStoredConversation(convId, { updatedAt: new Date().toISOString() });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Offline AI error';
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId ? { ...m, content: `Error: ${errMsg}` } : m
      ));
    }
  }, [messages]);

  const sendMessageOnline = useCallback(async (text: string, conversationId?: string) => {
    // Add user message optimistically
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

    // Add empty assistant message for streaming
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

    // Get recent history from localStorage
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

                  // Save user message to localStorage
                  const savedUserMsg: Message = {
                    ...userMsg,
                    id: data.messageId ? `user_${data.messageId}` : userMsg.id,
                    conversationId: finalConversationId,
                  };
                  saveMessage(savedUserMsg);

                  // Save assistant message to localStorage
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

                  // Update conversation timestamp
                  updateStoredConversation(finalConversationId, {
                    updatedAt: new Date().toISOString(),
                  });

                  // Update message IDs in state
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
      if (err instanceof Error && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId || m.content));
    }
  }, []);

  const sendMessage = useCallback(async (text: string, conversationId?: string) => {
    setError(null);
    setIsStreaming(true);
    setCurrentToolCall(null);

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    try {
      if (isOnline) {
        await sendMessageOnline(text, conversationId);
      } else {
        await sendMessageOffline(text, conversationId);
      }
    } finally {
      setIsStreaming(false);
      setCurrentToolCall(null);
      setActiveAgent(null);
      abortRef.current = null;
    }
  }, [sendMessageOnline, sendMessageOffline]);

  return { messages, setMessages, sendMessage, isStreaming, activeAgent, currentToolCall, lastConversationId, error };
}
