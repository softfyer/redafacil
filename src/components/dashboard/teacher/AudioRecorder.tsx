'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type RecordingStatus = 'inactive' | 'recording' | 'recorded' | 'denied';

type AudioRecorderProps = {
  onRecordingComplete: (audioUrl: string) => void;
};

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [status, setStatus] = useState<RecordingStatus>('inactive');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const getMicrophonePermission = async () => {
    if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
      toast({ title: "Erro", description: "API de mídia não suportada neste navegador.", variant: "destructive"});
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatus('inactive');
      return stream;
    } catch (err) {
      setStatus('denied');
      toast({ title: "Permissão Negada", description: "Acesse as configurações do seu navegador para permitir o uso do microfone.", variant: "destructive"});
    }
  };

  const startRecording = async () => {
    const stream = await getMicrophonePermission();
    if (!stream) return;

    setStatus('recording');
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      onRecordingComplete(url);
      setStatus('recorded');
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };
  
  const resetRecording = () => {
    setAudioUrl(null);
    setStatus('inactive');
    audioChunksRef.current = [];
    mediaRecorderRef.current = null;
    onRecordingComplete('');
  };
  
  const renderButton = () => {
    switch(status) {
      case 'recording':
        return (
          <Button onClick={stopRecording} variant="destructive" className="w-full">
            <Square className="mr-2 h-4 w-4 fill-current" />
            Parar Gravação
          </Button>
        );
      case 'recorded':
        return null; // Don't show a main button, show audio player and reset
      case 'denied':
        return <p className="text-destructive text-sm">Acesso ao microfone negado.</p>;
      case 'inactive':
      default:
        return (
          <Button onClick={startRecording} variant="outline" className="w-full">
            <Mic className="mr-2 h-4 w-4" />
            Gravar Áudio
          </Button>
        );
    }
  }

  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div className="flex items-center justify-center">
        {renderButton()}
      </div>
      {status === 'recorded' && audioUrl && (
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <audio src={audioUrl} controls className="w-full flex-1" />
            <Button onClick={resetRecording} variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Apagar gravação</span>
            </Button>
        </div>
      )}
    </div>
  );
}
