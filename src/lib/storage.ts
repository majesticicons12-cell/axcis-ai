import type { Conversation, Message } from '@/types';

function isClient(): boolean {
  return typeof window !== 'undefined';
}

function getUserId(): string {
  if (!isClient()) return '';
  try { return localStorage.getItem('axcis_user_id') || ''; } catch { return ''; }
}

export function setUserId(id: string): void {
  if (!isClient()) return;
  localStorage.setItem('axcis_user_id', id);
}

export function clearUserId(): void {
  if (!isClient()) return;
  localStorage.removeItem('axcis_user_id');
}

// --- Background Settings ---

export function getBgType(): string {
  if (!isClient()) return 'default';
  try { return localStorage.getItem('axcis_bg_type') || 'default'; } catch { return 'default'; }
}

export function setBgType(type: string): void {
  if (!isClient()) return;
  localStorage.setItem('axcis_bg_type', type);
}

export function getBgValue(): string {
  if (!isClient()) return '';
  try { return localStorage.getItem('axcis_bg_value') || ''; } catch { return ''; }
}

export function setBgValue(value: string): void {
  if (!isClient()) return;
  localStorage.setItem('axcis_bg_value', value);
}

// --- System Prompt ---

export function getSystemPrompt(): string {
  if (!isClient()) return '';
  try { return localStorage.getItem('axcis_sysprompt') || ''; } catch { return ''; }
}

export function setSystemPrompt(prompt: string): void {
  if (!isClient()) return;
  if (prompt) localStorage.setItem('axcis_sysprompt', prompt);
  else localStorage.removeItem('axcis_sysprompt');
}

// --- Onboarding ---

export interface OnboardingData {
  idea: string;
  stage: string;
  industry: string;
  challenge: string;
  team: string;
}

export function hasCompletedOnboarding(): boolean {
  if (!isClient()) return false;
  try { return localStorage.getItem('axcis_onboarded') === 'true'; } catch { return false; }
}

export function setOnboarded(): void {
  if (!isClient()) return;
  localStorage.setItem('axcis_onboarded', 'true');
}

export function getOnboardingData(): OnboardingData | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem('axcis_onboarding');
    return raw ? JSON.parse(raw) as OnboardingData : null;
  } catch { return null; }
}

export function setOnboardingData(data: OnboardingData): void {
  if (!isClient()) return;
  localStorage.setItem('axcis_onboarding', JSON.stringify(data));
  setOnboarded();
}

function convKey(): string {
  const uid = getUserId();
  return uid ? `axcis_conv_${uid}` : 'axcis_conversations';
}

function msgKey(): string {
  const uid = getUserId();
  return uid ? `axcis_msg_${uid}` : 'axcis_messages';
}

// --- Conversations ---

export function getStoredConversations(): Conversation[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(convKey());
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch { return []; }
}

export function saveConversation(conv: Conversation): void {
  if (!isClient()) return;
  const convs = getStoredConversations();
  const idx = convs.findIndex(c => c.id === conv.id);
  if (idx >= 0) convs[idx] = { ...convs[idx], ...conv };
  else convs.push(conv);
  localStorage.setItem(convKey(), JSON.stringify(convs));
}

export function updateStoredConversation(id: string, updates: Partial<Conversation>): void {
  if (!isClient()) return;
  const convs = getStoredConversations();
  const idx = convs.findIndex(c => c.id === id);
  if (idx >= 0) {
    convs[idx] = { ...convs[idx], ...updates };
    localStorage.setItem(convKey(), JSON.stringify(convs));
  }
}

export function deleteStoredConversation(id: string): void {
  if (!isClient()) return;
  const convs = getStoredConversations().filter(c => c.id !== id);
  localStorage.setItem(convKey(), JSON.stringify(convs));
  const msgs = getStoredMessages(id);
  if (msgs.length > 0) {
    const allMsgs = getAllStoredMessages().filter(m => m.conversationId !== id);
    localStorage.setItem(msgKey(), JSON.stringify(allMsgs));
  }
}

// --- Messages ---

function getAllStoredMessages(): Message[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(msgKey());
    if (!raw) return [];
    return JSON.parse(raw) as Message[];
  } catch { return []; }
}

export function getStoredMessages(conversationId: string): Message[] {
  return getAllStoredMessages()
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function saveMessage(msg: Message): void {
  if (!isClient()) return;
  const msgs = getAllStoredMessages();
  const idx = msgs.findIndex(m => m.id === msg.id);
  if (idx >= 0) msgs[idx] = msg;
  else msgs.push(msg);
  localStorage.setItem(msgKey(), JSON.stringify(msgs));
}

export function updateStoredMessage(id: string, updates: Partial<Message>): void {
  if (!isClient()) return;
  const msgs = getAllStoredMessages();
  const idx = msgs.findIndex(m => m.id === id);
  if (idx >= 0) {
    msgs[idx] = { ...msgs[idx], ...updates };
    localStorage.setItem(msgKey(), JSON.stringify(msgs));
  }
}

export function replaceMessageById(oldId: string, newMsg: Message): void {
  if (!isClient()) return;
  const msgs = getAllStoredMessages();
  const idx = msgs.findIndex(m => m.id === oldId);
  if (idx >= 0) msgs[idx] = newMsg;
  else msgs.push(newMsg);
  localStorage.setItem(msgKey(), JSON.stringify(msgs));
}
