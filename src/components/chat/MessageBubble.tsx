'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isStreaming: boolean;
  agentName?: string;
  currentToolCall?: { name: string } | null;
}

const TOOL_LABELS: Record<string, string> = {
  // Web research
  search_web: 'Searching the web...',
  read_webpage: 'Reading webpage...',
  // Website building
  create_website: 'Building website...',
  update_website_file: 'Updating file...',
  // Email
  send_email: 'Sending email...',
  list_email_templates: 'Loading templates...',
  save_email_template: 'Saving template...',
  // Tasks
  create_task: 'Creating task...',
  // PC Control
  run_command: 'Running command...',
  run_powershell: 'Running PowerShell...',
  open_application: 'Opening app...',
  get_system_info: 'Getting system info...',
  list_directory: 'Browsing files...',
  read_file: 'Reading file...',
  write_file: 'Writing file...',
  create_folder: 'Creating folder...',
  delete_path: 'Deleting...',
  move_rename: 'Moving...',
  copy_path: 'Copying...',
  open_url: 'Opening URL...',
  search_files: 'Searching files...',
  get_processes: 'Listing processes...',
  kill_process: 'Stopping process...',
  get_network_info: 'Getting network info...',
  set_clipboard: 'Copying to clipboard...',
  get_clipboard: 'Reading clipboard...',
};

export default function MessageBubble({ message, isStreaming, agentName, currentToolCall }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const metadata = message.metadata as Record<string, unknown> | null;
  const projectId = metadata?.projectId as string | undefined;
  const previewUrl = metadata?.previewUrl as string | undefined;

  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Agent avatar */}
      {!isUser && (
        <div className="shrink-0 mt-1">
          <div className="w-7 h-7 rounded-lg bg-bg-elevated border border-border-default flex items-center justify-center border-gradient">
            <div className="w-2 h-2 rounded-full bg-accent" />
          </div>
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? 'order-first' : ''}`}>
        {/* Agent label */}
        {!isUser && agentName && (
          <div className="text-[11px] text-accent/70 mb-1 font-medium tracking-wide uppercase">{agentName}</div>
        )}

        {/* Message bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-user-bubble text-text-primary rounded-br-md'
              : 'bg-bg-elevated/80 border border-border-subtle text-text-primary rounded-bl-md'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className={`markdown-content ${isStreaming && message.content ? 'streaming-cursor' : ''}`}>
              {message.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              ) : isStreaming ? (
                <div className="flex items-center gap-2.5 text-text-tertiary py-0.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" style={{ animationDelay: '200ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" style={{ animationDelay: '400ms' }} />
                  </div>
                  <span className="text-xs">Thinking...</span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Tool call indicator */}
        {currentToolCall && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/5 border border-accent/10 animate-fade-in">
            <svg className="w-3.5 h-3.5 text-accent animate-spin" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" />
            </svg>
            <span className="text-xs text-accent font-medium">
              {TOOL_LABELS[currentToolCall.name] || `Running ${currentToolCall.name}...`}
            </span>
          </div>
        )}

        {/* Website preview */}
        {projectId && previewUrl && (
          <div className="mt-3 rounded-xl overflow-hidden border border-border-default animate-fade-in">
            <div className="flex items-center justify-between px-3 py-2 bg-bg-surface border-b border-border-default">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-danger/60" />
                  <div className="w-2 h-2 rounded-full bg-warning/60" />
                  <div className="w-2 h-2 rounded-full bg-success/60" />
                </div>
                <span className="text-[11px] text-text-tertiary font-medium">Preview</span>
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 text-[11px] text-accent bg-accent/8 rounded-md hover:bg-accent/15 transition-colors font-medium"
              >
                Open
              </a>
            </div>
            <iframe
              src={previewUrl}
              className="w-full h-[350px] bg-white"
              sandbox="allow-scripts allow-same-origin"
              title="Website Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
