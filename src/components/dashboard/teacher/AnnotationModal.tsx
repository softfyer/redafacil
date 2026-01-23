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
import { AudioRecorder } from './AudioRecorder';
import { Label } from '@/components/ui/label';

interface AnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  essayId: string;
  onSave: (blob: Blob) => void;
  originalMimeType: 'image/jpeg' | 'image/png';
  audioBlob: Blob | null;
  onAudioChange: (blob: Blob | null) => void;
}

export function AnnotationModal({ 
    isOpen, 
    onClose, 
    imageUrl, 
    essayId, 
    onSave, 
    originalMimeType,
    audioBlob,
    onAudioChange
}: AnnotationModalProps) {
  const canvasRef = useRef<AnnotationCanvasActions>(null);

  const handleSaveClick = () => {
    canvasRef.current?.handleSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-h-[95vh] flex flex-col p-2 md:max-w-full lg:max-w-4xl sm:p-4">
        <DialogHeader className="flex-shrink-0 px-4 pt-4 sm:px-2 sm:pt-2">
          <DialogTitle>Anotar na Redação</DialogTitle>
          <DialogDescription className="hidden lg:block">
            Use as ferramentas para desenhar e aplicar zoom. Suas anotações são salvas localmente. Clique em Salvar Anotações para gerar a imagem final.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 px-4 pb-4 sm:px-2 sm:pb-2">
          <AnnotationCanvas 
            ref={canvasRef}
            imageUrl={imageUrl} 
            essayId={essayId} 
            onSave={onSave} 
            originalMimeType={originalMimeType} 
          />
        </div>

        <div className="flex-shrink-0 px-4 pb-4 sm:px-2 sm:pb-2">
            <Label className="text-sm font-medium text-muted-foreground">Feedback por Áudio (Opcional)</Label>
            <AudioRecorder value={audioBlob} onChange={onAudioChange} />
        </div>

        <DialogFooter className="flex-shrink-0 pt-2 flex-row justify-end gap-2 px-4 pb-4 sm:px-2 sm:pb-2">
          <Button onClick={handleSaveClick} size="sm">Salvar Anotações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
