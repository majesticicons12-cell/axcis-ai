'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import { useChat } from '@/hooks/useChat';
import { useConversations } from '@/hooks/useConversations';
import { getSystemPrompt, setSystemPrompt, setOnboardingData, getOnboardingData, type OnboardingData } from '@/lib/storage';

const ONBOARDING_QUESTIONS = [
  { key: 'idea' as const, label: "What's your startup idea?", placeholder: 'Describe your idea — what problem are you solving?' },
  { key: 'stage' as const, label: 'What stage are you at?', placeholder: 'Idea phase / Prototype / Launched / Raising funds' },
  { key: 'industry' as const, label: 'What industry / market?', placeholder: 'e.g., Fintech, Health, SaaS, E-commerce, AI, Education...' },
  { key: 'challenge' as const, label: "What's your biggest challenge right now?", placeholder: 'e.g., Finding product-market fit, Getting first users, Fundraising, Building the product' },
  { key: 'team' as const, label: 'Do you have a team?', placeholder: 'Solo founder? Co-founders? How many people? What roles?' },
];

function isOnboarded(): boolean {
  if (typeof window === 'undefined') return false;
  try { return localStorage.getItem('axcis_onboarded') === 'true'; } catch { return false; }
}

const CAPABILITIES = [
  {
    icon: 'M3 3L21 21M21 3L3 21',
    label: 'Market Research',
    desc: 'Analyze competitors, market size, trends, and opportunities with real-time data.',
  },
  {
    icon: 'M3 12L6 9L9 12L15 6L21 12',
    label: 'Strategy & Planning',
    desc: 'MVP definition, business model, go-to-market, pricing, and unit economics.',
  },
  {
    icon: 'M12 2L12 6M12 10L12 14M16 8C18.5 8 20 10 20 12C20 15 17 17 12 17C7 17 4 15 4 12C4 9.5 6 8 8 8',
    label: 'Fundraising',
    desc: 'Pitch deck strategy, investor targeting, valuation, and term sheet advice.',
  },
];

