import fs from 'fs';
import path from 'path';
import { generateId, now } from '@/lib/utils';
import type { Conversation, Message, Task, EmailTemplate, GeneratedProject } from '@/types';

const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = IS_VERCEL ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface Database {
  conversations: Conversation[];
  messages: Message[];
  tasks: Task[];
  emailTemplates: EmailTemplate[];
  generatedProjects: GeneratedProject[];
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(path.join(DATA_DIR, 'projects'))) {
    fs.mkdirSync(path.join(DATA_DIR, 'projects'), { recursive: true });
  }
}

function getEmptyDb(): Database {
  return {
    conversations: [],
    messages: [],
    tasks: [],
    emailTemplates: [],
    generatedProjects: [],
  };
}

function readDb(): Database {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const empty = getEmptyDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(raw) as Database;
}

function writeDb(db: Database): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// --- Conversations ---

export function listConversations(limit = 50, offset = 0): Conversation[] {
  const db = readDb();
  return db.conversations
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(offset, offset + limit);
}

export function getConversation(id: string): Conversation | null {
  const db = readDb();
  return db.conversations.find(c => c.id === id) ?? null;
}

export function createConversation(title: string, agentId: string | null = null): Conversation {
  const db = readDb();
  const conv: Conversation = {
    id: generateId('conv'),
    title,
    agentId,
    createdAt: now(),
    updatedAt: now(),
  };
  db.conversations.push(conv);
  writeDb(db);
  return conv;
}

export function updateConversation(id: string, updates: Partial<Pick<Conversation, 'title' | 'agentId'>>): Conversation | null {
  const db = readDb();
  const idx = db.conversations.findIndex(c => c.id === id);
  if (idx === -1) return null;
  db.conversations[idx] = { ...db.conversations[idx], ...updates, updatedAt: now() };
  writeDb(db);
  return db.conversations[idx];
}

export function deleteConversation(id: string): boolean {
  const db = readDb();
  const len = db.conversations.length;
  db.conversations = db.conversations.filter(c => c.id !== id);
  db.messages = db.messages.filter(m => m.conversationId !== id);
  writeDb(db);
  return db.conversations.length < len;
}

// --- Messages ---

export function getMessages(conversationId: string, limit = 100): Message[] {
  const db = readDb();
  return db.messages
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-limit);
}

export function createMessage(
  conversationId: string,
  role: Message['role'],
  content: string,
  agentId: string | null = null,
  metadata: Record<string, unknown> | null = null
): Message {
  const db = readDb();
  const msg: Message = {
    id: generateId('msg'),
    conversationId,
    role,
    content,
    agentId,
    metadata,
    createdAt: now(),
  };
  db.messages.push(msg);
  // Update conversation timestamp
  const convIdx = db.conversations.findIndex(c => c.id === conversationId);
  if (convIdx !== -1) {
    db.conversations[convIdx].updatedAt = now();
  }
  writeDb(db);
  return msg;
}

// --- Tasks ---

export function listTasks(filters?: { status?: string; conversationId?: string }): Task[] {
  const db = readDb();
  let tasks = db.tasks;
  if (filters?.status) tasks = tasks.filter(t => t.status === filters.status);
  if (filters?.conversationId) tasks = tasks.filter(t => t.conversationId === filters.conversationId);
  return tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createTask(
  title: string,
  opts: { description?: string; conversationId?: string; agentId?: string } = {}
): Task {
  const db = readDb();
  const task: Task = {
    id: generateId('task'),
    conversationId: opts.conversationId ?? null,
    title,
    description: opts.description ?? null,
    status: 'pending',
    agentId: opts.agentId ?? null,
    result: null,
    createdAt: now(),
    updatedAt: now(),
  };
  db.tasks.push(task);
  writeDb(db);
  return task;
}

export function updateTask(id: string, updates: Partial<Pick<Task, 'status' | 'result'>>): Task | null {
  const db = readDb();
  const idx = db.tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;
  db.tasks[idx] = { ...db.tasks[idx], ...updates, updatedAt: now() };
  writeDb(db);
  return db.tasks[idx];
}

export function deleteTask(id: string): boolean {
  const db = readDb();
  const len = db.tasks.length;
  db.tasks = db.tasks.filter(t => t.id !== id);
  writeDb(db);
  return db.tasks.length < len;
}

// --- Email Templates ---

export function listEmailTemplates(): EmailTemplate[] {
  const db = readDb();
  return db.emailTemplates.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getEmailTemplate(id: string): EmailTemplate | null {
  const db = readDb();
  return db.emailTemplates.find(t => t.id === id) ?? null;
}

export function createEmailTemplate(
  name: string,
  subject: string,
  body: string,
  variables: string[] = []
): EmailTemplate {
  const db = readDb();
  const tmpl: EmailTemplate = {
    id: generateId('tmpl'),
    name,
    subject,
    body,
    variables,
    createdAt: now(),
    updatedAt: now(),
  };
  db.emailTemplates.push(tmpl);
  writeDb(db);
  return tmpl;
}

export function updateEmailTemplate(
  id: string,
  updates: Partial<Pick<EmailTemplate, 'name' | 'subject' | 'body' | 'variables'>>
): EmailTemplate | null {
  const db = readDb();
  const idx = db.emailTemplates.findIndex(t => t.id === id);
  if (idx === -1) return null;
  db.emailTemplates[idx] = { ...db.emailTemplates[idx], ...updates, updatedAt: now() };
  writeDb(db);
  return db.emailTemplates[idx];
}

export function deleteEmailTemplate(id: string): boolean {
  const db = readDb();
  const len = db.emailTemplates.length;
  db.emailTemplates = db.emailTemplates.filter(t => t.id !== id);
  writeDb(db);
  return db.emailTemplates.length < len;
}

// --- Generated Projects ---

export function listProjects(): GeneratedProject[] {
  const db = readDb();
  return db.generatedProjects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createProject(
  name: string,
  projectPath: string,
  opts: { description?: string; conversationId?: string } = {}
): GeneratedProject {
  const db = readDb();
  const proj: GeneratedProject = {
    id: generateId('proj'),
    conversationId: opts.conversationId ?? null,
    name,
    description: opts.description ?? null,
    path: projectPath,
    createdAt: now(),
  };
  db.generatedProjects.push(proj);
  writeDb(db);
  return proj;
}

export function getProject(id: string): GeneratedProject | null {
  const db = readDb();
  return db.generatedProjects.find(p => p.id === id) ?? null;
}
