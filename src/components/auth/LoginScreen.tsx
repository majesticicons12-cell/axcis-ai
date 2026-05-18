'use client';

import { useState, useRef, useEffect } from 'react';

interface LoginScreenProps {
  onSuccess: () => void;
}

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (value && index === 5) {
      const fullPin = newPin.join('');
      if (fullPin.length === 6) {
        submitPin(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      const fullPin = pin.join('');
      if (fullPin.length === 6) {
        submitPin(fullPin);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newPin = [...pin];
      for (let i = 0; i < pasted.length; i++) {
        newPin[i] = pasted[i];
      }
      setPin(newPin);
      if (pasted.length === 6) {
        submitPin(pasted);
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
    }
  };

  const submitPin = async (fullPin: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: fullPin }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError('Invalid PIN');
        setPin(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Connection failed');
      setPin(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-bg-elevated border border-border-default flex items-center justify-center glow-accent-sm border-gradient">
            <div className="w-6 h-6 rounded-full bg-accent glow-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">AXCIS AI</h1>
          <p className="text-sm text-text-tertiary mt-1.5">Enter your 6-digit PIN</p>
        </div>

        {/* PIN Input */}
        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={loading}
              className={`w-12 h-14 text-center text-xl font-semibold rounded-xl border transition-all duration-200
                ${digit ? 'bg-bg-elevated border-accent/40 text-text-primary glow-accent-sm' : 'bg-bg-tertiary border-border-default text-text-primary'}
                ${error ? 'border-danger/50' : ''}
                focus:border-accent/60 focus:glow-accent-sm
                disabled:opacity-50
              `}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-center text-sm text-danger mb-4 animate-fade-in">{error}</p>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center mb-4">
            <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        <p className="text-center text-xs text-text-tertiary mt-8">
          Secured access to your personal AI assistant
        </p>
      </div>
    </div>
  );
}
