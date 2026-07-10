import type { Metadata, Viewport } from 'next';
import './globals.css';
import ReactGrabWrapper from '@/components/ReactGrab';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'AXCIS — AI Co-Founder',
  description: 'Your AI Co-Founder. Research markets, validate ideas, build strategy.',
  icons: {
    icon: '/logo/axcis-logo.png',
    apple: '/logo/axcis-logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <ReactGrabWrapper />
        </AuthProvider>
      </body>
    </html>
  );
}
