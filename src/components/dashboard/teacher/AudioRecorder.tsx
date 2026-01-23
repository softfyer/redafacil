'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type RecordingStatus = 'inactive' | 'recording' | 'recorded' | 'denied';

type AudioRecorderProps = {
  value: Blob | null;
  onChange: (audioBlob: Blob | null) => void;
  disabled?: boolean;
};

const MAX_RECORDING_TIME_MS = 300000; // 5 minutes

export function AudioRecorder({ value, onChange, disabled }: AudioRecorderProps) {
  const [status, setStatus] = useState<RecordingStatus>('inactive');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // This effect synchronizes the component's state with the `value` prop
    if (value) {
      const url = URL.createObjectURL(value);
      setAudioUrl(url);
      setStatus('recorded');
      // No need to clear timer here, as it should already be cleared on stop
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioUrl(null);
      setStatus('inactive');
      setElapsedTime(0);
    }
  }, [value]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const getMicrophonePermission = async () => {
    if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
      toast({ title: "Erro", description: "API de mídia não suportada neste navegador.", variant: "destructive"});
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if(status !== 'recorded') setStatus('inactive'); // Don't change status if already recorded
      return stream;
    } catch (err) {
      setStatus('denied');
      toast({ title: "Permissão Negada", description: "Acesse as configurações do seu navegador para permitir o uso do microfone.", variant: "destructive"});
    }
  };

  const startRecording = async () => {
    const stream = await getMicrophonePermission();
    if (!stream) return;
    
    // If there is a previous recording, reset it before starting a new one
    if (value) {
        onChange(null);
    }

    setStatus('recording');
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    // Start timer
    setElapsedTime(0);
    timerIntervalRef.current = setInterval(() => {
        setElapsedTime(prev => {
            const newTime = prev + 1;
            if (newTime * 1000 >= MAX_RECORDING_TIME_MS) {
                stopRecording();
            }
            return newTime;
        });
    }, 1000);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onChange(audioBlob); // Pass the new blob up to the parent
      
      // Stop all media tracks to turn off the recording indicator
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };
  
  const resetRecording = () => {
    onChange(null);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-background">
        <div className="flex items-center justify-center w-full">
            {status === 'inactive' && (
                <Button onClick={startRecording} variant="outline" className="w-full" disabled={disabled}>
                    <Mic className="mr-2 h-4 w-4" />
                    Gravar Áudio (Limite de 5 min)
                </Button>
            )}

            {status === 'recording' && (
                <div className="w-full flex flex-col items-center gap-2">
                    <Button onClick={stopRecording} variant="destructive" className="w-full" disabled={disabled}>
                        <Square className="mr-2 h-4 w-4 fill-current" />
                        Parar Gravação
                    </Button>
                    <div className="flex items-center text-sm font-mono text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4 animate-pulse" />
                        <span>{formatTime(elapsedTime)} / 05:00</span>
                    </div>
                </div>
            )}

            {status === 'denied' && <p className="text-destructive text-sm">Acesso ao microfone negado.</p>}

            {status === 'recorded' && audioUrl && (
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                    <audio src={audioUrl} controls className="flex-1 w-full" />
                    <Button onClick={resetRecording} variant="ghost" size="icon" disabled={disabled}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Apagar gravação</span>
                    </Button>
                </div>
            )}
        </div>
    </div>
  );
}
