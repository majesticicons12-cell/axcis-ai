'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
  placeholder?: string;
  actionTemplate?: string | null;
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

export default function ChatInput({ onSend, onStop, isStreaming, disabled, placeholder, actionTemplate }: ChatInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevActionRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!disabled && textareaRef.current) textareaRef.current.focus();
  }, [disabled]);

  useEffect(() => {
    if (actionTemplate && actionTemplate !== prevActionRef.current) {
      prevActionRef.current = actionTemplate;
      setText(actionTemplate);
    }
  }, [actionTemplate]);

  const processImage = useCallback(async (attachment: FileAttachment): Promise<string> => {
    try {
      setAttachments(prev => prev.map(a => a.id === attachment.id ? { ...a, processing: true } : a));
      const base64 = attachment.preview?.split(',')[1] || '';
      const mimeType = attachment.file.type || 'image/jpeg';
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, media_type: mimeType, prompt: 'Describe this image in detail.' }),
      });
      if (!response.ok) {
        const errMsg = (await response.json().catch(() => ({}))).error || 'Image analysis failed';
        setAttachments(prev => prev.map(a => a.id === attachment.id ? { ...a, processing: false } : a));
        return '';
      }
      const data = await response.json();
      const description = data.description || '';
      setAttachments(prev => prev.map(a => a.id === attachment.id ? { ...a, processedText: description, processing: false } : a));
      return description;
    } catch {
      setAttachments(prev => prev.map(a => a.id === attachment.id ? { ...a, processing: false } : a));
      return '';
    }
  }, []);

  const processAudio = useCallback(async (attachment: FileAttachment) => {
    try {
      setAttachments(prev => prev.map(a => a.id === attachment.id ? { ...a, processing: true } : a));
      const formData = new FormData();
      formData.append('file', attachment.file);
      const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (!response.ok) return;
      const data = await response.json();
      const transcription = data.text || '';
      setAttachments(prev => prev.map(a => a.id === attachment.id ? { ...a, processedText: transcription, processing: false } : a));
      setText(prev => prev + (prev ? '\n' : '') + transcription);
    } catch {
      // silently fail
    }
  }, []);

  const processTextFile = useCallback(async (attachment: FileAttachment) => {
    try {
      setAttachments(prev => prev.map(a => a.id === attachment.id ? { ...a, processing: true } : a));
      const content = await attachment.file.text();
      const truncated = content.length > 50000 ? content.slice(0, 50000) + '\n...(truncated)' : content;
      setAttachments(prev => prev.map(a => a.id === attachment.id ? { ...a, processedText: truncated, processing: false } : a));
      setText(prev => prev + (prev ? '\n\n' : '') + 'File: ' + attachment.name + '\n```\n' + truncated + '\n```');
    } catch {
      // silently fail
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      const type = file.type;
      const name = file.name.toLowerCase();
      let fileType: 'image' | 'audio' | 'text' | null = null;
      if (ALLOWED_TYPES.image.includes(type)) fileType = 'image';
      else if (ALLOWED_TYPES.audio.includes(type) || name.match(/\.(mp3|wav|ogg|m4a|webm|flac)$/)) fileType = 'audio';
      else if (ALLOWED_TYPES.text.includes(type) || name.match(/\.(txt|csv|json|md|xml|html|js|ts|py|css)$/)) fileType = 'text';
      if (!fileType) continue;
      if (fileType === 'image' && file.size > MAX_IMAGE_SIZE) continue;
      if (fileType === 'audio' && file.size > MAX_AUDIO_SIZE) continue;
      if (fileType === 'text' && file.size > MAX_TEXT_SIZE) continue;
      const attachment: FileAttachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        file, type: fileType, processing: false, name: file.name,
      };
      if (fileType === 'image') {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => { reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(file); });
        attachment.preview = dataUrl;
      }
      setAttachments(prev => [...prev, attachment]);
      if (fileType === 'audio') processAudio(attachment);
      else if (fileType === 'text') processTextFile(attachment);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processAudio, processTextFile]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || disabled || isStreaming) return;
    let finalMessage = '';
    const imageAttachments = attachments.filter(a => a.type === 'image');
    if (imageAttachments.length > 0 && trimmed) {
      const descriptions = await Promise.all(imageAttachments.map(a => processImage(a)));
      finalMessage = descriptions.join('\n') + '\n\n' + trimmed;
    } else if (imageAttachments.length > 0) {
      const descriptions = await Promise.all(imageAttachments.map(a => processImage(a)));
      finalMessage = descriptions.join('\n');
    } else {
      finalMessage = trimmed;
    }
    onSend(finalMessage);
    setText('');
    setAttachments([]);
  }, [text, attachments, disabled, isStreaming, onSend, processImage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const hasContent = text.trim().length > 0 || attachments.length > 0;

  return (
    <div className="max-w-3xl mx-auto">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-border-default text-xs text-text-secondary">
              {att.type === 'image' ? (
                <span className="text-accent">IMG</span>
              ) : att.type === 'audio' ? (
                <span className="text-accent">AUDIO</span>
              ) : (
                <span className="text-accent">FILE</span>
              )}
              <span className="truncate max-w-[100px]">{att.name}</span>
              <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="text-text-tertiary hover:text-text-primary cursor-pointer ml-1">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 bg-bg-tertiary border border-border-default rounded-xl px-3 py-2 focus-within:border-accent/30 transition-colors">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-bg-hover cursor-pointer shrink-0 transition-colors"
          title="Attach file"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M6.5 13.5a3 3 0 0 1-3-3V5a2.5 2.5 0 0 1 5 0v5.5a1 1 0 0 1-2 0V5a.5.5 0 0 0-1 0v5.5a2 2 0 0 0 4 0V5a3.5 3.5 0 1 0-7 0v5.5a4 4 0 0 0 8 0V5a.5.5 0 0 0-1 0v5.5a3 3 0 0 1-3 3z" fill="currentColor" />
          </svg>
        </button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Waiting...' : placeholder || 'Ask anything...'}
          disabled={isStreaming || disabled}
          rows={1}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-tertiary/50 resize-none outline-none max-h-[120px] py-1"
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
          }}
        />

        {isStreaming ? (
          <button onClick={onStop} className="p-1.5 rounded-lg text-danger hover:bg-danger/10 cursor-pointer shrink-0 transition-colors" title="Stop">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor" /></svg>
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!hasContent}
            className={`p-1.5 rounded-lg cursor-pointer shrink-0 transition-all ${
              hasContent ? 'text-accent hover:bg-accent/10' : 'text-text-tertiary/40 cursor-not-allowed'
            }`}
            title="Send"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M2 8L14 2L10 14L8 8L2 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
