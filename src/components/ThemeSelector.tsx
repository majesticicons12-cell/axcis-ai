'use client';

import { useState } from 'react';
import { themes, setStoredTheme, applyTheme } from '@/lib/themes';

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

export default function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (themeId: string) => {
    setStoredTheme(themeId);
    applyTheme(themeId);
    onThemeChange(themeId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors cursor-pointer w-full"
      >
        <div
          className="w-4 h-4 rounded-full border border-border-default"
          style={{ backgroundColor: themes.find(t => t.id === currentTheme)?.bgPrimary || '#000' }}
        />
        <span>Theme</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-bg-elevated border border-border-default rounded-xl p-2 shadow-xl z-50 animate-scale-in">
          <div className="grid grid-cols-3 gap-1.5">
            {themes.map(theme => (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all cursor-pointer ${
                  currentTheme === theme.id
                    ? 'bg-accent/15 border border-accent/30'
                    : 'hover:bg-bg-hover border border-transparent'
                }`}
                title={theme.name}
              >
                <div
                  className="w-6 h-6 rounded-full border border-border-default shadow-sm"
                  style={{ backgroundColor: theme.bgPrimary }}
                />
                <span className="text-[9px] text-text-tertiary truncate w-full text-center">
                  {theme.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
