// src/pages/Index.tsx

import { useState } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { ConverterSection } from '@/components/ConverterSection';
import { conversionOptions } from '@/lib/conversionOptions';
import type { ConversionType, ConversionStatus, ConvertedFile } from '@/types/converter';
import { convertWithBackend, ConversionEndpoint, uploadFile } from '@/lib/backendApi';

export default function Index() {
  const defaultType: ConversionType = 'pdf-watermark';

  const [selectedType, setSelectedType] = useState<ConversionType | null>(null);
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showTypePopup, setShowTypePopup] = useState(false);

  const selectedOption = selectedType
    ? conversionOptions.find(o => o.id === selectedType)!
    : { inputFormats: [] };

  // Called when files are selected
  const handleFilesSelected = async (
    files: File[],
    setProgress?: (p: number) => void,
    setStatus?: (s: ConversionStatus) => void,
    outputOption?: string // <-- new: pdf-to-image format
  ): Promise<ConvertedFile[]> => {
    if (!files.length) return [];

    if (!selectedType) {
      setPendingFiles(files);
      setShowTypePopup(true);
      return [];
    }

    return handleConvert(files, setProgress, setStatus, outputOption);
  };

  const handleConvert = async (
    files: File[],
    setProgress?: (p: number) => void,
    setStatus?: (s: ConversionStatus) => void,
    outputOption?: string // <-- new: pdf-to-image format
  ): Promise<ConvertedFile[]> => {
    if (!files.length || !selectedType) return [];

    setStatus?.('converting');
    setProgress?.(0);

    try {
      /**
       * ✅ SPECIAL CASE: PDF EDIT
       * This is NOT a conversion, it's an editor workflow
       */
      if (selectedType === 'pdf-edit') {
        const response = await uploadFile('/pdf-edit/extract', files[0]);

        // At this point you would open your editor UI
        console.log('PDF Edit extracted pages:', response.pages);

        setStatus?.('idle');
        return [];
      }

      /**
       * ✅ NORMAL CONVERSIONS
       */
      const endpointMap: { [K in ConversionType]?: ConversionEndpoint } = {
        'image-to-pdf': 'imagesToPdf',
        'pdf-to-image': 'pdfToImages',
        'pdf-to-word': 'pdfToWord',
        'pdf-to-excel': 'pdfToExcel',
        'image-to-word': 'imageToWord',
        'image-to-excel': 'imageToExcel',
        'word-to-excel': 'wordToExcel',
        'pdf-to-powerpoint': 'pdfToPpt',
        'pdf-split': 'pdfSplit',
        'pdf-merge': 'pdfMerge',
        'pdf-compress': 'pdfCompress',
        'pdf-watermark': 'pdfWatermark',
        'pdf-rotate': 'pdfRotate',
        'pdf-sign': 'pdfSign',
        'pdf-stamp': 'pdfStamp',
      };

      const endpoint = endpointMap[selectedType];
      if (!endpoint) throw new Error('Unsupported conversion type');

      // Pass pdf-to-image format to backend if applicable
      const rawResult = await convertWithBackend(
        files,
        endpoint,
        outputOption ? { format: outputOption.toLowerCase() } : {}, // <-- key change
        setProgress
      );

      const result = Array.isArray(rawResult) ? rawResult : [rawResult];
      setConvertedFiles(result);
      return result;
    } catch (err: any) {
      alert(err.message || 'Conversion failed');
      return [];
    } finally {
      setStatus?.('idle');
      setProgress?.(0);
    }
  };

  // Confirm conversion type
  const handleConfirmType = (type: ConversionType) => {
    setSelectedType(type);
    setShowTypePopup(false);

    if (pendingFiles.length) {
      handleConvert(pendingFiles);
      setPendingFiles([]);
    }
  };

  const handleClosePopup = () => {
    setShowTypePopup(false);
    setPendingFiles([]);
    if (!selectedType) setSelectedType(defaultType);
  };

  const handleSelectType = (type: ConversionType) => {
    setSelectedType(prev => (prev === type ? null : type));
  };

  return (
    <>
      <HeroSection
        acceptedFormats={selectedOption.inputFormats}
        disabled={status === 'converting'}
        selectedType={selectedType ?? undefined}
        onConvert={handleFilesSelected}
        onReset={handleClosePopup}
        onOpenPopup={() => setShowTypePopup(true)}
      />

      <ConverterSection
        selectedType={selectedType ?? undefined}
        onSelectType={handleSelectType}
        onConfirmType={handleConfirmType}
        showTypePopup={showTypePopup}
        status={status}
        progress={progress}
        convertedFiles={convertedFiles}
        onReset={handleClosePopup}
      />
    </>
  );
}
