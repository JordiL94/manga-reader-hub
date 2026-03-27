'use client';

import { useRef } from 'react';

interface DirectorySelectorProps {
  onFilesSelected: (files: File[]) => void;
}

export default function DirectorySelector({
  onFilesSelected,
}: DirectorySelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
    // Reset the input so the user can select the same folder again if needed
    e.target.value = '';
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        // @ts-expect-error - webkitdirectory is non-standard but required for folder selection
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
      />

      {/* The New Button:
        Sleek, dark, matches the settings gear, and uses a subtle violet focus ring.
      */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex h-10 items-center gap-2 rounded-md bg-[#16181d] px-4 text-sm font-medium text-gray-300 shadow-sm ring-1 ring-white/10 transition-all hover:bg-[#1f2229] hover:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
      >
        <span className="text-lg leading-none">+</span>
        Import Folder
      </button>
    </div>
  );
}
