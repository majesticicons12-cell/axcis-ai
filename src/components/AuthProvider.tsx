'use client';

import { ClerkProvider } from '@clerk/nextjs';

const PUBLISHABLE_KEY = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const HAS_CLERK = PUBLISHABLE_KEY && PUBLISHABLE_KEY !== 'your-clerk-publishable-key';

const appearance = {
  variables: {
    colorPrimary: '#8b5cf6',
    colorBackground: '#0a0a0a',
    colorText: '#f5f5f5',
    colorTextSecondary: '#a1a1aa',
    colorNeutral: '#a1a1aa',
    fontFamily: 'Inter, sans-serif',
    fontHeading: 'Space Grotesk, sans-serif',
    borderRadius: '8px',
  } as Record<string, string>,
  elements: {
    formFieldInput: {
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '8px',
    },
    card: {
      boxShadow: 'none',
      border: '1px solid rgba(255,255,255,0.06)',
    },
    headerTitle: {
      fontFamily: 'Space Grotesk, sans-serif',
      fontWeight: 700,
    },
    socialButtonsBlockButton: {
      border: '1px solid rgba(255,255,255,0.06)',
    },
    footer: {
      display: 'none',
    },
  },
};

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  if (HAS_CLERK) {
    return (
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY!}
        appearance={appearance}
      >
        {children}
      </ClerkProvider>
    );
  }
  return <>{children}</>;
}
