'use client';

import type { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const STATUS_CONFIG = {
  pending: { color: 'bg-warning', label: 'Pending' },
  in_progress: { color: 'bg-accent', label: 'In Progress' },
  completed: { color: 'bg-success', label: 'Done' },
  failed: { color: 'bg-danger', label: 'Failed' },
} as const;

export default function TaskList({ tasks, onUpdateStatus, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-text-tertiary text-xs">No tasks yet</p>
        <p className="text-text-tertiary text-[11px] mt-1">Agents will create tasks as they work</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {tasks.map(task => {
        const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
        return (
          <div
            key={task.id}
            className="group px-3 py-2.5 rounded-lg border border-border-subtle bg-bg-tertiary/50 hover:bg-bg-hover transition-colors"
          >
            <div className="flex items-start gap-2">
              <button
                onClick={() => {
                  const next = task.status === 'completed' ? 'pending' : 'completed';
                  onUpdateStatus(task.id, next);
                }}
                className="mt-0.5 shrink-0 cursor-pointer"
              >
                <div className={`w-3.5 h-3.5 rounded-full border-2 ${
                  task.status === 'completed'
                    ? 'bg-success border-success'
                    : `border-text-tertiary`
                } transition-colors`}>
                  {task.status === 'completed' && (
                    <svg viewBox="0 0 12 12" className="w-full h-full text-bg-primary">
                      <path d="M3 6L5.5 8.5L9 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${task.status === 'completed' ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-[11px] text-text-tertiary mt-0.5 truncate">{task.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
                  <span className="text-[10px] text-text-tertiary">{config.label}</span>
                </div>
              </div>
              <button
                onClick={() => onDelete(task.id)}
                className="hidden group-hover:block shrink-0 p-0.5 rounded text-text-tertiary hover:text-danger transition-colors cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
