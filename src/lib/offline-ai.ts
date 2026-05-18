'use client';

/**
 * Offline AI module using @huggingface/transformers
 * Supports multiple models, shows download progress, and runs in browser via WASM
 */

export interface OfflineModel {
  id: string;
  name: string;
  size: string;
  description: string;
  hfId: string;
  dtype: 'q4' | 'q4f16' | 'q8' | 'fp16';
  speed: 'fast' | 'medium' | 'slow';
}

export const AVAILABLE_MODELS: OfflineModel[] = [
  {
    id: 'smollm2-135m',
    name: 'SmolLM2 135M (Light)',
    size: '~118 MB',
    description: 'Smallest download, basic answers',
    hfId: 'HuggingFaceTB/SmolLM2-135M-Instruct',
    dtype: 'q4f16',
    speed: 'fast',
  },
  {
    id: 'smollm2-360m',
    name: 'SmolLM2 360M (Recommended)',
    size: '~273 MB',
    description: 'Best balance of size and quality',
    hfId: 'HuggingFaceTB/SmolLM2-360M-Instruct',
    dtype: 'q4f16',
    speed: 'medium',
  },
];

const STORAGE_KEY_PREFIX = 'axcis_offline_model_';
const ACTIVE_MODEL_KEY = 'axcis_active_offline_model';

type GenerateCallback = (token: string) => void;
type StatusListener = () => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let activePipeline: any = null;
let activeModelId: string | null = null;

class OfflineAIManager {
  isReady = false;
  isLoading = false;
  loadProgress = 0;
  loadStatus = '';
  error: string | null = null;
  currentModelId: string | null = null;

  private listeners: Set<StatusListener> = new Set();

  subscribe(fn: StatusListener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  getDownloadedModels(): string[] {
    if (typeof window === 'undefined') return [];
    const downloaded: string[] = [];
    for (const model of AVAILABLE_MODELS) {
      if (localStorage.getItem(STORAGE_KEY_PREFIX + model.id) === 'true') {
        downloaded.push(model.id);
      }
    }
    return downloaded;
  }

  isModelCached(): boolean {
    return this.getDownloadedModels().length > 0;
  }

  getActiveModelId(): string | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(ACTIVE_MODEL_KEY);
    if (stored && this.getDownloadedModels().includes(stored)) return stored;
    const downloaded = this.getDownloadedModels();
    return downloaded.length > 0 ? downloaded[0] : null;
  }

  async initialize(modelId?: string): Promise<void> {
    const targetModelId = modelId || AVAILABLE_MODELS[0].id;
    const model = AVAILABLE_MODELS.find(m => m.id === targetModelId);
    if (!model) throw new Error(`Unknown model: ${targetModelId}`);

    if (this.isLoading) return;
    if (this.isReady && activeModelId === targetModelId) return;

    this.isLoading = true;
    this.loadProgress = 0;
    this.loadStatus = `Preparing ${model.name}...`;
    this.error = null;
    this.currentModelId = targetModelId;
    this.notify();

    try {
      const { pipeline: createPipeline, env } = await import('@huggingface/transformers');

      env.allowLocalModels = false;
      env.useBrowserCache = true;

      this.loadStatus = `Downloading ${model.name} (${model.size})...`;
      this.notify();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activePipeline = await createPipeline('text-generation', model.hfId, {
        dtype: model.dtype,
        device: 'wasm',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progress_callback: (progress: any) => {
          if (progress && typeof progress.progress === 'number') {
            this.loadProgress = Math.round(progress.progress);
            this.loadStatus = `Downloading ${model.name}... ${this.loadProgress}%`;
            this.notify();
          } else if (progress && progress.status) {
            this.loadStatus = `${model.name}: ${progress.status}`;
            this.notify();
          }
        },
      });

      activeModelId = targetModelId;
      this.isReady = true;
      this.isLoading = false;
      this.loadProgress = 100;
      this.loadStatus = `${model.name} ready`;
      localStorage.setItem(STORAGE_KEY_PREFIX + targetModelId, 'true');
      localStorage.setItem(ACTIVE_MODEL_KEY, targetModelId);
      this.notify();
    } catch (err) {
      this.isLoading = false;
      this.loadProgress = 0;
      this.loadStatus = '';
      this.error = err instanceof Error ? err.message : 'Failed to load model';
      this.notify();
      throw err;
    }
  }

