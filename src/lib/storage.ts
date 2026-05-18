import type { Conversation, Message } from '@/types';

const CONVERSATIONS_KEY = 'axcis_conversations';
const MESSAGES_KEY = 'axcis_messages';

function isClient(): boolean {
  return typeof window !== 'undefined';
}

// --- Conversations ---

export function getStoredConversations(): Conversation[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

export function saveConversation(conv: Conversation): void {
  if (!isClient()) return;
  const convs = getStoredConversations();
  const idx = convs.findIndex(c => c.id === conv.id);
  if (idx >= 0) {
    convs[idx] = { ...convs[idx], ...conv };
  } else {
    convs.push(conv);
  }
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
}

export function updateStoredConversation(id: string, updates: Partial<Conversation>): void {
  if (!isClient()) return;
  const convs = getStoredConversations();
  const idx = convs.findIndex(c => c.id === id);
  if (idx >= 0) {
    convs[idx] = { ...convs[idx], ...updates };
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
  }
}

export function deleteStoredConversation(id: string): void {
  if (!isClient()) return;
  const convs = getStoredConversations().filter(c => c.id !== id);
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
  // Also delete messages for this conversation
  const msgs = getStoredMessages(id);
  if (msgs.length > 0) {
    const allMsgs = getAllStoredMessages().filter(m => m.conversationId !== id);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMsgs));
  }
}

// --- Messages ---

function getAllStoredMessages(): Message[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
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
  if (idx >= 0) {
    msgs[idx] = msg;
  } else {
    msgs.push(msg);
  }
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
}

export function updateStoredMessage(id: string, updates: Partial<Message>): void {
  if (!isClient()) return;
  const msgs = getAllStoredMessages();
  const idx = msgs.findIndex(m => m.id === id);
  if (idx >= 0) {
    msgs[idx] = { ...msgs[idx], ...updates };
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
  }
}

export function replaceMessageById(oldId: string, newMsg: Message): void {
  if (!isClient()) return;
  const msgs = getAllStoredMessages();
  const idx = msgs.findIndex(m => m.id === oldId);
  if (idx >= 0) {
    msgs[idx] = newMsg;
  } else {
    msgs.push(newMsg);
  }
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
}
