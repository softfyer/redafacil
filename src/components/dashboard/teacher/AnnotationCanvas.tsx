'use client';

import React, { useRef, useEffect, useState, useCallback, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Redo2, Pen, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Stroke interface without mode
interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  size: number;
}

export interface AnnotationCanvasActions {
    handleSave: () => void;
}

interface AnnotationCanvasProps {
  imageUrl: string;
  essayId: string;
  onSave: (blob: Blob) => void;
  originalMimeType: 'image/jpeg' | 'image/png';
}

const AnnotationCanvas = React.forwardRef<AnnotationCanvasActions, AnnotationCanvasProps>(
    ({ imageUrl, essayId, onSave, originalMimeType }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  // Use a boolean for pen activation
  const [isPenActive, setIsPenActive] = useState(false);
  const [brushColor, setBrushColor] = useState('#FF0000'); // Default to red
  const [brushSize, setBrushSize] = useState(3);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  // Set initial zoom to 0.5 (50%)
  const [zoomLevel, setZoomLevel] = useState(0.5);
  const [imageSize, setImageSize] = useState({width: 0, height: 0});

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

  // Simplified redrawCanvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !originalImageRef.current) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImageRef.current, 0, 0, canvas.width, canvas.height);

    // No need to check for eraser mode
    ctx.globalCompositeOperation = 'source-over';
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
      setImageSize({width: image.naturalWidth, height: image.naturalHeight});
      
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

  // Simplified startDrawing
  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(event);
    currentPathRef.current = [{ x, y }];

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(event);
    currentPathRef.current.push({ x, y });

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Simplified stopDrawing
  const stopDrawing = () => {
    if (!isDrawing) return;
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

  useImperativeHandle(ref, () => ({
    handleSave,
  }));

  const isDrawingMode = isPenActive;
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

  return (
    <div className="flex flex-col gap-2 items-center w-full h-full">
      <div className="flex flex-wrap gap-x-2 gap-y-1 items-center p-1 border rounded-md bg-card">
        <Button
            variant={isPenActive ? 'secondary' : 'outline'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsPenActive(!isPenActive)}
            title="Ativar/Desativar modo de anotação"
        >
            <Pen className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-5 mx-1" />
        {isPenActive && (
            <>
            <Label className="text-xs">Cor:</Label>
            <div className="flex gap-1">
                {colors.map(color => (
                    <button 
                        key={color}
                        onClick={() => setBrushColor(color)}
                        className={`w-5 h-5 rounded-full border-2 ${brushColor === color ? 'border-ring' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>
            <Separator orientation="vertical" className="h-5 mx-1"/>
            <div className="flex items-center gap-1">
                <Label htmlFor="brush-size" className="text-xs">Tamanho:</Label>
                <Slider
                    id="brush-size"
                    min={1}
                    max={20}
                    step={1}
                    value={[brushSize]}
                    onValueChange={(value) => setBrushSize(value[0])}
                    className="w-20"
                />
            </div>
            <Separator orientation="vertical" className="h-5 mx-1"/>
            </>
        )}
        <div className="flex items-center gap-1">
            <Label className="text-xs">Zoom:</Label>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoomLevel(z => Math.max(0.2, z - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoomLevel(z => Math.min(3, z + 0.1))}><ZoomIn className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoomLevel(1)}><Redo2 className="w-4 h-4" /> <span className="sr-only">Reset Zoom</span></Button>
            <span className="text-xs font-mono w-10 text-center">{(zoomLevel * 100).toFixed(0)}%</span>
        </div>
        <Separator orientation="vertical" className="h-5 mx-1"/>
        <Button variant="outline" size="sm" className="h-8 px-2" onClick={handleClearAnnotations}>
          <Trash2 className="mr-1 h-4 w-4" />
          <span className="text-xs">Limpar anotações</span>
        </Button>
      </div>

      <div className="w-full flex-1 overflow-auto border bg-muted">
        <div className="flex justify-center items-center min-h-full p-4">
            <canvas
                ref={canvasRef}
                onMouseDown={isDrawingMode ? startDrawing : undefined}
                onMouseMove={isDrawingMode ? draw : undefined}
                onMouseUp={isDrawingMode ? stopDrawing : undefined}
                onMouseLeave={isDrawingMode ? stopDrawing : undefined}
                onTouchStart={isDrawingMode ? startDrawing : undefined}
                onTouchMove={isDrawingMode ? draw : undefined}
                onTouchEnd={isDrawingMode ? stopDrawing : undefined}
                className={cn(
                    isDrawingMode ? "cursor-crosshair" : "cursor-grab",
                )}
                style={{ 
                    touchAction: isDrawingMode && isTouchDevice ? 'none' : 'auto',
                    width: imageSize.width > 0 ? `${imageSize.width * zoomLevel}px` : 'auto',
                    height: imageSize.height > 0 ? `${imageSize.height * zoomLevel}px` : 'auto',
                }} 
            />
        </div>
      </div>
    </div>
  );
});
AnnotationCanvas.displayName = 'AnnotationCanvas';

export { AnnotationCanvas };
