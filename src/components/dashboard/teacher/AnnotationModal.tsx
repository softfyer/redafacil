'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnnotationCanvas } from './AnnotationCanvas';

interface AnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (blob: Blob) => void;
}

export function AnnotationModal({ isOpen, onClose, imageUrl, onSave }: AnnotationModalProps) {

  // We need a way to pass the save action from the canvas up to the modal's parent.
  // We'll pass the `onSave` prop directly to the canvas.
  // The canvas component itself will have the "Save" button.

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Anotar na Redação</DialogTitle>
          <DialogDescription>
            Use as ferramentas para desenhar diretamente na imagem. Suas anotações serão salvas como uma nova imagem.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-0 m-0">
          <AnnotationCanvas imageUrl={imageUrl} onSave={onSave} />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
