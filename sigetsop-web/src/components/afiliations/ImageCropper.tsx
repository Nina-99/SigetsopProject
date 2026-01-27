import React, { useEffect, useRef, useState } from "react";

type Props = { src: string; onConfirm: (points: number[][]) => void };

export default function ImageCropper({ src, onConfirm }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rectangleRef = useRef<{x: number, y: number, width: number, height: number} | null>(null);
  const scaleRef = useRef<number>(1);
  const [points, setPoints] = useState<number[][]>([]);
  const [rectangle, setRectangle] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      imgRef.current = img;
      draw();
    };
  }, [src]);

  function draw() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    const maxWidth = 450;
    const maxHeight = 400;
    const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
    scaleRef.current = scale;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // draw rectangle if exists
    if (rectangle) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
      // Draw handles for resize
      ctx.fillStyle = "red";
      const handles = [
        {x: rectangle.x, y: rectangle.y}, // top-left
        {x: rectangle.x + rectangle.width, y: rectangle.y}, // top-right
        {x: rectangle.x, y: rectangle.y + rectangle.height}, // bottom-left
        {x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height} // bottom-right
      ];
      handles.forEach(handle => {
        ctx.beginPath();
        ctx.arc(handle.x, handle.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      ctx.fillStyle = "red";
      points.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    if (!rectangle) {
      // Create initial rectangle based on scaled image size
      const img = imgRef.current;
      const scale = scaleRef.current;
      if (img) {
        const initialWidth = Math.min(img.width * scale * 0.5, 200);
        const initialHeight = Math.min(img.height * scale * 0.5, 200);
        const newRect = {x: 50, y: 50, width: initialWidth, height: initialHeight};
        setRectangle(newRect);
        rectangleRef.current = newRect;
      }
    } else {
      // Check if clicking on handle
      const handle = getHandleAtPosition(x, y, rectangle);
      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle);
        setDragStart({x, y});
        rectangleRef.current = rectangle;
      } else if (isInsideRectangle(x, y, rectangle)) {
        // Inside rectangle, start dragging
        setIsDragging(true);
        setDragStart({x, y});
        rectangleRef.current = rectangle;
      }
    }
  }

  function getHandleAtPosition(x: number, y: number, rect: {x: number, y: number, width: number, height: number}) {
    const handles = [
      {name: 'top-left', x: rect.x, y: rect.y},
      {name: 'top-right', x: rect.x + rect.width, y: rect.y},
      {name: 'bottom-left', x: rect.x, y: rect.y + rect.height},
      {name: 'bottom-right', x: rect.x + rect.width, y: rect.y + rect.height}
    ];
    for (const handle of handles) {
      if (Math.abs(x - handle.x) < 10 && Math.abs(y - handle.y) < 10) {
        return handle.name;
      }
    }
    return null;
  }

  function isInsideRectangle(x: number, y: number, rect: {x: number, y: number, width: number, height: number}) {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    if (isResizing && rectangleRef.current && dragStart && resizeHandle) {
      updateRectangleSize(x, y);
      drawRectangle();
    } else if (isDragging && rectangleRef.current && dragStart) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      rectangleRef.current.x += dx;
      rectangleRef.current.y += dy;
      setDragStart({x, y});
      drawRectangle(); // Only draw overlay
    }
  }

  function updateRectangleSize(x: number, y: number) {
    if (!rectangleRef.current || !resizeHandle || !dragStart) return;
    const rect = rectangleRef.current;
    switch (resizeHandle) {
      case 'top-left':
        rect.width += dragStart.x - x;
        rect.height += dragStart.y - y;
        rect.x = x;
        rect.y = y;
        break;
      case 'top-right':
        rect.width = x - rect.x;
        rect.height += dragStart.y - y;
        rect.y = y;
        break;
      case 'bottom-left':
        rect.width += dragStart.x - x;
        rect.height = y - rect.y;
        rect.x = x;
        break;
      case 'bottom-right':
        rect.width = x - rect.x;
        rect.height = y - rect.y;
        break;
    }
    // Ensure minimum size
    if (rect.width < 50) rect.width = 50;
    if (rect.height < 50) rect.height = 50;
    // Ensure within canvas
    const canvas = canvasRef.current;
    if (canvas) {
      if (rect.x < 0) rect.x = 0;
      if (rect.y < 0) rect.y = 0;
      if (rect.x + rect.width > canvas.width) rect.width = canvas.width - rect.x;
      if (rect.y + rect.height > canvas.height) rect.height = canvas.height - rect.y;
    }
  }

  function drawRectangle() {
    const canvas = canvasRef.current;
    if (!canvas || !rectangleRef.current) return;
    const ctx = canvas.getContext("2d")!;
    // Clear previous rectangle (simple approach: redraw image and rectangle)
    // For better performance, use a separate overlay canvas
    const img = imgRef.current;
    if (img) {
      const scale = scaleRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(rectangleRef.current.x, rectangleRef.current.y, rectangleRef.current.width, rectangleRef.current.height);
    // Draw handles
    ctx.fillStyle = "red";
    const handles = [
      {x: rectangleRef.current.x, y: rectangleRef.current.y},
      {x: rectangleRef.current.x + rectangleRef.current.width, y: rectangleRef.current.y},
      {x: rectangleRef.current.x, y: rectangleRef.current.y + rectangleRef.current.height},
      {x: rectangleRef.current.x + rectangleRef.current.width, y: rectangleRef.current.y + rectangleRef.current.height}
    ];
    handles.forEach(handle => {
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setDragStart(null);
    if (rectangleRef.current) {
      setRectangle(rectangleRef.current);
    }
  }

  function handleConfirm() {
    if (!rectangle) return alert("Selecciona un área de recorte");
    // Scale coordinates back to original image size
    const scale = scaleRef.current;
    const points = [
      [rectangle.x / scale, rectangle.y / scale],
      [(rectangle.x + rectangle.width) / scale, (rectangle.y + rectangle.height) / scale]
    ];
    onConfirm(points);
  }

  function handleReset() {
    setPoints([]);
    setRectangle(null);
    rectangleRef.current = null;
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setDragStart(null);
    setTimeout(draw, 10);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          maxWidth: "450px",
          border: "1px solid #ccc",
          cursor: isDragging ? "grabbing" : isResizing ? "nw-resize" : "grab"
        }}
      />
       <div style={{ marginTop: 8 }}>
         <button onClick={handleConfirm} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2">
           Confirmar puntos
         </button>
         <button onClick={handleReset} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
           Reset
         </button>
        <p>
          Haz clic para crear un marco cuadrado, arrástralo para moverlo, o en las esquinas para redimensionar
        </p>
      </div>
    </div>
  );
}
