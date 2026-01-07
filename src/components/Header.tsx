// src\components\Header.tsx

import { motion } from 'framer-motion';
import { FileType, Sparkles } from 'lucide-react';

export function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full py-6 px-4"
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary rounded-xl blur-lg opacity-50" />
            <div className="relative bg-gradient-primary p-2.5 rounded-xl">
              <FileType className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">ConvertFlow</h1>
            <p className="text-xs text-muted-foreground">File Converter</p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
          <Sparkles className="w-4 h-4 text-secondary" />
          <span className="text-sm text-muted-foreground">Fast & Secure</span>
        </div>
      </div>
    </motion.header>
  );
}
