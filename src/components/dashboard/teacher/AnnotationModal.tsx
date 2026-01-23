'use client';

import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnnotationCanvas, type AnnotationCanvasActions } from './AnnotationCanvas';

interface AnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  essayId: string;
  onSave: (blob: Blob) => void;
  originalMimeType: 'image/jpeg' | 'image/png';
}

export function AnnotationModal({ isOpen, onClose, imageUrl, essayId, onSave, originalMimeType }: AnnotationModalProps) {
  const canvasRef = useRef<AnnotationCanvasActions>(null);

  const handleSaveClick = () => {
    canvasRef.current?.handleSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-h-[95vh] flex flex-col p-2 md:max-w-full lg:max-w-4xl sm:p-4">
        <DialogHeader className="flex-shrink-0 p-0 sm:p-2">
          <DialogTitle>Anotar na Redação</DialogTitle>
          <DialogDescription className="hidden lg:block">
            Use as ferramentas para desenhar e aplicar zoom. Suas anotações são salvas localmente. Clique em Salvar Anotações para gerar a imagem final.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
          <AnnotationCanvas 
            ref={canvasRef}
            imageUrl={imageUrl} 
            essayId={essayId} 
            onSave={onSave} 
            originalMimeType={originalMimeType} 
          />
        </div>

        <DialogFooter className="flex-shrink-0 pt-2 flex-row justify-end gap-2">
          <Button onClick={handleSaveClick} size="sm">Salvar Anotações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
