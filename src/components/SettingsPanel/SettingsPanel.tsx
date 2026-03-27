'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLSelectElement>(null);
  const studyModeRef = useRef<HTMLInputElement>(null);

  // Safely inject localStorage values directly into the DOM nodes.
  // Zero state = Zero cascading renders!
  useEffect(() => {
    if (isOpen) {
      if (apiKeyRef.current) {
        apiKeyRef.current.value = localStorage.getItem('geminiApiKey') || '';
      }
      if (modelRef.current) {
        modelRef.current.value =
          localStorage.getItem('geminiModel') ||
          'gemini-3.1-flash-lite-preview';
      }
      if (studyModeRef.current) {
        studyModeRef.current.checked =
          localStorage.getItem('defaultStudyMode') === 'true';
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKeyRef.current)
      localStorage.setItem('geminiApiKey', apiKeyRef.current.value.trim());
    if (modelRef.current)
      localStorage.setItem('geminiModel', modelRef.current.value);
    if (studyModeRef.current)
      localStorage.setItem(
        'defaultStudyMode',
        studyModeRef.current.checked ? 'true' : 'false'
      );

    onClose();
  };

  return (
    // The outer wrapper controls whether you can click things.
    // We delay the 'invisible' class when closing so the slide animation has time to finish!
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-end transition-all duration-300',
        isOpen
          ? 'pointer-events-auto visible'
          : 'pointer-events-none invisible delay-300'
      )}
    >
      {/* Backdrop: Fades in and out */}
      <div
        className={cn(
          'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Slide-out Drawer: Physically slides left and right */}
      <div
        className={cn(
          'relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0f1115] shadow-2xl transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <h2 className="text-xl font-bold text-white">App Settings</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Settings Content */}
          <div className="flex-1 space-y-8 overflow-y-auto p-6">
            {/* API Key */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Gemini API Key
              </label>
              <input
                ref={apiKeyRef}
                type="password"
                placeholder="AIzaSy..."
                className="w-full rounded-md border border-gray-800 bg-[#16181d] px-4 py-2.5 text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                Stored locally on this device. Never saved to a database.
              </p>
            </div>

            {/* AI Model Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                AI Translation Model
              </label>
              <select
                ref={modelRef}
                className="w-full appearance-none rounded-md border border-gray-800 bg-[#16181d] px-4 py-2.5 text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              >
                <option value="gemini-3.1-flash-lite-preview">
                  Gemini 3.1 Flash Lite (Fastest)
                </option>
                <option value="gemini-3.1-flash-preview">
                  Gemini 3.1 Flash (High Accuracy)
                </option>
              </select>
              <div className="pointer-events-none absolute right-10 mt-[-30px] text-gray-500">
                ▼
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Lite is recommended for general reading. Switch to Flash if you
                encounter complex kanji or heavy slang.
              </p>
            </div>

            {/* Reading Mode Toggle */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-white/5 bg-[#16181d] p-4">
              <div>
                <label className="block text-sm font-medium text-gray-200">
                  Default to Study Mode
                </label>
                <p className="mt-1 text-xs text-gray-400">
                  Start with translations hidden. Hover or tap Japanese text
                  bubbles to reveal the English translation.
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center pt-1">
                <input
                  ref={studyModeRef}
                  type="checkbox"
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-gray-700 peer-checked:bg-violet-600 peer-focus:ring-2 peer-focus:ring-violet-500/50 peer-focus:outline-none after:absolute after:top-[6px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-white/10 bg-[#0f1115] p-6">
            <button
              onClick={handleSave}
              className="w-full rounded-md bg-violet-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-violet-500 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0f1115]"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
