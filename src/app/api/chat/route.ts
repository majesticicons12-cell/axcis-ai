import { NextRequest } from 'next/server';
import { getDefaultAgent } from '@/lib/agents/registry';
import { executeAgent } from '@/lib/agents/executor';
import {
  createConversation,
  getConversation,
  getMessages,
  createMessage,
  updateConversation,
} from '@/lib/db';
import type { Message } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sseEncode(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('x-auth-token');
    const requiredPin = process.env.AUTH_PIN;
    if (requiredPin && authHeader !== requiredPin) {
      const cookiePin = request.cookies.get('axcis_auth')?.value;
      if (cookiePin !== requiredPin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const body = await request.json();
    const { message, conversationId: existingConvId, history: clientHistory } = body as {
      message: string;
      conversationId?: string;
      history?: { role: string; content: string }[];
    };

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const emit = (event: string, data: Record<string, unknown>) => {
      writer.write(encoder.encode(sseEncode(event, data))).catch(() => {});
    };

    (async () => {
      try {
        // 1. Get or create conversation
        let conversationId = existingConvId || '';
        if (existingConvId) {
          const existing = getConversation(existingConvId);
          if (!existing) {
            // Server DB lost this conversation (Vercel cold start)
            // Re-create it so server-side operations work for this request
            const title = message.length > 60 ? message.substring(0, 57) + '...' : message;
            createConversation(title);
            // Keep the client's conversationId so localStorage stays in sync
          }
        }

        if (!conversationId) {
          const title = message.length > 60 ? message.substring(0, 57) + '...' : message;
          const conv = createConversation(title);
          conversationId = conv.id;
          emit('conversation_created', { conversation: conv });
        }

        // 2. Save user message
        createMessage(conversationId, 'user', message);

        // 3. Always use the unified AXCIS agent
        const agentConfig = getDefaultAgent();

        emit('agent_selected', {
          agentId: agentConfig.id,
          agentName: agentConfig.name,
          confidence: 1.0,
          reasoning: 'Unified agent',
        });

        // 4. Get conversation history
        // Prefer server DB, fall back to client-provided history (handles Vercel cold starts)
        let history = getMessages(conversationId, 20);

        if (history.length <= 1 && clientHistory && clientHistory.length > 0) {
          // Server DB is empty/lost — use history sent from browser localStorage
          history = clientHistory.map((h, i) => ({
            id: `client_${i}`,
            conversationId,
            role: h.role as Message['role'],
            content: h.content,
            agentId: null,
            metadata: null,
            createdAt: new Date().toISOString(),
          }));
        }

        const fullResponse = await executeAgent(
          agentConfig,
          history.slice(0, -1),
          message,
          emit,
          conversationId
        );

        // 6. Save response
        const assistantMsg = createMessage(conversationId, 'assistant', fullResponse, agentConfig.id);

        // 7. Update title on first exchange
        if (history.length <= 1) {
          const shortTitle = message.length > 50 ? message.substring(0, 47) + '...' : message;
          updateConversation(conversationId, { title: shortTitle });
        }

        emit('done', { messageId: assistantMsg.id, conversationId });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
        emit('error', { message: errorMsg });
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
