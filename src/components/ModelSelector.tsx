'use client';

import { useState, useEffect } from 'react';
import { offlineAI, AVAILABLE_MODELS, type OfflineModel } from '@/lib/offline-ai';

interface ModelSelectorProps {
  isOnline: boolean;
}

export default function ModelSelector({ isOnline }: ModelSelectorProps) {
  const [downloadedModels, setDownloadedModels] = useState<string[]>([]);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setDownloadedModels(offlineAI.getDownloadedModels());
    setActiveModelId(offlineAI.getActiveModelId());

    const unsub = offlineAI.subscribe(() => {
      setIsLoading(offlineAI.isLoading);
      setProgress(offlineAI.loadProgress);
      setStatus(offlineAI.loadStatus);
      setError(offlineAI.error);
      setDownloadedModels(offlineAI.getDownloadedModels());
      setActiveModelId(offlineAI.getActiveModelId());
    });

    return () => { unsub(); };
  }, []);

  const handleDownload = async (model: OfflineModel) => {
    try {
      setError(null);
      await offlineAI.initialize(model.id);
    } catch {
      // Error is handled via subscription
    }
  };

  const handleSelect = async (modelId: string) => {
    try {
      setError(null);
      await offlineAI.switchModel(modelId);
    } catch {
      // Error is handled via subscription
    }
  };

  const speedBadge = (speed: OfflineModel['speed']) => {
    switch (speed) {
      case 'fast': return { label: 'Fast', cls: 'bg-success/15 text-success' };
      case 'medium': return { label: 'Medium', cls: 'bg-accent/15 text-accent' };
      case 'slow': return { label: 'Slower', cls: 'bg-warning/15 text-warning' };
    }
  };

  return (
    <div className="space-y-2">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-text-secondary bg-bg-elevated border border-border-default rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 2V10M8 10L5 7M8 10L11 7M3 13H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-medium">Offline AI Models</span>
          {downloadedModels.length > 0 && (
            <span className="text-[10px] bg-success/15 text-success px-1.5 py-0.5 rounded">
              {downloadedModels.length} ready
            </span>
          )}
        </div>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Download progress bar */}
      {isLoading && (
        <div className="px-3 py-2 bg-bg-elevated border border-border-default rounded-lg space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-secondary truncate max-w-[180px]">{status}</span>
            <span className="text-[11px] text-accent font-medium">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-bg-primary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-3 py-2 text-[11px] text-danger bg-danger/8 border border-danger/15 rounded-lg">
          {error}
        </div>
      )}

      {/* Expanded model list */}
      {expanded && (
        <div className="space-y-1.5 animate-fade-in">
          {AVAILABLE_MODELS.map((model) => {
            const isDownloaded = downloadedModels.includes(model.id);
            const isActive = activeModelId === model.id;
            const badge = speedBadge(model.speed);

            return (
              <div
                key={model.id}
                className={`px-3 py-2.5 rounded-lg border transition-colors ${
                  isActive
                    ? 'bg-accent/8 border-accent/25'
                    : 'bg-bg-elevated border-border-default hover:border-border-hover'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-text-primary">{model.name}</span>
                      <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-text-tertiary mt-0.5">
                      {model.size} - {model.description}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="ml-2 shrink-0">
                    {isActive && isDownloaded ? (
                      <span className="text-[10px] text-success font-medium px-2 py-1 bg-success/10 rounded">
                        Active
                      </span>
                    ) : isDownloaded ? (
                      <button
                        onClick={() => handleSelect(model.id)}
                        disabled={isLoading}
                        className="text-[10px] text-accent font-medium px-2 py-1 bg-accent/10 rounded hover:bg-accent/20 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Use
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDownload(model)}
                        disabled={isLoading || !isOnline}
                        className="text-[10px] text-text-secondary font-medium px-2 py-1 bg-bg-primary border border-border-default rounded hover:bg-bg-hover transition-colors cursor-pointer disabled:opacity-50"
                        title={!isOnline ? 'Need internet to download' : ''}
                      >
                        {isOnline ? 'Download' : 'Need net'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
