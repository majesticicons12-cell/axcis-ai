/**
 * AXCIS AI — Telegram Bot
 *
 * Connects your Telegram to the AXCIS AI assistant.
 * Forwards messages to the local Next.js API and streams responses back.
 *
 * Commands:
 *   /start    — Welcome message
 *   /new      — Start a new conversation
 *   /status   — Show system status
 */

const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const AUTH_PIN = process.env.AUTH_PIN || '';

if (!TELEGRAM_TOKEN) {
  console.error('ERROR: TELEGRAM_BOT_TOKEN is not set in .env.local');
  process.exit(1);
}

console.log('');
console.log('  AXCIS AI — Telegram Bot');
console.log('  -----------------------');
console.log(`  API: ${API_BASE}`);
console.log('  Starting...');
console.log('');

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Per-chat state
const chatState = new Map();

function getState(chatId) {
  if (!chatState.has(chatId)) {
    chatState.set(chatId, { conversationId: null });
  }
  return chatState.get(chatId);
}

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  chatState.set(chatId, { conversationId: null });
  bot.sendMessage(chatId,
    `*AXCIS AI* — Your Personal Assistant\n\n` +
    `I can help you with anything:\n` +
    `- Answer questions & give advice\n` +
    `- Build websites & web apps\n` +
    `- Send emails & manage outreach\n` +
    `- Research any topic on the web\n` +
    `- Control your PC (local mode)\n\n` +
    `Just send me a message!\n\n` +
    `*Commands:*\n` +
    `/new — Start fresh conversation\n` +
    `/status — System status`,
    { parse_mode: 'Markdown' }
  );
});

// /new command
bot.onText(/\/new/, (msg) => {
  const chatId = msg.chat.id;
  const state = getState(chatId);
  state.conversationId = null;
  bot.sendMessage(chatId, 'New conversation started. Send me a message!');
});

// /status command
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const headers = {};
    if (AUTH_PIN) headers['x-auth-token'] = AUTH_PIN;

    const res = await fetch(`${API_BASE}/api/env`, { headers });
    if (res.ok) {
      const env = await res.json();
      bot.sendMessage(chatId,
        `*AXCIS AI Status*\n\n` +
        `System: Online\n` +
        `Mode: ${env.mode}\n` +
        `PC Control: ${env.pcControlEnabled ? 'Yes' : 'No'}\n` +
        `Email: ${env.emailEnabled ? 'Yes' : 'No'}\n` +
        `API: ${API_BASE}`,
        { parse_mode: 'Markdown' }
      );
    } else {
      bot.sendMessage(chatId, 'AXCIS AI server is not responding. Run `npm run dev` first.');
    }
  } catch {
    bot.sendMessage(chatId, 'Cannot connect to AXCIS AI at ' + API_BASE);
  }
});

// Handle regular messages
bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) return;
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const state = getState(chatId);
  const userMessage = msg.text;

  bot.sendChatAction(chatId, 'typing');

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (AUTH_PIN) headers['x-auth-token'] = AUTH_PIN;

    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: userMessage,
        conversationId: state.conversationId || undefined,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      bot.sendMessage(chatId, `Error: ${err.substring(0, 200)}`);
      return;
    }

    // Parse SSE stream
    const text = await response.text();
    const lines = text.split('\n');

    let fullText = '';
    let currentEvent = '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));

          switch (currentEvent) {
            case 'conversation_created':
              if (data.conversation?.id) {
                state.conversationId = data.conversation.id;
              }
              break;
            case 'token':
              if (data.text) fullText += data.text;
              break;
            case 'done':
              if (data.conversationId) {
                state.conversationId = data.conversationId;
              }
              break;
            case 'error':
              bot.sendMessage(chatId, data.message || 'Unknown error');
              return;
          }
        } catch {
          // Ignore
        }
      }
    }

    if (fullText) {
      // Telegram 4096 char limit
      if (fullText.length > 4000) {
        const chunks = [];
        let remaining = fullText;
        while (remaining.length > 0) {
          chunks.push(remaining.substring(0, 4000));
          remaining = remaining.substring(4000);
        }
        for (const chunk of chunks) {
          await bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' }).catch(() => {
            bot.sendMessage(chatId, chunk);
          });
        }
      } else {
        await bot.sendMessage(chatId, fullText, { parse_mode: 'Markdown' }).catch(() => {
          bot.sendMessage(chatId, fullText);
        });
      }
    } else {
      bot.sendMessage(chatId, '(No response. Try again.)');
    }
  } catch (err) {
    console.error('Chat error:', err);
    bot.sendMessage(chatId, 'Failed to connect. Make sure the server is running: npm run dev');
  }
});

bot.on('polling_error', (err) => {
  if (err.code === 'ETELEGRAM' && err.response?.statusCode === 409) {
    console.error('Another bot instance is running. Stop it first.');
    process.exit(1);
  }
  console.error('Polling error:', err.message);
});

console.log('  Bot is running! Send a message in Telegram.');
console.log('  Ctrl+C to stop.\n');
