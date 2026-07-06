'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSystemPrompt, setSystemPrompt } from '@/lib/storage';

export default function SettingsPage() {
  const [sysPrompt, setSysPromptState] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSysPromptState(getSystemPrompt());
  }, []);

  const handleSave = () => {
    setSystemPrompt(sysPrompt);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = () => {
    if (confirm('This will clear all local conversations and messages. This cannot be undone. Continue?')) {
      localStorage.removeItem('axcis_conversations');
      localStorage.removeItem('axcis_messages');
      const uid = localStorage.getItem('axcis_user_id');
      if (uid) {
        localStorage.removeItem(`axcis_conv_${uid}`);
        localStorage.removeItem(`axcis_msg_${uid}`);
      }
      window.location.reload();
    }
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem('axcis_onboarding');
    localStorage.removeItem('axcis_onboarded');
    window.location.reload();
  };

  return (
    <div className="min-h-dvh bg-bg-primary">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border-default">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm hover:bg-accent/20 transition-all">
            A
          </Link>
          <h1 className="text-base font-semibold text-text-primary">Settings</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-bg-secondary border border-border-default rounded-xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Custom Instructions</h2>
          <p className="text-xs text-text-tertiary mb-4">Extra context for your AI Co-Founder.</p>
          <textarea
            value={sysPrompt}
            onChange={(e) => setSysPromptState(e.target.value)}
            placeholder="Add extra context about your startup, preferences, or anything AXCIS should know..."
            className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3.5 py-3 text-sm text-text-primary placeholder-text-tertiary/50 resize-none h-32 outline-none focus:border-accent/30"
          />
          <button
            onClick={handleSave}
            className="mt-3 px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-all cursor-pointer"
          >
            {saved ? 'Saved' : 'Save'}
          </button>
        </section>

        <section className="bg-bg-secondary border border-border-default rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Data Management</h2>
          <div className="space-y-3">
            <button onClick={handleResetOnboarding} className="w-full text-left px-4 py-3 rounded-lg bg-bg-tertiary border border-border-default text-sm text-text-secondary hover:text-text-primary hover:border-accent/20 transition-all cursor-pointer">
              <span className="font-medium text-text-primary">Reset Onboarding</span>
              <p className="text-xs text-text-tertiary mt-0.5">Show the welcome onboarding flow again on next visit</p>
            </button>
            <button onClick={handleClearData} className="w-full text-left px-4 py-3 rounded-lg bg-bg-tertiary border border-border-default text-sm text-text-secondary hover:text-danger hover:border-danger/30 transition-all cursor-pointer">
              <span className="font-medium text-danger">Clear All Local Data</span>
              <p className="text-xs text-text-tertiary mt-0.5">Remove all conversations and messages stored in your browser</p>
            </button>
          </div>
        </section>

        <section className="bg-bg-secondary border border-border-default rounded-xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-1">About</h2>
          <div className="space-y-1.5 text-xs text-text-tertiary">
            <p>AXCIS — AI Co-Founder v1.0</p>
            <p>Built for founders who build.</p>
            <p>All data stored locally in your browser.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
