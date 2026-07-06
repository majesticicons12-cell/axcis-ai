import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-bg-primary">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border-default">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm hover:bg-accent/20 transition-all">
            A
          </Link>
          <h1 className="text-base font-semibold text-text-primary">Privacy Policy</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 text-sm text-text-secondary leading-relaxed space-y-4">
        <p><strong className="text-text-primary">Last updated:</strong> June 2026</p>

        <h2 className="text-text-primary text-sm font-semibold mt-6">1. What We Collect</h2>
        <p>When you use AXCIS, we collect:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account information</strong> — your email address and name (via Google OAuth) if you choose to sign in</li>
          <li><strong>Conversation data</strong> — the messages you send and receive, stored to provide continuity</li>
          <li><strong>Startup profile</strong> — information you provide during onboarding (idea, stage, industry, etc.)</li>
          <li><strong>Usage data</strong> — anonymized analytics about feature usage to improve the product</li>
        </ul>

        <h2 className="text-text-primary text-sm font-semibold mt-6">2. How We Use Your Data</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To power your AI Co-Founder conversations</li>
          <li>To improve the quality of responses</li>
          <li>To remember your preferences and history across sessions</li>
          <li>Never to train third-party models</li>
        </ul>

        <h2 className="text-text-primary text-sm font-semibold mt-6">3. Data Storage</h2>
        <p>Conversations are stored in your browser (localStorage) by default. When you sign in with Google, they are also stored securely in our Supabase database. You can delete all data at any time from the Settings page.</p>

        <h2 className="text-text-primary text-sm font-semibold mt-6">4. Third-Party Services</h2>
        <p>AXCIS uses the following services to operate:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Supabase</strong> — if configured, authentication</li>
          <li><strong>Groq</strong> — LLM inference for chat responses</li>
          <li><strong>Brave Search / Google Custom Search</strong> — web search functionality</li>
        </ul>

        <h2 className="text-text-primary text-sm font-semibold mt-6">5. Contact</h2>
        <p>Questions about this policy? Reach out via the GitHub repository.</p>
      </div>
    </div>
  );
}
