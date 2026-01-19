'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Image from 'next/image';

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | undefined;
  title: string;
}

const isImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    // A more robust check for URLs with query parameters
    try {
        const path = new URL(url).pathname;
        return /\.(jpeg|jpg|png)$/i.test(path);
    } catch (e) {
        return false; // Invalid URL
    }
};

export function FileViewerModal({ isOpen, onClose, fileUrl, title }: FileViewerModalProps) {
  if (!isOpen || !fileUrl) {
    return null;
  }

  const isImage = isImageUrl(fileUrl);
  
  // Use a proxy to avoid exposing Firebase tokens. This proxy should handle any content type.
  const safeUrl = `/api/image-proxy?url=${encodeURIComponent(fileUrl)}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Visualizando: {title}</DialogTitle>
          <DialogDescription>
            Visualização do arquivo corrigido. Feche para voltar à edição.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 rounded-md overflow-hidden border bg-muted">
          {isImage ? (
            <div className="relative w-full h-full">
               <Image
                  src={safeUrl}
                  alt={`Visualização de ${title}`}
                  fill
                  style={{ objectFit: 'contain' }}
                />
            </div>
          ) : (
            // For PDFs and other embeddable types.
            // Note: Some browsers might block embedding of cross-origin PDFs if headers aren't set correctly by the proxy.
            <iframe src={safeUrl} className="w-full h-full" title={title} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
