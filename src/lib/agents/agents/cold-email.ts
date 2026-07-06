import type { AgentConfig } from '../types';
import { sendEmail } from '@/lib/tools/email-sender';
import {
  listEmailTemplates,
  createEmailTemplate,
} from '@/lib/db';
import { createTask } from '@/lib/db';

export const coldEmailAgent: AgentConfig = {
  id: 'cold-email',
  name: 'Cold Email Agent',
  description: 'Writing cold emails, outreach campaigns, email templates, sending emails, and email copywriting',
  icon: '📧',
  systemPrompt: `You are AXCIS AI's Cold Email Agent — an expert cold email copywriter and outreach strategist.

Your job is to help the user craft and send effective cold emails for their business.

Rules:
- Write concise, personalized emails that get responses
- Keep subject lines short and intriguing (under 50 chars)
- Keep email body under 150 words — busy people don't read long emails
- Use a conversational, non-salesy tone
- Always include a clear, low-commitment CTA (call to action)
- When the user wants to send an email, use the send_email tool
- You can save reusable templates with save_template
- You can list existing templates with list_templates
- Create follow-up tasks when appropriate (e.g., "Follow up in 3 days")
- If the user provides context about their SaaS/product, tailor the email accordingly

Before sending, always show the draft to the user and confirm they want to send it.`,
  tools: [
    {
      name: 'send_email',
      description: 'Send an email via Gmail SMTP. Returns success or error status.',
      input_schema: {
        type: 'object' as const,
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject line' },
          body: { type: 'string', description: 'Email body (plain text or HTML)' },
          cc: { type: 'string', description: 'CC email address (optional)' },
          bcc: { type: 'string', description: 'BCC email address (optional)' },
        },
        required: ['to', 'subject', 'body'],
      },
      execute: async (input) => {
        const { to, subject, body, cc, bcc } = input as {
          to: string; subject: string; body: string; cc?: string; bcc?: string;
        };
        const result = await sendEmail({ to, subject, body, cc, bcc });
        return JSON.stringify(result);
      },
    },
    {
      name: 'list_templates',
      description: 'List all saved email templates.',
      input_schema: {
        type: 'object' as const,
        properties: {},
      },
      execute: async () => {
        const templates = listEmailTemplates();
        return JSON.stringify(templates);
      },
    },
    {
      name: 'save_template',
      description: 'Save a reusable email template.',
      input_schema: {
        type: 'object' as const,
        properties: {
          name: { type: 'string', description: 'Template name' },
          subject: { type: 'string', description: 'Subject line template (use {{variable}} for placeholders)' },
          body: { type: 'string', description: 'Body template (use {{variable}} for placeholders)' },
          variables: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of variable names used in the template',
          },
        },
        required: ['name', 'subject', 'body'],
      },
      execute: async (input) => {
        const { name, subject, body, variables } = input as {
          name: string; subject: string; body: string; variables?: string[];
        };
        const template = createEmailTemplate(name, subject, body, variables || []);
        return JSON.stringify(template);
      },
    },
    {
      name: 'create_followup_task',
      description: 'Create a follow-up task to remind the user to take action later.',
      input_schema: {
        type: 'object' as const,
        properties: {
          title: { type: 'string', description: 'Task title (e.g., "Follow up with John at Acme")' },
          description: { type: 'string', description: 'Additional details about the task' },
        },
        required: ['title'],
      },
      execute: async (input, context) => {
        const { title, description } = input as { title: string; description?: string };
        const task = createTask(title, {
          description,
          conversationId: context.conversationId,
          agentId: 'cold-email',
        });
        context.emitEvent('task_created', { task });
        return JSON.stringify(task);
      },
    },
  ],
  model: 'google/gemma-4-12B-it',
  maxTokens: 4096,
};
