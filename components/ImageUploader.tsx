import React, { useCallback, useState, useRef } from 'react';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_MB } from '../constants';

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert("Unsupported file type. Please use PNG, JPG, or WEBP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      onImageSelect(base64);
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    event.target.value = '';
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`w-full h-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl transition-all cursor-pointer group
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10' 
          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
        }`}
    >
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-transform duration-300 ${isDragging ? 'scale-110 bg-blue-500/20' : 'bg-blue-500/10 group-hover:scale-110'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-blue-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {isDragging ? 'Drop it here!' : 'Click or drop a photo'}
      </h3>
      <p className="text-sm text-slate-400 text-center max-w-xs mb-8">
        AI-powered editing works best with clear, high-quality portraits.
      </p>
      <span className="px-8 py-3 rounded-xl bg-blue-600 group-hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/25">
        Choose File
      </span>
      <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={handleFileChange}
      />
    </div>
  );
};