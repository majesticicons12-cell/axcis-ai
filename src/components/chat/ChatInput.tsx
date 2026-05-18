'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

interface FileAttachment {
  id: string;
  file: File;
  type: 'image' | 'audio' | 'text';
  preview?: string;
  processedText?: string;
  processing: boolean;
  name: string;
}

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/x-m4a'],
  text: ['text/plain', 'text/csv', 'text/html', 'application/json', 'application/xml', '.txt', '.csv', '.json', '.md'],
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
const MAX_TEXT_SIZE = 500 * 1024;

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const processImage = useCallback(async (attachment: FileAttachment): Promise<string> => {
    try {
      setAttachments(prev => prev.map(a => a.id === attachment.id ? { ...a, processing: true } : a));

      const base64 = attachment.preview?.split(',')[1] || '';
      const mimeType = attachment.file.type || 'image/jpeg';

      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          media_type: mimeType,
          prompt: 'Describe this image in detail. What do you see?',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        return `[Error analyzing image: ${err.error}]`;
      }

      const data = await response.json();
      const description = data.description || 'No description available.';

      setAttachments(prev => prev.map(a =>
        a.id === attachment.id ? { ...a, processedText: description, processing: false } : a
      ));

      return description;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Vision API error';
      setAttachments(prev => prev.map(a =>
        a.id === attachment.id ? { ...a, processedText: `[Error: ${errorMsg}]`, processing: false } : a
      ));
      return `[Error analyzing image: ${errorMsg}]`;
    }
  }, []);

  const processAudio = useCallback(async (attachment: FileAttachment) => {
    try {
      setAttachments(prev => prev.map(a => a.id === attachment.id ? { ...a, processing: true } : a));

      const formData = new FormData();
      formData.append('file', attachment.file);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        setAttachments(prev => prev.map(a =>
          a.id === attachment.id ? { ...a, processedText: `[Transcription error: ${err.error}]`, processing: false } : a
        ));
        return;
      }

      const data = await response.json();
      const transcription = data.text || '';

      setAttachments(prev => prev.map(a =>
        a.id === attachment.id ? { ...a, processedText: transcription, processing: false } : a
      ));

      setText(prev => prev + (prev ? '\n' : '') + transcription);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Transcription error';
      setAttachments(prev => prev.map(a =>
        a.id === attachment.id ? { ...a, processedText: `[Error: ${errorMsg}]`, processing: false } : a
      ));
    }
  }, []);

  const processTextFile = useCallback(async (attachment: FileAttachment) => {
    try {
      setAttachments(prev => prev.map(a => a.id === attachment.id ? { ...a, processing: true } : a));

      const content = await attachment.file.text();
      const truncated = content.length > 50000 ? content.slice(0, 50000) + '\n...(truncated)' : content;

      setAttachments(prev => prev.map(a =>
        a.id === attachment.id ? { ...a, processedText: truncated, processing: false } : a
      ));

      const fileLabel = `\`${attachment.name}\`:\n\`\`\`\n${truncated}\n\`\`\``;
      setText(prev => prev + (prev ? '\n\n' : '') + fileLabel);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'File read error';
      setAttachments(prev => prev.map(a =>
        a.id === attachment.id ? { ...a, processedText: `[Error: ${errorMsg}]`, processing: false } : a
      ));
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const type = file.type;
      const name = file.name.toLowerCase();

      let fileType: 'image' | 'audio' | 'text' | null = null;

      if (ALLOWED_TYPES.image.includes(type)) {
        fileType = 'image';
      } else if (ALLOWED_TYPES.audio.includes(type) || name.match(/\.(mp3|wav|ogg|m4a|webm|flac)$/)) {
        fileType = 'audio';
      } else if (ALLOWED_TYPES.text.includes(type) || name.match(/\.(txt|csv|json|md|xml|html|js|ts|py|css)$/)) {
        fileType = 'text';
      }

      if (!fileType) {
        alert(`Unsupported file type: ${type || name}`);
        continue;
      }

      if (fileType === 'image' && file.size > MAX_IMAGE_SIZE) {
        alert(`Image too large (max 10MB): ${file.name}`);
        continue;
      }
      if (fileType === 'audio' && file.size > MAX_AUDIO_SIZE) {
        alert(`Audio too large (max 25MB): ${file.name}`);
        continue;
      }
      if (fileType === 'text' && file.size > MAX_TEXT_SIZE) {
        alert(`Text file too large (max 500KB): ${file.name}`);
        continue;
      }

      const attachment: FileAttachment = {
        id: `attachment_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        file,
        type: fileType,
        processing: false,
        name: file.name,
      };

      if (fileType === 'image') {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        attachment.preview = dataUrl;
      }

      setAttachments(prev => [...prev, attachment]);

      if (fileType === 'audio') {
        processAudio(attachment);
      } else if (fileType === 'text') {
        processTextFile(attachment);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processAudio, processTextFile]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || disabled) return;

    let finalMessage = '';

    const imageAttachments = attachments.filter(a => a.type === 'image');

    if (imageAttachments.length > 0) {
      const descriptions: string[] = [];
      for (const att of imageAttachments) {
        const desc = await processImage(att);
        const imgTag = att.preview ? `![${att.name}](${att.preview})` : '';
        descriptions.push(`${imgTag}\n\n**Image:** ${att.name}\n**Description:** ${desc}`);
      }
      finalMessage = descriptions.join('\n\n---\n\n');
    }

    if (trimmed) {
      finalMessage = finalMessage ? `${finalMessage}\n\n**User:** ${trimmed}` : trimmed;
    }

    onSend(finalMessage);
    setText('');
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, attachments, disabled, onSend, processImage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  };

  const hasContent = text.trim().length > 0 || attachments.length > 0;
  const isProcessing = attachments.some(a => a.processing);

  return (
    <div className="border-t border-border-default bg-bg-secondary/80 backdrop-blur-sm px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-1">
            {attachments.map(att => (
              <div
                key={att.id}
                className="relative group flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-border-default text-xs"
              >
                {att.type === 'image' && att.preview ? (
                  <div className="relative">
                    <img
                      src={att.preview}
                      alt={att.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                    {att.processing && (
                      <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" />
                        </svg>
                      </div>
                    )}
                  </div>
                ) : att.type === 'audio' ? (
                  <svg className="w-5 h-5 text-accent shrink-0" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6V10M6.5 4V12M9 3V13M11.5 5V11M13 7V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-accent shrink-0" viewBox="0 0 16 16" fill="none">
                    <path d="M9 1H4C3.44772 1 3 1.44772 3 2V14C3 14.5523 3.44772 15 4 15H12C12.5523 15 13 14.5523 13 14V5L9 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    <path d="M9 1V5H13" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-text-primary truncate max-w-[120px]">{att.name}</span>
                  {att.processing && (
                    <span className="text-accent text-[10px]">
                      {att.type === 'image' ? 'Analyzing...' : 'Transcribing...'}
                    </span>
                  )}
                  {!att.processing && att.processedText && (
                    <span className="text-success text-[10px]">Ready</span>
                  )}
                </div>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center text-text-tertiary hover:text-danger hover:border-danger/30 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="flex items-end gap-3 px-4 py-3 rounded-2xl bg-bg-tertiary border border-border-default focus-within:border-accent/30 focus-within:shadow-[0_0_0_1px_rgba(0,200,255,0.1)] transition-all">
          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-accent hover:bg-bg-hover transition-all cursor-pointer disabled:opacity-40"
            title="Attach image, audio, or file"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 5V13M5 9H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="1.5" y="1.5" width="15" height="15" rx="4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/x-m4a,text/plain,text/csv,application/json,.txt,.csv,.json,.md,.js,.ts,.py"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={placeholder || 'Ask AXCIS anything...'}
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-text-primary text-sm placeholder-text-tertiary resize-none outline-none max-h-[200px] leading-relaxed"
          />

          <button
            onClick={handleSend}
            disabled={!hasContent || disabled || isProcessing}
            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              hasContent && !disabled && !isProcessing
                ? 'bg-accent text-bg-primary hover:bg-accent-bright glow-accent-sm'
                : 'bg-bg-hover text-text-tertiary cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Helper text */}
        <div className="flex items-center gap-3 mt-1.5 px-1">
          <span className="text-[10px] text-text-tertiary">
            Supports images, audio, and text files
          </span>
          {isProcessing && (
            <span className="text-[10px] text-accent animate-pulse">
              Processing...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