export default function ChatPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingAnswers, setOnboardingAnswers] = useState<Record<string, string>>({});
  const [onboardingInput, setOnboardingInput] = useState('');
  const settingsRef = useRef<HTMLDivElement>(null);
  const pendingSendRef = useRef<string | null>(null);

  const { messages, setMessages, sendMessage, stopStreaming, isStreaming, activeAgent, currentToolCall, lastConversationId, error } = useChat();
  const { conversations, fetchConversations, loadMessages, deleteConversation } = useConversations();

  useEffect(() => {
    if (lastConversationId && lastConversationId !== activeConversationId) {
      setActiveConversationId(lastConversationId);
      fetchConversations();
    }
  }, [lastConversationId, activeConversationId, fetchConversations]);

  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [settingsOpen]);

  const maybeShowOnboarding = useCallback(() => {
    if (!isOnboarded() && !showOnboarding) { setShowOnboarding(true); return true; }
    return false;
  }, [showOnboarding]);

  const doSend = useCallback((text: string) => {
    sendMessage(text, activeConversationId || undefined);
  }, [sendMessage, activeConversationId]);

  const handleSend = useCallback((text: string) => {
    if (maybeShowOnboarding()) { pendingSendRef.current = text; return; }
    doSend(text);
  }, [maybeShowOnboarding, doSend]);

  const handleNewChat = useCallback(() => {
    stopStreaming();
    setActiveConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
  }, [stopStreaming, setMessages]);

  const handleSelectConversation = useCallback(async (id: string) => {
    stopStreaming();
    setActiveConversationId(id);
    const msgs = await loadMessages(id);
    setMessages(msgs);
    setSidebarOpen(false);
  }, [stopStreaming, loadMessages, setMessages]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    const deleted = await deleteConversation(id);
    if (deleted && activeConversationId === id) handleNewChat();
  }, [deleteConversation, activeConversationId, handleNewChat]);

  const handleSuggestionClick = useCallback((text: string) => {
    if (maybeShowOnboarding()) { pendingSendRef.current = text; return; }
    doSend(text);
  }, [maybeShowOnboarding, doSend]);

  const handleOnboardingNext = async () => {
    if (!onboardingInput.trim()) return;
    const q = ONBOARDING_QUESTIONS[onboardingStep];
    const answers = { ...onboardingAnswers, [q.key]: onboardingInput.trim() };
    setOnboardingAnswers(answers);
    setOnboardingInput('');

    if (onboardingStep < ONBOARDING_QUESTIONS.length - 1) {
      setOnboardingStep(prev => prev + 1);
    } else {
      const data: OnboardingData = {
        idea: answers.idea || '',
        stage: answers.stage || '',
        industry: answers.industry || '',
        challenge: answers.challenge || '',
        team: answers.team || '',
      };
      setOnboardingData(data);
      setShowOnboarding(false);
      const pending = pendingSendRef.current;
      if (pending) { pendingSendRef.current = null; doSend(pending); }
      doSend(`I just completed onboarding. My startup idea is: ${data.idea}. Stage: ${data.stage}. Industry: ${data.industry}. Biggest challenge: ${data.challenge}. Team: ${data.team}. Give me your honest first assessment.`);
    }
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    setOnboardingStep(0);
    setOnboardingInput('');
    const pending = pendingSendRef.current;
    if (pending) { pendingSendRef.current = null; doSend(pending); }
  };

  return (
    <>
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md mx-4 bg-bg-secondary border border-border-default rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <img src="/logo/axcis-logo.png" alt="AXCIS" className="w-9 h-9 object-cover" />
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Welcome to AXCIS</h2>
                <p className="text-xs text-text-tertiary">Tell me about your startup</p>
              </div>
            </div>
            <div className="flex gap-1 mb-4">
              {ONBOARDING_QUESTIONS.map((_, i) => (
                <div key={i} className={`flex-1 h-0.5 rounded-full ${i < onboardingStep ? 'bg-accent' : i === onboardingStep ? 'bg-accent/50' : 'bg-border-default'}`} />
              ))}
            </div>
            <label className="block text-sm font-medium text-text-primary mb-2">{ONBOARDING_QUESTIONS[onboardingStep].label}</label>
            <textarea
              value={onboardingInput}
              onChange={(e) => setOnboardingInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleOnboardingNext(); } }}
              placeholder={ONBOARDING_QUESTIONS[onboardingStep].placeholder}
              className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-tertiary/50 resize-none h-20 outline-none focus:border-accent/30"
              autoFocus
            />
            <div className="flex items-center justify-between mt-4">
              <button onClick={handleOnboardingSkip} className="text-xs text-text-tertiary hover:text-text-secondary cursor-pointer">Skip</button>
              <button onClick={handleOnboardingNext} disabled={!onboardingInput.trim()} className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                {onboardingStep < ONBOARDING_QUESTIONS.length - 1 ? 'Next' : 'Start'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-dvh flex">
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-40 inset-y-0 left-0 transition-transform duration-200`}>
          <Sidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            onDeleteConversation={handleDeleteConversation}
          />
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between px-4 py-3 border-b border-border-default">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-bg-hover cursor-pointer">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <span className="text-sm font-medium text-text-secondary hidden sm:inline">AXCIS</span>
              {isStreaming && (
                <div className="flex items-center gap-2 ml-2">
                  <div className="flex gap-0.5">
                    <span className="loading-dot" />
                    <span className="loading-dot" />
                    <span className="loading-dot" />
                  </div>
                  <span className="text-xs text-accent">{activeAgent?.name || 'Thinking'}</span>
                </div>
              )}
            </div>

            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-1.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-bg-hover cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M7 2H9L9.5 3.5L11 4L13 3L14 4L13 6L13.5 7.5L15 8V9L13.5 9.5L13 11L14 13L13 14L11 13L9.5 13.5L9 15H7L6.5 13.5L5 13L3 14L2 13L3 11L2.5 9.5L1 9V8L2.5 7.5L3 6L2 4L3 3L5 4L6.5 3.5L7 2Z" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
              {settingsOpen && (
                <div className="absolute right-0 top-9 w-64 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 p-3 text-xs">
                  <p className="text-text-tertiary mb-2">Custom instructions for your AI Co-Founder</p>
                  <textarea
                    defaultValue={getSystemPrompt()}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border-default rounded-lg px-2.5 py-2 text-xs text-text-primary placeholder-text-tertiary/50 resize-none h-24 outline-none focus:border-accent/30"
                  />
                </div>
              )}
            </div>
          </header>

          {error && (
            <div className="px-4 py-2 bg-danger/10 border-b border-danger/20 text-danger text-xs flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5V9M8 11V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              {error}
            </div>
          )}

          <MessageList messages={messages} isStreaming={isStreaming} activeAgent={activeAgent} currentToolCall={currentToolCall} onSuggestionClick={handleSuggestionClick} />

          {messages.length === 0 ? (
            <div className="px-4 pb-4">
              <div className="bg-bg-tertiary border border-border-default rounded-xl p-3 mb-3">
                <ChatInput onSend={handleSend} onStop={stopStreaming} disabled={false} isStreaming={isStreaming} placeholder="Ask anything..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {CAPABILITIES.map((c, i) => (
                  <div key={i} className="p-3 rounded-xl bg-bg-tertiary border border-border-default">
                    <div className="flex items-center gap-2 mb-1.5">
                      <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 16 16" fill="none">
                        <path d={c.icon} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs font-medium text-text-primary">{c.label}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-border-default px-4 py-3">
              <ChatInput onSend={handleSend} onStop={stopStreaming} disabled={false} isStreaming={isStreaming} placeholder="Tell your AI Co-Founder what you're working on..." />
            </div>
          )}
        </main>
      </div>
    </>
  );
}
