//        src/components/ConverterSection.tsx

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { conversionOptions } from '@/lib/conversionOptions';
import { ConversionCard } from './ConversionCard';
import ConversionHistory from './ConversionHistory';
import { ConversionTypePopup } from './ConversionTypePopup';
import type { ConversionType, ConversionStatus, ConvertedFile } from '@/types/converter';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ConversionHistoryItem {
  id: string;
  status: 'completed' | 'failed';
  original_filename: string;
  file: ConvertedFile;
  source_format: string;
  target_format: string;
  created_date: string;
}

interface ConverterSectionProps {
  selectedType?: ConversionType;
  onSelectType: (type: ConversionType) => void;
  onConfirmType: (type: ConversionType) => void;
  showTypePopup: boolean;
  status: ConversionStatus;
  progress: number;
  convertedFiles: ConvertedFile[];
  onReset?: () => void;
}

export function ConverterSection({
  selectedType,
  onSelectType,
  onConfirmType,
  showTypePopup,
  status,
  progress,
  convertedFiles,
  onReset,
}: ConverterSectionProps) {
  const [activeTab, setActiveTab] = useState<'convert' | 'history'>('convert');
  const [conversionHistory, setConversionHistory] = useState<ConversionHistoryItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('conversionHistory');
    if (stored) setConversionHistory(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (!selectedType || convertedFiles.length === 0) return;

    const mappedHistory: ConversionHistoryItem[] = convertedFiles.map((file, index) => {
      const parts = selectedType.split('-');
      const source_format = parts[0]?.toUpperCase() ?? 'UNKNOWN';
      const target_format = parts.at(-1)?.toUpperCase() ?? 'UNKNOWN';

      return {
        id: `${Date.now()}-${index}`,
        status: 'completed',
        original_filename: file.name ?? `converted.${target_format.toLowerCase()}`,
        file,
        source_format,
        target_format,
        created_date: new Date().toISOString(),
      };
    });

    setConversionHistory(prev => {
      const updated = [...mappedHistory, ...prev];
      localStorage.setItem('conversionHistory', JSON.stringify(updated));
      return updated;
    });
  }, [convertedFiles, selectedType]);

  const handleDownload = (file: ConvertedFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name ?? 'converted-file';
    link.click();
  };

  // Download all as ZIP with page_1, page_2 etc.
  const handleDownloadAll = async () => {
    if (convertedFiles.length === 1) {
      handleDownload(convertedFiles[0]);
      return;
    }

    const zip = new JSZip();

    await Promise.all(
      convertedFiles.map(async (file, idx) => {
        let blob: Blob;
        if (file.blob) blob = file.blob;
        else if (file.url) blob = await fetch(file.url).then(r => r.blob());
        else return;

        // Extract original name and extension
        const originalName = file.name ?? 'converted-file';
        const dotIndex = originalName.lastIndexOf('.');
        const name = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
        const ext = dotIndex !== -1 ? originalName.slice(dotIndex) : '';
        const numberedName = `${name}_page_${idx + 1}${ext}`;

        zip.file(numberedName, blob);
      })
    );

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'converted-files.zip');
  };

  const handleClearHistory = () => {
    setConversionHistory([]);
    localStorage.removeItem('conversionHistory');
    toast('Conversion history cleared');
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      {/* Tabs */}
      <div className="max-w-md mx-auto bg-gray-200 rounded-md p-1 mb-3">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setActiveTab('convert')}
            className={`text-sm font-semibold rounded-md transition-colors ${
              activeTab === 'convert' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
            style={{ height: 34 }}
          >
            Convert File
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`text-sm font-semibold rounded-md transition-colors ${
              activeTab === 'history' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
            style={{ height: 34 }}
          >
            History
          </button>
        </div>
      </div>

      {activeTab === 'convert' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-12 mb-6">
            {conversionOptions.map(option => (
              <ConversionCard
                key={option.id}
                option={option}
                index={0}
                isSelected={selectedType === option.id}
                onClick={() => onSelectType(option.id)}
                selectedType={selectedType}
              />
            ))}
          </div>

          {showTypePopup && (
            <ConversionTypePopup
              onConfirmType={onConfirmType}
              onClose={onReset}
            />
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="mt-12">
          <ConversionHistory
            conversions={conversionHistory}
            isLoading={status === 'converting'}
            onDownload={handleDownload}
            onClearHistory={handleClearHistory}
          />
        </div>
      )}
    </section>
  );
}
