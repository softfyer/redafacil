'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Eraser, ZoomIn, ZoomOut, Redo2, Pen } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  size: number;
}

interface AnnotationCanvasProps {
  imageUrl: string;
  essayId: string;
  onSave: (blob: Blob) => void;
  originalMimeType: 'image/jpeg' | 'image/png';
}

export function AnnotationCanvas({ imageUrl, essayId, onSave, originalMimeType }: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#FF0000'); // Default to red
  const [brushSize, setBrushSize] = useState(3);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  const colors = ['#FF0000', '#0000FF', '#000000', '#FFFF00', '#00FF00'];
  const storageKey = `annotations_${essayId}`;


  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    
    return {
      x: canvasX,
      y: canvasY,
    };
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !originalImageRef.current) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImageRef.current, 0, 0, canvas.width, canvas.height);

    strokes.forEach(stroke => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (stroke.points.length > 0) {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      }
    });
  }, [strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = new Image();
    image.crossOrigin = "anonymous";
    
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    image.src = proxyUrl;
    
    image.onload = () => {
      originalImageRef.current = image;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      
      try {
        const savedStrokes = localStorage.getItem(storageKey);
        if (savedStrokes) {
          const parsedStrokes = JSON.parse(savedStrokes);
          setStrokes(parsedStrokes);
        } else {
            setStrokes([]);
        }
      } catch (error) {
        console.error("Failed to parse strokes from localStorage", error);
        setStrokes([]);
      }
    };
    image.onerror = (e) => {
        console.error("Failed to load image for canvas via proxy.", e);
    }
  }, [imageUrl, essayId, storageKey]);

  useEffect(() => {
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode) return;
    setIsDrawing(true);
    const { x, y } = getCoordinates(event);
    currentPathRef.current = [{ x, y }];

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawingMode) return;
    const { x, y } = getCoordinates(event);
    currentPathRef.current.push({ x, y });

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !isDrawingMode) return;
    setIsDrawing(false);
    
    const newStroke: Stroke = {
        points: currentPathRef.current,
        color: brushColor,
        size: brushSize,
    };
    
    const updatedStrokes = [...strokes, newStroke];
    setStrokes(updatedStrokes);
    
    try {
        localStorage.setItem(storageKey, JSON.stringify(updatedStrokes));
    } catch (error) {
        console.error("Failed to save strokes to localStorage", error);
    }

    currentPathRef.current = [];
  };

  const handleClearAnnotations = () => {
    setStrokes([]);
    try {
        localStorage.removeItem(storageKey);
    } catch (error) {
        console.error("Failed to remove strokes from localStorage", error);
    }
  }

  const handleSave = () => {
    redrawCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
        if (blob) {
            onSave(blob);
        }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="flex flex-col gap-4 items-center w-full h-full">
      <div className="flex flex-wrap gap-2 items-center p-2 border rounded-md bg-card">
        <Button
            variant={isDrawingMode ? 'default' : 'outline'}
            size="icon"
            onClick={() => setIsDrawingMode((prev) => !prev)}
            title="Ativar/Desativar modo de anotação"
        >
            <Pen className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <Label>Cor:</Label>
        <div className="flex gap-1">
            {colors.map(color => (
                <button 
                    key={color}
                    onClick={() => setBrushColor(color)}
                    className={`w-6 h-6 rounded-full border-2 ${brushColor === color ? 'border-ring' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                />
            ))}
        </div>
        <Separator orientation="vertical" className="h-6 mx-2"/>
        <div className="flex items-center gap-2">
            <Label htmlFor="brush-size">Tamanho:</Label>
            <Slider
                id="brush-size"
                min={1}
                max={20}
                step={1}
                value={[brushSize]}
                onValueChange={(value) => setBrushSize(value[0])}
                className="w-24"
            />
        </div>
        <Separator orientation="vertical" className="h-6 mx-2"/>
        <div className="flex items-center gap-2">
            <Label>Zoom:</Label>
            <Button variant="outline" size="icon" onClick={() => setZoomLevel(z => Math.max(0.2, z - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => setZoomLevel(z => Math.min(3, z + 0.1))}><ZoomIn className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => setZoomLevel(1)}><Redo2 className="w-4 h-4" /> <span className="sr-only">Reset Zoom</span></Button>
            <span className="text-sm font-mono w-12 text-center">{(zoomLevel * 100).toFixed(0)}%</span>
        </div>
        <Separator orientation="vertical" className="h-6 mx-2"/>
        <Button variant="outline" size="icon" onClick={handleClearAnnotations}>
          <Eraser className="w-4 h-4" />
          <span className="sr-only">Limpar anotações</span>
        </Button>
      </div>

      <div className="w-full flex-1 overflow-auto border bg-muted">
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className={cn(
                "origin-top-left",
                isDrawingMode ? "cursor-crosshair" : "cursor-grab"
            )}
            style={{ 
                touchAction: isDrawingMode ? 'none' : 'auto',
                transform: `scale(${zoomLevel})`,
            }} 
        />
      </div>
       <Button onClick={handleSave}>Salvar Anotações</Button>
    </div>
  );
}
