'use client';

import { ChangeEvent, useRef } from 'react';

// We explicitly type the props to ensure strict adherence
interface DirectorySelectorProps {
  onFilesSelected: (files: File[]) => void;
}

export default function DirectorySelector({
  onFilesSelected,
}: DirectorySelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    // Convert the FileList iterable to an actual Array so we can strictly type and manipulate it
    const filesArray: File[] = Array.from(fileList);

    // Filter out anything that isn't an image (ignores hidden system files like .DS_Store)
    const imageFiles = filesArray.filter((file) =>
      file.type.startsWith('image/')
    );

    // Natural Sorting: localeCompare with numeric: true automatically understands
    // that "page_2.jpg" comes before "page_10.jpg" without needing a complex regex.
    const sortedFiles = imageFiles.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );

    if (sortedFiles.length > 0) {
      onFilesSelected(sortedFiles);
    }

    // Reset the input so you can re-select the same directory if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* We hide the actual input because the default browser UI is incredibly ugly.
        The `webkitdirectory` attribute tells the browser to select folders, not individual files.
        We use a TypeScript intersection/cast trick here because React's types for webkitdirectory 
        can sometimes be overly strict depending on the environment.
      */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        // @ts-expect-error - React's types occasionally flag webkitdirectory, but it is valid and required
        webkitdirectory="true"
        directory="true"
        multiple
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="rounded-full bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
      >
        Select Manga Folder
      </button>

      <p className="mt-4 max-w-sm text-center text-sm text-gray-400">
        Select a local directory containing your manga panels. Processing
        happens entirely on your device.
      </p>
    </div>
  );
}
