'use client';

export function applyTheme(): void {
  const root = document.documentElement;
  root.style.setProperty('--color-bg-primary', '#000000');
  root.style.setProperty('--color-bg-secondary', 'rgba(0, 0, 0, 0.96)');
  root.style.setProperty('--color-bg-tertiary', '#0a0012');
  root.style.setProperty('--color-bg-elevated', '#12001e');
  root.style.setProperty('--color-bg-hover', '#1a002a');
  root.style.setProperty('--color-bg-surface', '#0a0012');
  root.style.setProperty('--color-accent', '#b580ff');
  root.style.setProperty('--color-accent-dim', '#7f5ef8');
  root.style.setProperty('--color-accent-glow', '#b580ff30');
  root.style.setProperty('--color-accent-bright', '#d4b0ff');
  root.style.setProperty('--color-text-accent', '#b580ff');
  root.style.setProperty('--color-border-accent', 'rgba(181, 128, 255, 0.25)');
  root.style.setProperty('--color-accent-soft', 'rgba(181, 128, 255, 0.18)');
  root.style.setProperty('--color-text-primary', '#f6f3ff');
  root.style.setProperty('--color-text-secondary', '#b8adc6');
  root.style.setProperty('--color-text-tertiary', '#8870a0');
  root.style.setProperty('--color-border-default', 'rgba(255, 255, 255, 0.08)');
  root.style.setProperty('--color-border-subtle', 'rgba(255, 255, 255, 0.04)');
  root.style.setProperty('--color-user-bubble', '#7f5ef8');
  root.style.setProperty('--color-user-bubble-hover', '#b580ff');
}
