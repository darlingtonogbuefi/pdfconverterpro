// src/components/ConversionCard.tsx

import { motion } from 'framer-motion';
import { FileImage, FileText, FileSpreadsheet, RotateCw, ArrowRight } from 'lucide-react';
import type { ConversionOption } from '@/lib/conversionOptions';
import { cn } from '@/lib/utils';

interface ConversionCardProps {
  option: ConversionOption;
  selectedType?: string;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  image: FileImage,
  pdf: FileText,
  word: FileText,
  excel: FileSpreadsheet,
  'pdf-rotate': RotateCw,
};

export function ConversionCard({
  option,
  isSelected,
  onClick,
  index,
  selectedType,
}: ConversionCardProps) {
  const Icon = iconMap[option.id] || FileText;

  const getOutputLabel = (output: string | { label: string; angle?: number }) => {
    if (typeof output === 'string') return output;
    return output.label;
  };

  const selected = isSelected || selectedType === option.id;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={(e) => {
        e.stopPropagation(); // ✅ prevent outside-click handler
        onClick();
      }}
      className={cn(
        // ✅ conversion-card class is critical
        "conversion-card relative w-full p-5 rounded-2xl text-left transition-all duration-300 border-2 group",
        selected
          ? "border-primary bg-primary/5 shadow-elevated"
          : "border-border bg-card hover:border-primary/30 hover:shadow-soft",
        option.available === false && "opacity-50 cursor-not-allowed"
      )}
      disabled={option.available === false}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "p-3 rounded-xl transition-all duration-300",
            selected
              ? "bg-gradient-primary text-primary-foreground"
              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-foreground truncate">
              {option.label}
            </h3>
            {selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 rounded-full bg-primary"
              />
            )}
          </div>

          {option.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {option.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {option.inputFormats.join(', ')}
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
              {option.outputOptions?.length
                ? getOutputLabel(option.outputOptions[0])
                : option.outputFormat}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
