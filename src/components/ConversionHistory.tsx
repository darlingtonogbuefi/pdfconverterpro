// src/components/ConversionHistory.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Completed' },
  processing: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Processing' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Failed' },
  pending: { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Pending' },
};

interface Conversion {
  id: string;
  status: 'completed' | 'processing' | 'failed' | 'pending';
  original_filename: string;
  file?: {
    url: string;
    name?: string;
  };
  source_format?: string;
  target_format?: string;
  created_date: string;
}

interface ConversionHistoryProps {
  conversions: Conversion[];
  isLoading: boolean;
  onDownload?: (file: { url: string; name?: string }) => void;
  onClearHistory?: () => void; // ✅ new prop for clearing history
}

export default function ConversionHistory({
  conversions,
  isLoading,
  onDownload,
  onClearHistory,
}: ConversionHistoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!conversions || conversions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No conversions yet</p>
            <p className="text-sm text-gray-400 mt-1">Your conversion history will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Recent Conversions</CardTitle>
        {conversions.length > 0 && onClearHistory && (
          <span
            onClick={onClearHistory}
            className="text-sm text-red-500 cursor-pointer hover:underline"
          >
            Clear History
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {conversions.map((conversion) => {
            const status = statusConfig[conversion.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <div
                key={conversion.id}
                className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('p-2 rounded-lg', status.bg)}>
                    <StatusIcon className={cn('w-4 h-4', status.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {conversion.original_filename}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {conversion.source_format?.toUpperCase()}
                      </Badge>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <Badge variant="outline" className="text-xs">
                        {conversion.target_format?.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {format(new Date(conversion.created_date), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>
                {conversion.status === 'completed' && conversion.file && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => onDownload?.(conversion.file)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
