'use client';

import { useState } from 'react';

interface SetupWizardProps {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { title: 'Welcome', subtitle: 'Let\'s set up your AI assistant' },
    { title: 'API Key', subtitle: 'Connect to your AI provider' },
    { title: 'Security', subtitle: 'Protect your assistant with a PIN' },
    { title: 'Ready', subtitle: 'Your assistant is configured' },
  ];

  const handleSaveConfig = async () => {
    if (step === 2 && pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    if (step === 2 && pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey || undefined,
          pin: pin || undefined,
        }),
      });

      if (res.ok) {
        if (step < 3) {
          setStep(step + 1);
        } else {
          onComplete();
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save configuration');
      }
    } catch {
      setError('Connection failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent/3 blur-[150px]" />
      </div>

      <div className="relative w-full max-w-lg animate-scale-in">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i <= step ? 'w-10 bg-accent' : 'w-6 bg-border-default'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-1">{steps[step].title}</h2>
          <p className="text-text-secondary text-sm">{steps[step].subtitle}</p>
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="animate-fade-in text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-bg-elevated border border-border-default flex items-center justify-center border-gradient">
              <div className="w-10 h-10 rounded-full bg-accent glow-accent animate-pulse-glow" />
            </div>
            <p className="text-text-secondary mb-8 max-w-sm mx-auto leading-relaxed">
              AXCIS is your personal AI assistant with full control over your computer,
              web research, email, and website building capabilities.
            </p>
            <button
              onClick={() => setStep(1)}
              className="px-8 py-3 rounded-xl bg-accent text-bg-primary font-semibold text-sm hover:bg-accent-bright transition-colors cursor-pointer glow-accent-sm"
            >
              Get Started
            </button>
          </div>
        )}

        {/* Step 1: API Key */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="bg-bg-secondary border border-border-default rounded-2xl p-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Anthropic API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setError(''); }}
                placeholder="sk-ant-..."
                className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-border-default text-text-primary text-sm placeholder-text-tertiary focus:border-accent/40 transition-colors"
              />
              <p className="text-xs text-text-tertiary mt-2">
                Required to power the AI. Get one at console.anthropic.com
              </p>
            </div>

            {error && <p className="text-sm text-danger mt-3 text-center animate-fade-in">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(0)}
                className="flex-1 px-6 py-3 rounded-xl bg-bg-elevated border border-border-default text-text-secondary text-sm font-medium hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => { setError(''); setStep(2); }}
                className="flex-1 px-6 py-3 rounded-xl bg-accent text-bg-primary font-semibold text-sm hover:bg-accent-bright transition-colors cursor-pointer glow-accent-sm"
              >
                {apiKey ? 'Next' : 'Skip for now'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: PIN */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="bg-bg-secondary border border-border-default rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Set a PIN (4-6 digits)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  placeholder="Enter PIN"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-border-default text-text-primary text-sm text-center tracking-[0.5em] placeholder-text-tertiary focus:border-accent/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={e => { setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  placeholder="Confirm PIN"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-border-default text-text-primary text-sm text-center tracking-[0.5em] placeholder-text-tertiary focus:border-accent/40 transition-colors"
                />
              </div>
              <p className="text-xs text-text-tertiary">
                Your PIN protects access to your assistant. Optional but recommended.
              </p>
            </div>

            {error && <p className="text-sm text-danger mt-3 text-center animate-fade-in">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 rounded-xl bg-bg-elevated border border-border-default text-text-secondary text-sm font-medium hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="flex-1 px-6 py-3 rounded-xl bg-accent text-bg-primary font-semibold text-sm hover:bg-accent-bright transition-colors cursor-pointer glow-accent-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : pin ? 'Save & Continue' : 'Skip'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Ready */}
        {step === 3 && (
          <div className="animate-fade-in text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-success">
                <polyline points="20 6 9 17 4 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-text-secondary mb-8 max-w-sm mx-auto leading-relaxed">
              Your AI assistant is ready. You can start chatting, building websites,
              controlling your PC, and more.
            </p>
            <button
              onClick={onComplete}
              className="px-8 py-3 rounded-xl bg-accent text-bg-primary font-semibold text-sm hover:bg-accent-bright transition-colors cursor-pointer glow-accent-sm"
            >
              Launch AXCIS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
