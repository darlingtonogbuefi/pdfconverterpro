// src/components/ConversionProgress.tsx

import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import type { ConversionStatus, ConvertedFile } from '@/types/converter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConversionProgressProps {
  status: ConversionStatus;
  progress: number;
  convertedFiles: ConvertedFile[];
  error?: string;
  onDownload: (file: ConvertedFile) => void;
  onDownloadAll: () => void;
}

export function ConversionProgress({
  status,
  progress,
  convertedFiles,
  error,
  onDownload,
  onDownloadAll,
}: ConversionProgressProps) {
  if (status === 'idle') return null;

  // Map status to display label
  const statusLabelMap: Record<ConversionStatus, string> = {
    uploading: 'Uploading...',
    converting: 'Converting...',
    splitting: 'Splitting PDF...',
    compressing: 'Compressing PDF...',
    complete: '',
    error: '',
    idle: '',
  };

  const isInProgress = ['uploading', 'converting', 'splitting', 'compressing'].includes(status);

  // Generate numbered name for display/download
  const getDisplayName = (file: ConvertedFile, index: number) => {
    if (convertedFiles.length > 1) {
      const originalName = file.name ?? 'converted-file';
      const dotIndex = originalName.lastIndexOf('.');
      const name = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
      const ext = dotIndex !== -1 ? originalName.slice(dotIndex) : '';
      return `${name}_page_${index + 1}${ext}`;
    }
    return file.name ?? 'converted-file';
  };

  // Show only first 10 files in the preview
  const previewFiles = convertedFiles.length > 10 ? convertedFiles.slice(0, 10) : convertedFiles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-4"
    >
      {/* Progress Bar */}
      {isInProgress && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-sm font-medium text-foreground">
                {statusLabelMap[status]}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-primary rounded-full"
            />
          </div>
        </div>
      )}

      {/* Success State */}
      {status === 'complete' && convertedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-secondary/10 border border-secondary/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-secondary" />
            <span className="font-display font-semibold text-foreground">
              Conversion Complete!
            </span>
          </div>

          <div className="space-y-2 mb-4">
            {previewFiles.map((file, index) => (
              <motion.div
                key={file.name + index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between bg-background/50 rounded-xl p-3"
              >
                <span className="text-sm text-foreground truncate flex-1 mr-3">
                  {getDisplayName(file, index)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Pass renamed file for single download if multiple files
                    const fileToDownload =
                      convertedFiles.length > 1
                        ? { ...file, name: getDisplayName(file, index) }
                        : file;
                    onDownload(fileToDownload);
                  }}
                  className="shrink-0"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </motion.div>
            ))}

            {/* Show message if more than 10 files exist */}
            {convertedFiles.length > 10 && (
              <div className="text-sm text-muted-foreground mt-1">
                +{convertedFiles.length - 10} more files not shown
              </div>
            )}
          </div>

          {convertedFiles.length > 1 && (
            <Button
              variant="default"
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
              onClick={onDownloadAll}
            >
              <Download className="w-4 h-4 mr-2" />
              Download All (ZIP)
            </Button>
          )}
        </motion.div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-destructive/10 border border-destructive/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="font-medium text-foreground">Conversion Failed</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {error || 'An unexpected error occurred. Please try again.'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
