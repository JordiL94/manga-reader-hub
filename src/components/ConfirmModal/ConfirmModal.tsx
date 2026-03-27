'use client';

import { cn } from '@/utils/cn';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  type?: 'delete' | 'confirm';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  type = 'confirm',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const isDelete = type === 'delete';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#16181d] p-6 shadow-2xl ring-1 ring-black/50">
        <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>

        <p className="mb-6 text-sm leading-relaxed text-gray-400">
          {description}
        </p>

        <div className="flex items-center justify-end gap-3">
          {/* The Safe Action: Given a solid, visible background so the eye naturally 
            rests here first, preventing muscle-memory misclicks.
          */}
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>

          {/* The Primary/Destructive Action: Dynamically styled. 
            If it's a delete action, it gets a modern, muted red tint.
          */}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'flex min-w-[100px] items-center justify-center rounded-md px-4 py-2 text-sm font-bold transition-all disabled:opacity-50',
              isDelete
                ? 'bg-red-500/10 text-red-500 ring-1 ring-red-500/20 hover:bg-red-500/20'
                : 'bg-violet-600 text-white hover:bg-violet-500'
            )}
          >
            {isLoading ? (
              <div
                className={cn(
                  'h-4 w-4 animate-spin rounded-full border-2 border-t-transparent',
                  isDelete ? 'border-red-500' : 'border-white'
                )}
              />
            ) : isDelete ? (
              'Delete'
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
