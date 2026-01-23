'use client';

import React, { useRef, useEffect, useState, useCallback, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Redo2, Pen, Undo2, Move } from 'lucide-react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPenActive, setIsPenActive] = useState(false);
  const [brushColor, setBrushColor] = useState('#FF0000'); // Default to red
  const [brushSize, setBrushSize] = useState(3);

  // Canvas and image state
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const [zoomLevel, setZoomLevel] = useState(0.5);
  const [imageSize, setImageSize] = useState({width: 0, height: 0});

  // Touch interaction state
  const panStartRef = useRef<{ scrollX: number; scrollY: number; touchX: number; touchY: number } | null>(null);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);


  const colors = ['#FF0000', '#0000FF', '#000000', '#FFFF00', '#00FF00'];
  const storageKey = `annotations_${essayId}`;


  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in event) {
        // Handle both touch and mouse events
        const touch = (event as React.TouchEvent).touches[0] || (event as React.TouchEvent).changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
    } else {
        clientX = (event as React.MouseEvent).clientX;
        clientY = (event as React.MouseEvent).clientY;
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
        setStrokes(savedStrokes ? JSON.parse(savedStrokes) : []);
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
    
    setIsDrawing(true);
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

  const stopDrawing = () => {
    if (!isDrawing) return;
    
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
    setIsDrawing(false);
  };
  
    const handleMouseUp = () => {
        if (!isPenActive || !isDrawing) return;
        stopDrawing();
    };

  const handleUndo = () => {
    if (strokes.length === 0) return;

    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);

    try {
        localStorage.setItem(storageKey, JSON.stringify(newStrokes));
    } catch (error) {
        console.error("Failed to save strokes to localStorage", error);
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
  
  // --- MOUSE EVENT HANDLERS ---
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPenActive) return;
    startDrawing(event);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPenActive || !isDrawing) return;
    draw(event);
  };

  // --- New scroll pad handlers ---
  const handleScrollPadTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault(); // Stop propagation to canvas
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer && event.touches.length === 1) {
        panStartRef.current = {
            scrollX: scrollContainer.scrollLeft,
            scrollY: scrollContainer.scrollTop,
            touchX: event.touches[0].clientX,
            touchY: event.touches[0].clientY,
        };
    }
  };

  const handleScrollPadTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    const scrollContainer = scrollContainerRef.current;
    const panStart = panStartRef.current;
    if (scrollContainer && panStart && event.touches.length === 1) {
        const dx = event.touches[0].clientX - panStart.touchX;
        const dy = event.touches[0].clientY - panStart.touchY;
        scrollContainer.scrollLeft = panStart.scrollX - dx;
        scrollContainer.scrollTop = panStart.scrollY - dy;
    }
  };

  const handleScrollPadTouchEnd = () => {
    panStartRef.current = null;
  };


  // --- TOUCH EVENT HANDLERS ---
  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    // If pen is active, always draw
    if (isPenActive) {
      if (event.touches.length === 1) {
        event.preventDefault();
        startDrawing(event);
      }
      // Disable pinch-to-zoom when drawing
      return;
    }

    // Handle Pan and Pinch if pen is not active
    if (event.touches.length === 2) { // Pinch
        event.preventDefault();
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        pinchStartDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
        pinchStartZoomRef.current = zoomLevel;
    } else if (event.touches.length === 1) { // Pan
        event.preventDefault();
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            panStartRef.current = { 
                scrollX: scrollContainer.scrollLeft, 
                scrollY: scrollContainer.scrollTop,
                touchX: event.touches[0].clientX,
                touchY: event.touches[0].clientY,
            };
        }
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    // If pen is active, always draw
    if (isPenActive) {
      if (isDrawing && event.touches.length === 1) {
        event.preventDefault();
        draw(event);
      }
      return;
    }
    
    // Handle Pan and Pinch if pen is not active
    if (event.touches.length === 2 && pinchStartDistanceRef.current !== null) { // Pinch
        event.preventDefault();
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const newDistance = Math.sqrt(dx * dx + dy * dy);
        const scale = newDistance / pinchStartDistanceRef.current;
        const newZoom = pinchStartZoomRef.current * scale;
        setZoomLevel(Math.max(0.2, Math.min(3, newZoom)));
    } else if (event.touches.length === 1 && panStartRef.current) { // Pan
        event.preventDefault();
        const scrollContainer = scrollContainerRef.current;
        const panStart = panStartRef.current;
        if (scrollContainer && panStart) {
            const dx = event.touches[0].clientX - panStart.touchX;
            const dy = event.touches[0].clientY - panStart.touchY;
            scrollContainer.scrollLeft = panStart.scrollX - dx;
            scrollContainer.scrollTop = panStart.scrollY - dy;
        }
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (isPenActive) {
      if (isDrawing) {
        event.preventDefault();
        stopDrawing();
      }
      return;
    }
    
    // Reset pan/pinch state
    if (event.touches.length < 2) {
        pinchStartDistanceRef.current = null;
    }
    if (event.touches.length < 1) {
        panStartRef.current = null;
    }
  };

  return (
    <div className="flex flex-col gap-2 items-center w-full h-full">
      <div className="flex flex-wrap gap-x-2 gap-y-1 items-center p-1 border rounded-md bg-card">
        <Button
            variant={isPenActive ? 'default' : 'secondary'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsPenActive(!isPenActive)}
            title="Ativar/Desativar modo de anotação"
        >
            <Pen className="w-4 h-4" />
        </Button>
        
        {isPenActive && (
            <>
                <Separator orientation="vertical" className="h-5 mx-1" />
                <div
                    onTouchStart={handleScrollPadTouchStart}
                    onTouchMove={handleScrollPadTouchMove}
                    onTouchEnd={handleScrollPadTouchEnd}
                    className="h-8 w-8 bg-muted rounded-md flex items-center justify-center text-muted-foreground cursor-grab active:cursor-grabbing touch-none select-none"
                    title="Arraste para mover a imagem"
                >
                    <Move className="h-4 w-4" />
                </div>
            </>
        )}

        <Separator orientation="vertical" className="h-5 mx-1" />
        
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
        
        <div className="flex items-center gap-1">
            <Label className="text-xs">Zoom:</Label>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoomLevel(z => Math.max(0.2, z - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoomLevel(z => Math.min(3, z + 0.1))}><ZoomIn className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoomLevel(1)}><Redo2 className="w-4 h-4" /> <span className="sr-only">Reset Zoom</span></Button>
            <span className="text-xs font-mono w-10 text-center">{(zoomLevel * 100).toFixed(0)}%</span>
        </div>
        <Separator orientation="vertical" className="h-5 mx-1"/>
        <Button variant="outline" size="sm" className="h-8 px-2" onClick={handleUndo} disabled={strokes.length === 0}>
          <Undo2 className="mr-1 h-4 w-4" />
          <span className="text-xs">Desfazer</span>
        </Button>
      </div>

      <div ref={scrollContainerRef} className="w-full flex-1 overflow-auto border bg-muted text-center p-4 relative">
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={cn(
                    'touch-none', // We handle all touch actions manually
                    isPenActive ? "cursor-crosshair" : "cursor-grab",
                )}
                style={{
                    width: imageSize.width > 0 ? `${imageSize.width * zoomLevel}px` : 'auto',
                    height: imageSize.height > 0 ? `${imageSize.height * zoomLevel}px` : 'auto',
                }} 
            />
      </div>
    </div>
  );
});
AnnotationCanvas.displayName = 'AnnotationCanvas';

export { AnnotationCanvas };
