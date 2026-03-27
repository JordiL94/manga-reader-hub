'use client';

import { useEffect, useRef } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // We use a ref to hold the input element directly
  const inputRef = useRef<HTMLInputElement>(null);

  // When the modal opens, we update the input's value directly.
  // Because there is no setState, there is no cascading render, and the linter is happy.
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.value = localStorage.getItem('geminiApiKey') || '';
    }
  }, [isOpen]);

  const handleSave = () => {
    if (inputRef.current) {
      localStorage.setItem('geminiApiKey', inputRef.current.value.trim());
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-[#0f1115] p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-bold text-white">App Settings</h2>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-400">
            Gemini API Key
          </label>
          {/* We replace value/onChange with the ref */}
          <input
            ref={inputRef}
            type="password"
            placeholder="AIzaSy..."
            className="w-full rounded bg-gray-900 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-violet-500"
          />
          <p className="mt-2 text-xs text-gray-500">
            Your key is stored locally on this device and is never saved to a
            database.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded bg-violet-600 px-6 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
