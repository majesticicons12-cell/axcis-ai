// Environment detection for local vs cloud mode

export function isLocalMode(): boolean {
  return !process.env.VERCEL;
}

export function isCloudMode(): boolean {
  return !!process.env.VERCEL;
}

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (isCloudMode()) {
    return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://axcis-ai.vercel.app';
  }
  return 'http://localhost:3000';
}

export function getEnvironmentInfo() {
  return {
    mode: isLocalMode() ? 'local' : 'cloud',
    pcControlEnabled: isLocalMode(),
    emailEnabled: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
    telegramEnabled: !!process.env.TELEGRAM_BOT_TOKEN,
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
  };
}