  async switchModel(modelId: string): Promise<void> {
    if (activeModelId === modelId && this.isReady) return;
    activePipeline = null;
    activeModelId = null;
    this.isReady = false;
    await this.initialize(modelId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractText(result: any): string {
    try {
      if (!Array.isArray(result) || result.length === 0) {
        return 'Could not generate a response.';
      }

      const generated = result[0]?.generated_text;

      // Case 1: string
      if (typeof generated === 'string') {
        return generated.trim();
      }

      // Case 2: array of message objects (chat format)
      if (Array.isArray(generated)) {
        for (let i = generated.length - 1; i >= 0; i--) {
          if (generated[i]?.role === 'assistant' && generated[i]?.content) {
            return generated[i].content.trim();
          }
        }
        const last = generated[generated.length - 1];
        if (last?.content) return last.content.trim();
        if (typeof last === 'string') return last.trim();
      }

      // Case 3: single message object
      if (generated && typeof generated === 'object' && generated.content) {
        return generated.content.trim();
      }

      return 'Could not parse response.';
    } catch {
      return 'Could not generate a response.';
    }
  }

  /** Generate a response */
  async generate(
    prompt: string,
    history: { role: string; content: string }[],
    onToken: GenerateCallback
  ): Promise<string> {
    if (!this.isReady || !activePipeline) {
      throw new Error('Offline AI not initialized');
    }

    const model = AVAILABLE_MODELS.find(m => m.id === activeModelId);
    const isSmallModel = activeModelId === 'smollm2-135m';

    // For the small 135M model, use simpler shorter system prompt
    // and stronger generation settings to prevent echoing
    const systemPrompt = isSmallModel
      ? 'You are AXCIS, an AI assistant. Give helpful answers. Do NOT repeat the question. Always provide new information in your response.'
      : 'You are AXCIS, an intelligent AI assistant running offline. Provide helpful, detailed, and thoughtful responses. Never repeat what the user said. Always give proper answers with explanations. Be conversational and friendly.';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(isSmallModel ? -2 : -4),
      { role: 'user', content: prompt },
    ];

    // Small model needs very different settings to avoid echoing
    const genSettings = isSmallModel
      ? {
          max_new_tokens: 200,
          temperature: 0.8,
          do_sample: true,
          top_p: 0.85,
          top_k: 40,
          repetition_penalty: 1.8,
          return_full_text: false,
        }
      : {
          max_new_tokens: 400,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.92,
          repetition_penalty: 1.3,
          return_full_text: false,
        };

    try {
      const result = await activePipeline(messages, genSettings);
      let text = this.extractText(result);

      // Post-processing for small model: remove any echoed input
      if (isSmallModel && text) {
        // If response starts with the user's exact message, strip it
        const promptLower = prompt.toLowerCase().trim();
        const textLower = text.toLowerCase().trim();
        if (textLower.startsWith(promptLower)) {
          text = text.slice(prompt.length).trim();
        }
        // If response is just a question mark or single word echo, provide fallback
        if (text.length < 3 || text === '?' || textLower === promptLower) {
          text = "I'm running on a very small offline model. I can help with basic questions but my answers may be short. Try asking a clear, specific question like 'What is AI?' or 'How does the internet work?'";
        }
      }

      // Stream tokens to UI
      const delay = isSmallModel ? 5 : 8;
      for (const char of text) {
        onToken(char);
        await new Promise(r => setTimeout(r, delay));
      }

      return text;
    } catch (err) {
      const errorMsg = `Offline AI error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      onToken(errorMsg);
      return errorMsg;
    }
  }
}

export const offlineAI = new OfflineAIManager();
