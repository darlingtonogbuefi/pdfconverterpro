// src/components/FileDropzone.tsx

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileDropzoneProps {
  acceptedFormats?: string[];
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  maxFiles?: number;
}

export function FileDropzone({
  acceptedFormats,
  onFilesSelected,
  selectedFiles,
  onRemoveFile,
  maxFiles = 10,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const normalizedFormats = (acceptedFormats ?? []).map(f =>
    f.startsWith('.') ? f.toLowerCase() : `.${f.toLowerCase()}`
  );

  const isValidFile = (file: File) => {
    if (!normalizedFormats.length) return true;
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    return normalizedFormats.includes(ext);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files)
        .filter(isValidFile)
        .slice(0, maxFiles);

      if (files.length) onFilesSelected(files);
    },
    [maxFiles, onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
        .filter(isValidFile)
        .slice(0, maxFiles);

      if (files.length) onFilesSelected(files);
      e.target.value = '';
    },
    [maxFiles, onFilesSelected]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div 
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-2 transition-all cursor-pointer',
          'flex flex-col items-center justify-center text-center min-h-[100px]',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary hover:bg-muted/40'
        )}
      >
        <input
          type="file"
          accept={normalizedFormats.join(',')}
          onChange={handleFileInput}
          multiple={maxFiles > 1}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        <div className="p-4 bg-muted rounded-2xl mb-4">
          <Upload className="w-8 h-8 text-muted-foreground" />
        </div>

        <h3 className="font-semibold mb-2">
          {isDragging ? 'Drop files here' : 'Drag & drop files'}
        </h3>

        <p className="text-sm text-muted-foreground mb-3">
          or click to <span className="text-primary font-bold">browse</span>
        </p>

        <div className="flex gap-2 flex-wrap justify-center">
          {normalizedFormats.map(format => (
            <span key={format} className="text-xs bg-muted px-2 py-1 rounded-md">
              {format.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <p className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              {selectedFiles.length} file selected
            </p>

            {selectedFiles.map((file, index) => (
              <div
                key={file.name}
                className="flex justify-between items-center bg-muted/50 rounded-xl p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileIcon className="w-4 h-4 text-primary" />
                  <div className="truncate">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemoveFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
