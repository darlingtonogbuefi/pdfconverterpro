import { useEffect, useRef } from 'react';  
import { conversionOptions } from '@/lib/conversionOptions';
import { cn } from '@/lib/utils';
import type { ConversionType } from '@/types/converter';

interface ConversionTypePopupProps {
  onConfirmType: (type: ConversionType) => void;
  onClose: () => void;
}

export function ConversionTypePopup({
  onConfirmType,
  onClose,
}: ConversionTypePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when user scrolls
  useEffect(() => {
    const handleScroll = () => onClose();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onClose]);

  // Close popup with Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    // Backdrop: clicking outside closes popup
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      {/* Stop clicks inside popup from closing */}
      <div
        ref={popupRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-[30rem] bg-white pt-2 px-6 pb-2', // container padding
          'rounded-md',
          'border-[3px] border-gray-600',
          'shadow-xl',
          'flex flex-col'
        )}
      >
        {/* Heading closer to top */}
        <h2 className="font-bold text-center text-gray-900">
          Select Conversion Type
        </h2>

        {/* Buttons grid with mt-10 to create 10 units of space below heading */}
        <div className="grid grid-cols-3 gap-3 mt-10 mb-4 flex-grow">
          {conversionOptions
            .filter(option => option.available !== false)
            .map(option => {
              const label = option.label.includes('to')
                ? option.label.replace(/to/gi, '→')
                : option.label;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onConfirmType(option.id as ConversionType)}
                  className={cn(
                    'flex items-center justify-center px-3 py-1.5 w-full whitespace-nowrap text-center text-sm',
                    'rounded-md',
                    'border-[3px] border-gray-300',
                    'font-display font-semibold text-gray-900',
                    'bg-white transition-all duration-300',
                    'hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700',
                    'hover:shadow-[0_0_0_3px_rgba(56,189,248,0.45)]'
                  )}
                >
                  {label}
                </button>
              );
            })}
        </div>

        {/* Cancel button closer to bottom-right and edge */}
        <div className="flex justify-end mt-auto -mr-2">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-700 text-sm font-semibold hover:underline"
          >
            cancel
          </button>
        </div>
      </div>
    </div>
  );
}
