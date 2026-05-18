'use client';

export interface Theme {
  id: string;
  name: string;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgElevated: string;
  bgHover: string;
  accent: string;
  accentDim: string;
  accentGlow: string;
}

export const themes: Theme[] = [
  {
    id: 'black',
    name: 'Pitch Black',
    bgPrimary: '#000000',
    bgSecondary: '#0a0a0a',
    bgTertiary: '#111111',
    bgElevated: '#1a1a1a',
    bgHover: '#222222',
    accent: '#00c8ff',
    accentDim: '#0891b2',
    accentGlow: '#00c8ff40',
  },
  {
    id: 'light',
    name: 'Light',
    bgPrimary: '#f8f9fa',
    bgSecondary: '#ffffff',
    bgTertiary: '#f0f1f3',
    bgElevated: '#e8eaed',
    bgHover: '#dee1e5',
    accent: '#0066cc',
    accentDim: '#0052a3',
    accentGlow: '#0066cc30',
  },
];

const THEME_KEY = 'axcis_theme';

export function getStoredTheme(): string {
  if (typeof window === 'undefined') return 'black';
  return localStorage.getItem(THEME_KEY) || 'black';
}

export function setStoredTheme(themeId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, themeId);
}

export function applyTheme(themeId: string): void {
  const theme = themes.find(t => t.id === themeId) || themes[0];
  const root = document.documentElement;
  const isLight = themeId === 'light';

  root.style.setProperty('--color-bg-primary', theme.bgPrimary);
  root.style.setProperty('--color-bg-secondary', theme.bgSecondary);
  root.style.setProperty('--color-bg-tertiary', theme.bgTertiary);
  root.style.setProperty('--color-bg-elevated', theme.bgElevated);
  root.style.setProperty('--color-bg-hover', theme.bgHover);
  root.style.setProperty('--color-bg-surface', theme.bgTertiary);
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--color-accent-dim', theme.accentDim);
  root.style.setProperty('--color-accent-glow', theme.accentGlow);
  root.style.setProperty('--color-accent-bright', theme.accent);
  root.style.setProperty('--color-text-accent', theme.accent);
  root.style.setProperty('--color-border-accent', `${theme.accent}25`);
  root.style.setProperty('--color-accent-soft', `${theme.accent}15`);

  if (isLight) {
    root.style.setProperty('--color-text-primary', '#1a1a2e');
    root.style.setProperty('--color-text-secondary', '#4a4a6a');
    root.style.setProperty('--color-text-tertiary', '#8a8aa0');
    root.style.setProperty('--color-border-default', '#d0d0d8');
    root.style.setProperty('--color-border-subtle', '#e0e0e8');
    root.style.setProperty('--color-user-bubble', '#0066cc');
    root.style.setProperty('--color-user-bubble-hover', '#0052a3');
  } else {
    root.style.setProperty('--color-text-primary', '#f0f4f8');
    root.style.setProperty('--color-text-secondary', '#8899b0');
    root.style.setProperty('--color-text-tertiary', '#4d5f74');
    root.style.setProperty('--color-border-default', '#172033');
    root.style.setProperty('--color-border-subtle', '#111a28');
    root.style.setProperty('--color-user-bubble', '#1d4ed8');
    root.style.setProperty('--color-user-bubble-hover', '#2563eb');
  }
}
