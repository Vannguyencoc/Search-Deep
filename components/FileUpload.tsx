
import React, { useState, useCallback, useRef } from 'react';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFileName(file ? file.name : '');
    onFileChange(file);
  }, [onFileChange]);
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] || null;
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
        setFileName(file.name);
        onFileChange(file);
        if (fileInputRef.current) {
            fileInputRef.current.files = event.dataTransfer.files;
        }
    }
  }, [onFileChange]);

  return (
    <div>
      <label 
        htmlFor="file-upload" 
        className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 flex flex-col items-center justify-center transition-colors duration-300"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span className="mt-2 block text-sm text-gray-900 dark:text-gray-100">
            <span className="font-semibold">Click to upload</span> or drag and drop
        </span>
        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP, PDF up to 10MB</p>
        <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            ref={fileInputRef}
        />
      </label>
      {fileName && (
        <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Selected file:</span> {fileName}
        </div>
      )}
    </div>
  );
};
