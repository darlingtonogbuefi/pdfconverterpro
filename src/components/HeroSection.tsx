// src/components/HeroSection.tsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileImage, ArrowRight } from 'lucide-react';
import { FileDropzone } from './FileDropzone';
import { Button } from '@/components/ui/button';
import type { ConversionType, ConvertedFile, ConversionStatus } from '@/types/converter';
import { conversionOptions } from '@/lib/conversionOptions';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ConversionProgress } from './ConversionProgress';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface HeroSectionProps {
  acceptedFormats?: string[];
  disabled?: boolean;
  selectedType?: ConversionType;
  onConvert?: (
    files: File[],
    setProgress?: (p: number) => void,
    setStatus?: (s: ConversionStatus) => void,
    outputOption?: string
  ) => Promise<ConvertedFile[]>;
  onReset?: () => void;
  onOpenPopup?: () => void;
}

export function HeroSection({
  acceptedFormats,
  disabled = false,
  selectedType,
  onConvert,
  onReset,
  onOpenPopup,
}: HeroSectionProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [pdfImageOption, setPdfImageOption] = useState('JPG'); // PDF-to-image dropdown
  const navigate = useNavigate();

  const hasFiles = selectedFiles.length > 0;

  useEffect(() => {
    if (selectedFiles.length > 0) setConvertedFiles([]);
  }, [selectedFiles]);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    setConvertedFiles([]);

    if (!selectedType && files.length > 0) {
      onOpenPopup?.();
    }
  };

  const handleRemoveFile = (index: number) =>
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));

  const handleReset = () => {
    setSelectedFiles([]);
    setConvertedFiles([]);
    setStatus('idle');
    setProgress(0);
    onReset?.();
    toast.success('Conversion reset');
  };

  const handleConvert = async () => {
    if (!hasFiles || !selectedType) return;

    const option = conversionOptions.find(o => o.id === selectedType);

    // Popup / upload-based tools
    if (option?.usePopup) {
      const file = selectedFiles[0];

      if (selectedType === 'pdf-sign')
        navigate('/pdfsign', { state: { file } });
      else if (selectedType === 'pdf-watermark')
        navigate('/pdfwatermark', { state: { file } });
      else if (selectedType === 'pdf-stamp')
        navigate('/pdfstamper', { state: { file } });
      else if (selectedType === 'pdf-edit')
        navigate('/pdfedit', { state: { file } });

      return;
    }

    setStatus(
      selectedType === 'pdf-split'
        ? 'splitting'
        : selectedType === 'pdf-compress'
        ? 'compressing'
        : 'converting'
    );
    setProgress(0);

    try {
      let result: ConvertedFile[] = [];
      if (onConvert) {
        const outputOption = selectedType === 'pdf-to-image' ? pdfImageOption : undefined;
        result = await onConvert(selectedFiles, setProgress, setStatus, outputOption);
      }
      setConvertedFiles(result);
      setSelectedFiles([]);
      setStatus('complete');
    } catch (error: any) {
      setStatus('error');
      alert(error.message || 'Conversion failed');
    }
  };

  const getButtonText = () => {
    if (!selectedType) return 'Convert';

    switch (selectedType) {
      case 'pdf-watermark':
        return 'Upload to Watermark';
      case 'pdf-sign':
        return 'Upload to Sign';
      case 'pdf-stamp':
        return 'Upload to Stamp';
      case 'pdf-edit':
        return 'Upload to Edit';
      case 'pdf-compress':
        return 'Compress PDF';
      case 'pdf-merge':
        return 'Merge PDFs';
      case 'pdf-rotate':
        return 'Rotate PDF';
      case 'pdf-split':
        return 'Split PDF';
      default:
        return `Convert ${selectedType.replace(/-/g, ' ')}`;
    }
  };

  // PDF to Image Dropdown
  const renderPdfImageDropdown = () => {
    if (selectedType !== 'pdf-to-image') return null;
    return (
      <div className="flex justify-center mb-3 mt-2">
        <select
          className="border border-gray-300 rounded px-3 py-1 text-gray-900"
          value={pdfImageOption}
          onChange={e => setPdfImageOption(e.target.value)}
        >
          <option value="JPG">JPG</option>
          <option value="PNG">PNG</option>
        </select>
      </div>
    );
  };

  // Download a single file
  const handleDownload = (file: ConvertedFile) => {
    if (file.blob) {
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name ?? 'converted-file';
      link.click();
      URL.revokeObjectURL(url);
    } else if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name ?? 'converted-file';
      link.click();
    }
  };

  // Download all files as ZIP with page numbering: page_1, page_2, ...
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

        // Extract name and extension
        const originalName = file.name ?? 'converted-file';
        const dotIndex = originalName.lastIndexOf('.');
        const name = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
        const ext = dotIndex !== -1 ? originalName.slice(dotIndex) : '';
        const numberedName = `${name}_page_${idx + 1}${ext}`; // <-- updated

        zip.file(numberedName, blob);
      })
    );

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'converted-files.zip');
  };

  return (
    <section
      id="hero-section"
      className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 py-8 text-white"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="inline-flex bg-white/20 rounded-xl p-3 mb-3">
            <FileImage className="w-7 h-7" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-2">PDF ConvertPro</h1>

          <p className="text-blue-100 mb-4 max-w-2xl mx-auto">
            Nkechi Please Select a file to edit or convert between supported formats. No signup required.
          </p>

          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-4 max-w-6xl mx-auto">
            <FileDropzone
              acceptedFormats={acceptedFormats}
              selectedFiles={selectedFiles}
              onFilesSelected={handleFilesSelected}
              onRemoveFile={handleRemoveFile}
              maxFiles={10}
            />

            {/* PDF to Image Dropdown */}
            {renderPdfImageDropdown()}

            {/* Conversion progress and download handled in ConversionProgress */}
            <ConversionProgress
              status={status}
              progress={progress}
              convertedFiles={convertedFiles}
              onDownload={handleDownload}
              onDownloadAll={handleDownloadAll}
            />

            <Button
              onClick={handleConvert}
              disabled={
                disabled ||
                !hasFiles ||
                status === 'converting' ||
                status === 'splitting' ||
                status === 'compressing' ||
                status === 'uploading'
              }
              className="w-full mt-3"
            >
              {getButtonText()}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            {convertedFiles.length > 0 && (
              <div className="flex flex-col mt-4 gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
