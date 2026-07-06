'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useUser, SignInButton } from '@clerk/nextjs';
import { Ferrofluid, ClickSpark } from '@/components/animations';
import GradualBlur from '@/components/animations/GradualBlur';
import MagicRings from '@/components/animations/MagicRings';

const PUBLISHABLE_KEY = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const HAS_CLERK = PUBLISHABLE_KEY && PUBLISHABLE_KEY !== 'your-clerk-publishable-key';

function useReducedMotion() {
  const reduced = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced.current = mq.matches;
  }, []);
  return reduced;
}

export default function LandingPage() {
  const { isSignedIn, isLoaded } = HAS_CLERK ? useUser() : { isSignedIn: false, isLoaded: true };
  const reducedMotion = useReducedMotion();
  const obsRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    obsRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    const els = document.querySelectorAll('.animate-in');
    els.forEach((el) => obsRef.current?.observe(el));
    return () => obsRef.current?.disconnect();
  }, []);

  const CtaButton = useCallback(({ label, large }: { label: string; large?: boolean }) => {
    if (isLoaded && isSignedIn) {
      return (
        <Link
          href="/chat"
          className={`inline-flex items-center gap-2 ${large ? 'h-12 px-8 text-sm' : 'h-10 px-6 text-xs'} rounded-full bg-text-primary text-bg-primary font-semibold no-underline hover:bg-accent hover:text-white transition-all`}
        >
          {label}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      );
    }
    if (!HAS_CLERK) {
      return (
        <Link
          href="/chat"
          className={`inline-flex items-center gap-2 ${large ? 'h-12 px-8 text-sm' : 'h-10 px-6 text-xs'} rounded-full bg-text-primary text-bg-primary font-semibold no-underline hover:bg-accent hover:text-white transition-all`}
        >
          {label}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      );
    }
    return (
      <SignInButton mode="modal">
        <button className={`inline-flex items-center gap-2 ${large ? 'h-12 px-8 text-sm' : 'h-10 px-6 text-xs'} rounded-full bg-text-primary text-bg-primary font-semibold hover:bg-accent hover:text-white transition-all cursor-pointer`}>
          {label}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </SignInButton>
    );
  }, [isLoaded, isSignedIn]);

  const handleCtaClick = useCallback(() => {
    if (!reducedMotion.current && isSignedIn) {
      window.location.href = '/chat';
    }
  }, [reducedMotion, isSignedIn]);

  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary overflow-x-hidden font-sans">
      {/* Ferrofluid — full hero background */}
      <div className="fixed inset-0 z-0">
        <Ferrofluid
          colors={['#8b5cf6', '#6d28d9', '#a78bfa']}
          speed={0.2}
          scale={1.6}
          turbulence={0.4}
          fluidity={0.15}
          rimWidth={0.12}
          sharpness={2.5}
          shimmer={0.8}
          glow={1.2}
          flowDirection="down"
          opacity={0.25}
          mouseInteraction={true}
          mouseStrength={0.4}
          mouseRadius={0.3}
        />
      </div>

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-5 lg:px-8 border-b border-border-default bg-bg-primary/80 backdrop-blur-2xl">
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 flex items-center justify-center">
            <MagicRings
              color="#8b5cf6"
              colorTwo="#a78bfa"
              ringCount={4}
              speed={0.4}
              baseRadius={0.2}
              radiusStep={0.06}
              lineThickness={1.5}
              ringGap={1}
              opacity={0.6}
              blur={6}
              noiseAmount={0.05}
              followMouse={false}
              hoverScale={1.1}
            />
            <span className="relative z-10 text-[10px] font-bold text-accent">A</span>
          </div>
          <span className="text-xs font-semibold tracking-[3px] text-text-primary uppercase">Axcis</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-[11px] font-medium text-text-tertiary hover:text-text-primary no-underline transition-colors">How it works</a>
          <a href="#why" className="text-[11px] font-medium text-text-tertiary hover:text-text-primary no-underline transition-colors">Why Axcis</a>
        </nav>
        <ClickSpark sparkColor="#8b5cf6" sparkSize={5} sparkRadius={14} sparkCount={6} duration={350}>
          <CtaButton label="Get started" />
        </ClickSpark>
      </header>

      <main className="relative z-10 pt-14">
        {/* Hero */}
        <ClickSpark sparkColor="#8b5cf6" sparkSize={5} sparkRadius={16} sparkCount={8} duration={400}>
          <section className="min-h-[calc(100vh-3.5rem)] flex items-center">
            <div className="w-full max-w-6xl mx-auto px-5 lg:px-8 py-16 lg:py-24">
              <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
                <div className="lg:col-span-3 relative z-10">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-accent/15 bg-accent/[0.04] text-accent text-[10px] tracking-[2px] font-semibold uppercase mb-6">
                    AI co-founder
                  </div>
                  <h1 className="font-heading text-[clamp(28px,4.5vw,52px)] font-bold leading-[1.08] tracking-[-0.5px] mb-5 text-text-primary">
                    Tell it what you are building.
                    <br />
                    <span className="text-accent">It does the rest.</span>
                  </h1>
                  <p className="text-sm lg:text-base text-text-secondary leading-relaxed max-w-lg mb-8">
                    Axcis researches markets, validates ideas, analyzes competitors, and builds strategy.
                    Not a chatbot. A reasoning engine with live tool access.
                  </p>
                  <ClickSpark sparkColor="#8b5cf6" sparkSize={5} sparkRadius={18} sparkCount={10} duration={400}>
                    <CtaButton label="Get started" large />
                  </ClickSpark>
                </div>

                <div className="lg:col-span-2 relative">
                  <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-border-default bg-bg-secondary/40">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <MagicRings
                          color="#8b5cf6"
                          colorTwo="#a78bfa"
                          ringCount={6}
                          speed={0.6}
                          baseRadius={0.22}
                          radiusStep={0.07}
                          ringGap={1.2}
                          opacity={0.7}
                          blur={5}
                          noiseAmount={0.1}
                          followMouse={true}
                          mouseInfluence={0.25}
                          hoverScale={1.3}
                        />
                        <div className="relative z-10 w-14 h-14 rounded-xl bg-accent/90 flex items-center justify-center text-white text-lg font-bold">
                          A
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -left-2 px-3.5 py-2 rounded-lg border border-border-default bg-bg-secondary/80 backdrop-blur-md">
                    <div className="text-[9px] tracking-[2px] uppercase text-text-tertiary font-semibold">Active users</div>
                    <div className="text-xs font-bold text-text-primary mt-0.5 tabular-nums">3,200+</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ClickSpark>

        {/* How it works — editorial alternating layout */}
        <section className="py-24 lg:py-28" id="how-it-works">
          <div className="max-w-6xl mx-auto px-5 lg:px-8">
            <div className="animate-in max-w-xl mb-20">
              <div className="text-[10px] tracking-[3px] uppercase text-accent font-semibold mb-3">How it works</div>
              <h2 className="font-heading text-[clamp(24px,3vw,36px)] font-bold leading-tight tracking-[-0.3px] mb-4">
                You describe the problem. It does the work.
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                A session with Axcis follows a structure. Not freeform chat. Each step produces something you can use.
              </p>
            </div>

            <div className="space-y-20 lg:space-y-28">
              {[
                {
                  num: '01',
                  title: 'Describe what you need',
                  body: 'Tell it your market, your idea, or the decision you are trying to make. A sentence or two is enough. It asks clarifying questions if the context is thin.',
                  label: 'input',
                },
                {
                  num: '02',
                  title: 'It researches and reasons',
                  body: 'Axcis searches live sources, calls APIs, and runs analysis. You see what it finds and why it matters. No black box.',
                  label: 'analysis',
                },
                {
                  num: '03',
                  title: 'You get a deliverable',
                  body: 'A competitive analysis. A market sizing. A go-to-market outline. A fundraising timeline. Something you can act on or share, not a chat transcript.',
                  label: 'output',
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className={`animate-in stagger-${i + 1} grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${i % 2 === 1 ? 'lg:direction-rtl' : ''}`}
                  style={{ direction: i % 2 === 1 ? 'rtl' : 'ltr' }}
                >
                  <div style={{ direction: 'ltr' }}>
                    <div className="text-[10px] tracking-[2px] uppercase text-text-tertiary font-mono mb-2">{step.label}</div>
                    <h3 className="font-heading text-lg lg:text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed max-w-md">{step.body}</p>
                  </div>
                  <div className="aspect-[4/3] rounded-lg border border-border-default bg-bg-secondary/60 flex items-center justify-center" style={{ direction: 'ltr' }}>
                    <span className="text-4xl font-bold text-accent/20 font-heading">{step.num}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why it is different */}
        <section className="py-24 lg:py-28 border-t border-border-default" id="why">
          <div className="max-w-6xl mx-auto px-5 lg:px-8">
            <div className="animate-in max-w-2xl">
              <div className="text-[10px] tracking-[3px] uppercase text-accent font-semibold mb-3">Why it is different</div>
              <h2 className="font-heading text-[clamp(24px,3vw,36px)] font-bold leading-tight tracking-[-0.3px] mb-6">
                It is not a chatbot. It has tools.
              </h2>
              <div className="grid md:grid-cols-2 gap-8 mt-10">
                {[
                  {
                    title: 'Real-time market data',
                    body: 'Axcis queries live APIs for market sizing, competitor analysis, crypto prices, stock data, and news. It does not guess based on training data cutoffs.',
                  },
                  {
                    title: 'Company and patent research',
                    body: 'Look up any company, check patent filings, research founding teams, and analyze market position. All from within the conversation.',
                  },
                  {
                    title: 'Web search and scrape',
                    body: 'It searches the web, reads pages, and extracts what matters. No need to switch tabs or copy-paste.',
                  },
                  {
                    title: 'Structured strategy output',
                    body: 'Go-to-market plans, pitch outlines, unit economics, competitive matrices. Axcis produces structured work, not text walls.',
                  },
                ].map((item, i) => (
                  <div key={i} className="animate-in stagger-1">
                    <h3 className="text-sm font-semibold mb-1.5">{item.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-tertiary mt-8 leading-relaxed">
                Twenty-five API sources are built in. Add your own keys to extend it. No premium tier.
                Everything it can do is available to everyone.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 lg:py-28">
          <div className="max-w-6xl mx-auto px-5 lg:px-8">
            <div className="animate-in max-w-xl mx-auto text-center">
              <h2 className="font-heading text-[clamp(24px,3vw,36px)] font-bold leading-tight tracking-[-0.3px] mb-4">
                Start building.
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-8 max-w-sm mx-auto">
                No cost. No upsells. No usage limits. Just an AI co-founder that ships.
              </p>
              <ClickSpark sparkColor="#8b5cf6" sparkSize={5} sparkRadius={18} sparkCount={10} duration={400}>
                <CtaButton label="Get started" large />
              </ClickSpark>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border-default py-6 px-5 lg:px-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-accent">A</span>
              <span className="text-[11px] font-semibold tracking-[2px] text-text-tertiary uppercase">Axcis</span>
            </div>
            <div className="flex items-center gap-5 text-[11px] text-text-tertiary">
              <Link href="/privacy" className="hover:text-text-secondary no-underline transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-text-secondary no-underline transition-colors">Terms</Link>
              <a href="mailto:hello@axcis.studio" className="hover:text-text-secondary no-underline transition-colors">Contact</a>
            </div>
          </div>
        </footer>

        <GradualBlur position="bottom" height="6rem" divCount={6} strength={2.5} curve="bezier" opacity={0.5} />
      </main>

      <style>{`
        .animate-in {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease-out, transform 0.5s ease-out;
        }
        .animate-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .animate-in.stagger-1 { transition-delay: 0.05s; }
        .animate-in.stagger-2 { transition-delay: 0.1s; }
        .animate-in.stagger-3 { transition-delay: 0.15s; }
        .animate-in.stagger-4 { transition-delay: 0.2s; }

        @media (prefers-reduced-motion: reduce) {
          .animate-in {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }

        .direction-rtl {
          direction: rtl;
        }
      `}</style>
    </div>
  );
}
