// app/components/FileUploader.tsx
'use client';

import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Loader2 } from 'lucide-react';

interface FileUploaderProps {
  onFileProcessed: (result: any) => void;
}

export default function FileUploader({ onFileProcessed }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file is a PDF
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        onFileProcessed(result);
      } else {
        setError(result.error || 'Failed to process file');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-6">
      <Button 
        onClick={() => document.getElementById('file-upload')?.click()}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Upload PDF
      </Button>
      <input
        id="file-upload"
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      
      {isUploading && (
        <span className="ml-4 inline-flex items-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing file...
        </span>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}