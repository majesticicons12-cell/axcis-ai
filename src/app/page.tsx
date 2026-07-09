'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useUser, SignInButton } from '@clerk/nextjs';
import ParticleField from '@/components/animations/ParticleField';
import GradualBlur from '@/components/animations/GradualBlur';
import MagicRings from '@/components/animations/MagicRings';

const PUBLISHABLE_KEY = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const HAS_CLERK = PUBLISHABLE_KEY && PUBLISHABLE_KEY !== 'your-clerk-publishable-key';

const FEATURES = [
  {
    category: 'IDEA VALIDATION',
    title: 'Idea Validation & Strategy',
    desc: 'Market sizing, competitor scans, lean canvas, and a viability score for your idea.',
    tags: ['MARKET RESEARCH', 'SWOT', 'TAM/SAM/SOM'],
  },
  {
    category: 'PLANNING',
    title: 'Business Planning',
    desc: 'Pitch decks, financial models, MVP scoping, and legal-structure guidance.',
    tags: ['FINANCIALS', 'MVP SCOPE', 'LEGAL'],
  },
  {
    category: 'GROWTH',
    title: 'Marketing & Growth',
    desc: 'Positioning, landing page copy, content calendars, and SEO basics.',
    tags: ['POSITIONING', 'CONTENT', 'SEO'],
  },
  {
    category: 'AUTOMATION',
    title: 'Ops & Automation',
    desc: 'Auto-generated workflows for onboarding, invoicing, and CRM — built for tools like n8n.',
    tags: ['WORKFLOWS', 'INTEGRATIONS', 'CRM'],
  },
  {
    category: 'FUNDRAISING',
    title: 'Fundraising Support',
    desc: 'Pitch deck feedback, investor list building, and term sheet explainers.',
    tags: ['PITCH REVIEW', 'INVESTORS', 'CAP TABLE'],
  },
  {
    category: 'PARTNERSHIP',
    title: 'An Actual Co-Founder',
    desc: 'Persistent memory of your business, weekly check-ins, and a devil\'s-advocate mode that pushes back on bad ideas.',
    tags: ['MEMORY', 'ACCOUNTABILITY', 'HONEST FEEDBACK'],
  },
];

const PROCESS_STEPS = [
  { num: '01', title: 'Discover', desc: 'We dive deep into your domain, users, and goals to define the problem space.' },
  { num: '02', title: 'Design', desc: 'Rapid prototyping and iterative design — from wireframes to polished UI.' },
  { num: '03', title: 'Build', desc: 'Agile engineering with continuous integration and transparent progress.' },
  { num: '04', title: 'Launch', desc: 'Deployment, monitoring, and ongoing support to ensure long-term success.' },
];

function CtaButtonInner({ label, large }: { label: string; large?: boolean }) {
  return (
    <>
      {label}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </>
  );
}

