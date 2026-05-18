'use client';

import { useState, useCallback, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import { useChat } from '@/hooks/useChat';
import { useConversations } from '@/hooks/useConversations';

export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const { messages, setMessages, sendMessage, isStreaming, activeAgent, currentToolCall, lastConversationId, error } = useChat();
  const { conversations, fetchConversations, loadMessages, deleteConversation } = useConversations();

  // Network status detection
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync conversation ID from chat responses
  useEffect(() => {
    if (lastConversationId && lastConversationId !== activeConversationId) {
      setActiveConversationId(lastConversationId);
      fetchConversations();
    }
  }, [lastConversationId, activeConversationId, fetchConversations]);

  const handleSend = useCallback((text: string) => {
    sendMessage(text, activeConversationId || undefined);
  }, [sendMessage, activeConversationId]);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, [setMessages]);

  const handleSelectConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    const msgs = await loadMessages(id);
    setMessages(msgs);
  }, [loadMessages, setMessages]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    const deleted = await deleteConversation(id);
    if (deleted && activeConversationId === id) {
      handleNewChat();
    }
  }, [deleteConversation, activeConversationId, handleNewChat]);

  const handleSuggestionClick = useCallback((text: string) => {
    handleSend(text);
  }, [handleSend]);

  // Main app
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3 left-3 z-50 w-9 h-9 rounded-lg bg-bg-elevated border border-border-default flex items-center justify-center lg:hidden cursor-pointer hover:bg-bg-hover transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-40 transition-transform duration-200`}>
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          isOnline={isOnline}
        />
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <main className="flex-1 flex flex-col h-screen bg-bg-primary min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border-default glass shrink-0">
          <div className="flex items-center gap-3">
            <div className="pl-10 lg:pl-0">
              {activeAgent && isStreaming ? (
                <div className="flex items-center gap-2 animate-fade-in">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
                  <span className="text-xs text-accent font-medium">
                    {activeAgent.name || 'Processing...'}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-text-secondary font-medium">
                  {activeConversationId
                    ? conversations.find(c => c.id === activeConversationId)?.title || 'Chat'
                    : 'New Chat'
                  }
                </span>
              )}
            </div>
          </div>
          {/* Online/Offline indicator in header */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg ${
              isOnline
                ? 'bg-success/10 text-success'
                : 'bg-warning/10 text-warning'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-success' : 'bg-warning'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2.5 bg-danger/8 border-b border-danger/15 text-danger text-sm flex items-center gap-2 animate-slide-up">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 4.5V9M8 11V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        {/* Messages */}
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          activeAgent={activeAgent}
          currentToolCall={currentToolCall}
          onSuggestionClick={handleSuggestionClick}
          isOnline={isOnline}
        />

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          disabled={isStreaming}
          placeholder={isOnline ? "Ask AXCIS anything..." : "Ask AXCIS (offline mode)..."}
        />
      </main>
    </div>
  );
}