export default function LandingPage() {
  const { isSignedIn, isLoaded } = HAS_CLERK ? useUser() : { isSignedIn: false, isLoaded: true };
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
    const cls = `inline-flex items-center gap-2 ${large ? 'h-12 px-8 text-sm' : 'h-10 px-6 text-xs'} rounded-full bg-text-primary text-bg-primary font-semibold no-underline hover:bg-accent hover:text-white transition-all`;
    if (isLoaded && isSignedIn) {
      return <Link href="/chat" className={cls}><CtaButtonInner label={label} large={large} /></Link>;
    }
    if (!HAS_CLERK) {
      return <Link href="/chat" className={cls}><CtaButtonInner label={label} large={large} /></Link>;
    }
    return (
      <SignInButton mode="modal">
        <button className={`${cls} cursor-pointer`}><CtaButtonInner label={label} large={large} /></button>
      </SignInButton>
    );
  }, [isLoaded, isSignedIn]);

  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary overflow-x-hidden font-sans">
      <ParticleField opacity={0.5} />

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
          <a href="#features" className="text-[11px] font-medium text-text-tertiary hover:text-text-primary no-underline transition-colors">Features</a>
          <a href="#how-it-works" className="text-[11px] font-medium text-text-tertiary hover:text-text-primary no-underline transition-colors">How It Works</a>
          <a href="#about" className="text-[11px] font-medium text-text-tertiary hover:text-text-primary no-underline transition-colors">About</a>
          <Link href="/chat" className="text-[11px] font-medium text-accent hover:text-accent-hover no-underline transition-colors">Chat Now</Link>
        </nav>
        <CtaButton label="Get started" />
      </header>

      <main className="relative z-10 pt-14">
        {/* ─── Hero ─── */}
        <section className="min-h-[calc(100vh-3.5rem)] flex items-center">
          <div className="w-full max-w-6xl mx-auto px-5 lg:px-8 py-16 lg:py-24">
            <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
              <div className="lg:col-span-3 relative z-10">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-accent/15 bg-accent/[0.04] text-accent text-[10px] tracking-[2px] font-semibold uppercase mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  LIVE — AI CO-FOUNDER
                </div>
                <h1 className="font-heading text-[clamp(32px,5vw,60px)] font-black leading-[1.05] tracking-[2px] uppercase mb-5">
                  <span className="block animate-in">We Build</span>
                  <span className="block animate-in stagger-1">Your Startup's</span>
                  <span className="block animate-in stagger-2 text-accent">Co-Founder</span>
                </h1>
                <p className="animate-in stagger-3 text-sm lg:text-base text-text-secondary leading-relaxed max-w-lg mb-8">
                  A free AI co-founder for people starting a business — validates your idea, plans your launch, writes your pitch, and automates the busywork so you can build.
                </p>
                <div className="animate-in stagger-4 flex items-center gap-4 flex-wrap">
                  <CtaButton label="Start Building" large />
                  <a href="#features" className="inline-flex items-center gap-2 h-12 px-6 text-sm rounded-full border border-border-default text-text-secondary hover:text-text-primary hover:border-accent/30 no-underline transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    See What It Does
                  </a>
                </div>
              </div>

              <div className="lg:col-span-2 relative animate-in stagger-2">
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
                      <div className="relative z-10 w-14 h-14 rounded-xl bg-accent/90 flex items-center justify-center text-white text-lg font-bold">A</div>
                    </div>
                  </div>
                </div>
                {/* Stat stack */}
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6">
                  <div className="text-right">
                    <span className="block text-sm font-bold text-text-primary tabular-nums">10K+</span>
                    <span className="text-[9px] tracking-[2px] uppercase text-text-tertiary font-semibold">Ideas Validated</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-text-primary tabular-nums">24/7</span>
                    <span className="text-[9px] tracking-[2px] uppercase text-text-tertiary font-semibold">Availability</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-text-primary tabular-nums">100%</span>
                    <span className="text-[9px] tracking-[2px] uppercase text-text-tertiary font-semibold">Free to Start</span>
                  </div>
                </div>
                {/* Mobile stat row */}
                <div className="flex lg:hidden items-center justify-center gap-6 mt-4">
                  <div className="text-center">
                    <span className="block text-xs font-bold text-text-primary tabular-nums">10K+</span>
                    <span className="text-[8px] tracking-[2px] uppercase text-text-tertiary">Ideas Validated</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-bold text-text-primary tabular-nums">24/7</span>
                    <span className="text-[8px] tracking-[2px] uppercase text-text-tertiary">Availability</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-bold text-text-primary tabular-nums">100%</span>
                    <span className="text-[8px] tracking-[2px] uppercase text-text-tertiary">Free</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features ─── */}
        <section className="py-24 lg:py-28" id="features">
          <div className="max-w-6xl mx-auto px-5 lg:px-8">
            <div className="animate-in max-w-2xl mb-12">
              <div className="text-[10px] tracking-[3px] uppercase text-accent font-semibold mb-3">Capabilities</div>
              <h2 className="font-heading text-[clamp(28px,3.5vw,42px)] font-bold leading-tight tracking-[-0.3px] mb-4">
                What Your Co-Founder Does
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                From first idea to first customer — six areas where AXCIS works alongside you.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => (
                <div key={i} className={`animate-in stagger-${Math.min(i % 6 + 1, 4)} p-6 rounded-xl border border-border-default bg-bg-secondary/40 hover:border-accent/20 hover:bg-bg-secondary/60 transition-all`}>
                  <div className="text-[9px] tracking-[2px] uppercase text-text-tertiary font-semibold mb-2">{f.category}</div>
                  <h3 className="font-heading text-base font-bold mb-2">{f.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">{f.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {f.tags.map((t, j) => (
                      <span key={j} className="text-[9px] tracking-[1px] uppercase px-2 py-0.5 rounded-full bg-border-default text-text-tertiary font-medium">{t}</span>
                    ))}
                  </div>
                  <Link
                    href="/chat"
                    className="inline-flex items-center gap-1 mt-4 text-[10px] tracking-[1px] uppercase text-accent font-semibold no-underline hover:gap-2 transition-all"
                  >
                    Try This →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section className="py-24 lg:py-28 border-t border-border-default" id="how-it-works">
          <div className="max-w-6xl mx-auto px-5 lg:px-8">
            <div className="animate-in max-w-xl mb-16">
              <div className="text-[10px] tracking-[3px] uppercase text-accent font-semibold mb-3">How It Works</div>
              <h2 className="font-heading text-[clamp(28px,3.5vw,42px)] font-bold leading-tight tracking-[-0.3px] mb-4">
                From Discovery to Launch
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                A lean, iterative approach that keeps momentum high and risk low.
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-0 relative">
              <div className="hidden md:block absolute top-12 left-[6%] right-[6%] h-px bg-border-default" />
              {PROCESS_STEPS.map((s, i) => (
                <div key={i} className={`animate-in stagger-${Math.min(i + 1, 4)} text-center px-5`}>
                  <div className="text-5xl font-black text-accent font-heading leading-none mb-6 relative inline-block">
                    {s.num}
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-accent rounded-full" />
                  </div>
                  <h3 className="text-base font-bold mb-2 mt-4">{s.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── About ─── */}
        <section className="py-24 lg:py-28 border-t border-border-default" id="about">
          <div className="max-w-6xl mx-auto px-5 lg:px-8">
            <div className="animate-in mb-10">
              <div className="text-[10px] tracking-[3px] uppercase text-accent font-semibold mb-3">About</div>
              <h2 className="font-heading text-[clamp(28px,3.5vw,42px)] font-bold leading-tight tracking-[-0.3px]">About AXCIS</h2>
            </div>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
              <div className="animate-in stagger-1 space-y-4">
                <p className="text-sm text-text-secondary leading-relaxed">
                  AXCIS is a free AI co-founder built for first-time founders and solo builders. It thinks through strategy, drafts the documents you need, and automates the operational grind — so you can focus on building something people want.
                </p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  It doesn't just answer questions. It remembers your business across sessions, checks in on progress, and pushes back when an idea needs more work — the way a real co-founder would.
                </p>
              </div>
              <div className="animate-in stagger-2 grid grid-cols-2 gap-8">
                <div>
                  <div className="text-3xl font-black text-accent font-heading">2026</div>
                  <div className="text-[10px] tracking-[1px] uppercase text-text-tertiary mt-1">Launched</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-accent font-heading">Free</div>
                  <div className="text-[10px] tracking-[1px] uppercase text-text-tertiary mt-1">Forever Plan</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-accent font-heading">24/7</div>
                  <div className="text-[10px] tracking-[1px] uppercase text-text-tertiary mt-1">Available</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-accent font-heading">0%</div>
                  <div className="text-[10px] tracking-[1px] uppercase text-text-tertiary mt-1">Equity Taken</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-24 lg:py-28">
          <div className="max-w-6xl mx-auto px-5 lg:px-8">
            <div className="animate-in max-w-xl mx-auto text-center">
              <h2 className="font-heading text-[clamp(28px,3vw,40px)] font-bold leading-tight tracking-[-0.3px] mb-3">
                Let's Build Your Startup
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-8 max-w-md mx-auto">
                Have an idea? Bring it as-is — AXCIS will help you shape it from here.
              </p>
              <CtaButton label="Start a Conversation" large />
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
            <div className="text-[11px] text-text-tertiary">&copy; 2026 AXCIS. All rights reserved.</div>
            <div className="flex items-center gap-5 text-[11px] text-text-tertiary">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-text-secondary no-underline transition-colors">Twitter</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-text-secondary no-underline transition-colors">LinkedIn</a>
              <Link href="/privacy" className="hover:text-text-secondary no-underline transition-colors">Privacy</Link>
              <a href="mailto:hello@axcis.studio" className="hover:text-text-secondary no-underline transition-colors">Contact</a>
            </div>
          </div>
        </footer>

        <GradualBlur position="bottom" height="6rem" divCount={6} strength={2.5} curve="bezier" opacity={0.5} />
      </main>

      <style>{`
        .animate-in {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .animate-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .animate-in.stagger-1 { transition-delay: 0.05s; }
        .animate-in.stagger-2 { transition-delay: 0.1s; }
        .animate-in.stagger-3 { transition-delay: 0.15s; }
        .animate-in.stagger-4 { transition-delay: 0.2s; }
        .animate-in.stagger-5 { transition-delay: 0.25s; }
        .animate-in.stagger-6 { transition-delay: 0.3s; }

        @media (prefers-reduced-motion: reduce) {
          .animate-in {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
