import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../@core";
import Swal from "sweetalert2";

interface Point {
  x: number;
  y: number;
}

interface Props {
  imageUrl: string;
  initialPoints: Point[];
  onConfirm?: (correctedData: any) => void;
}

const PointCorrector: React.FC<Props> = ({
  imageUrl,
  initialPoints,
  onConfirm,
}) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const magnifierCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [points, setPoints] = useState<Point[]>([]);
  const [rotation, setRotation] = useState(0);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  //NOTE: Cargar imagen y ajustar tamaño responsivo
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const imge = e.currentTarget;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    setImageSize({ width: imge.naturalWidth, height: imge.naturalHeight });

    // Calculamos un ancho máximo dinámico basado en el ancho de la pantalla (95%)
    const screenPadding = 40;
    const dynamicMaxWidth = Math.min(800, window.innerWidth - screenPadding);

    const scaleFactor = imge.naturalWidth > dynamicMaxWidth ? dynamicMaxWidth / imge.naturalWidth : 1;
    setScale(scaleFactor);
    setRotation(0);

    canvas.width = imge.naturalWidth * scaleFactor;
    canvas.height = imge.naturalHeight * scaleFactor;
    
    setDisplaySize({ width: canvas.width, height: canvas.height });

    const scaledPoints = initialPoints.map((p) => ({
      x: p.x * scaleFactor,
      y: p.y * scaleFactor,
    }));

    setPoints(scaledPoints);
  };
  //NOTE: Dibuja imagen base
  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Aplicar rotación
    if (rotation === 90) {
      ctx.translate(canvas.width, 0);
      ctx.rotate((90 * Math.PI) / 180);
    } else if (rotation === 180) {
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate((180 * Math.PI) / 180);
    } else if (rotation === 270) {
      ctx.translate(0, canvas.height);
      ctx.rotate((270 * Math.PI) / 180);
    }

    // Dibujar la imagen. Si es 90 o 270, las dimensiones se intercambian en el drawImage
    if (rotation === 90 || rotation === 270) {
      ctx.drawImage(img, 0, 0, canvas.height, canvas.width);
    } else {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
  }, [points, rotation]);

  //NOTE: Función de transformación de perspectiva (divide en dos triángulos)
  const getWarpedPreview = (highRes = false): string | null => {
    const img = imgRef.current;
    if (!img || points.length < 4) return null;

    // Usar escala real si es highRes
    const currentScale = highRes ? 1 : scale;

    // Normalizar puntos: traducirlos de vuelta al espacio de la imagen original (sin rotación)
    // Pero si es para previsualización (no highRes), se quedan en el espacio visual
    const normalizedPoints = points.map((p) => {
      let nx = p.x / scale; // Ir siempre a coordenadas naturales primero
      let ny = p.y / scale;

      if (rotation === 90) {
        const tmp = nx;
        nx = ny;
        ny = img.height - tmp;
      } else if (rotation === 180) {
        nx = img.width - nx;
        ny = img.height - ny;
      } else if (rotation === 270) {
        const tmp = nx;
        nx = img.width - ny;
        ny = tmp;
      }

      // Ahora aplicar la escala de salida deseada
      return { x: nx * currentScale, y: ny * currentScale };
    });

    const [tl, tr, br, bl] = normalizedPoints;
    const width = Math.max(
      Math.hypot(tr.x - tl.x, tr.y - tl.y),
      Math.hypot(br.x - bl.x, br.y - bl.y),
    );
    const height = Math.max(
      Math.hypot(bl.x - tl.x, bl.y - tl.y),
      Math.hypot(br.x - tr.x, br.y - tr.y),
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const mapTriangle = (
      src: [Point, Point, Point],
      dst: [Point, Point, Point],
    ) => {
      const [x0, y0] = [src[0].x, src[0].y];
      const [x1, y1] = [src[1].x, src[1].y];
      const [x2, y2] = [src[2].x, src[2].y];
      const [u0, v0] = [dst[0].x, dst[0].y];
      const [u1, v1] = [dst[1].x, dst[1].y];
      const [u2, v2] = [dst[2].x, dst[2].y];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(u0, v0);
      ctx.lineTo(u1, v1);
      ctx.lineTo(u2, v2);
      ctx.closePath();
      ctx.clip();

      const det = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1);
      if (det === 0) return;

      const a = (u0 * (y1 - y2) + u1 * (y2 - y0) + u2 * (y0 - y1)) / det;
      const b = (u0 * (x2 - x1) + u1 * (x0 - x2) + u2 * (x1 - x0)) / det;
      const c =
        (u0 * (x1 * y2 - x2 * y1) +
          u1 * (x2 * y0 - x0 * y2) +
          u2 * (x0 * y1 - x1 * y0)) /
        det;
      const d = (v0 * (y1 - y2) + v1 * (y2 - y0) + v2 * (y0 - y1)) / det;
      const e = (v0 * (x2 - x1) + v1 * (x0 - x2) + v2 * (x1 - x0)) / det;
      const f =
        (v0 * (x1 * y2 - x2 * y1) +
          v1 * (x2 * y0 - x0 * y2) +
          v2 * (x0 * y1 - x1 * y0)) /
        det;

      ctx.setTransform(a, d, b, e, c, f);
      ctx.drawImage(img, 0, 0, img.width * currentScale, img.height * currentScale);
      ctx.restore();
    };

    // Triángulos para mapear la perspectiva
    mapTriangle(
      [tl, tr, bl],
      [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: 0, y: height },
      ],
    );
    mapTriangle(
      [tr, br, bl],
      [
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ],
    );

    return canvas.toDataURL("image/png");
  };

  //NOTE: Actualiza vista previa en tiempo real
  useEffect(() => {
    if (points.length === 4) {
      const warped = getWarpedPreview(false);
      if (warped) setPreviewUrl(warped);
    }
  }, [points, rotation]);

  //NOTE: Lupa de Precisión para móviles y desktop
  useEffect(() => {
    if (draggingIndex !== null && canvasRef.current && magnifierCanvasRef.current) {
      const mainCanvas = canvasRef.current;
      const magCanvas = magnifierCanvasRef.current;
      const mctx = magCanvas.getContext("2d");
      if (mctx) {
        const p = points[draggingIndex];
        const size = 60; // Área de captura del canvas original
        mctx.imageSmoothingEnabled = false; // Zoom nítido sin suavizado
        mctx.clearRect(0, 0, magCanvas.width, magCanvas.height);
        
        // Dibujar el contenido del canvas principal ampliado
        mctx.drawImage(
          mainCanvas,
          p.x - size / 2, p.y - size / 2, size, size, // Origen
          0, 0, magCanvas.width, magCanvas.height      // Destino (120x120)
        );
        
        // Cruz de precisión roja
        mctx.strokeStyle = "#ff0000";
        mctx.lineWidth = 2;
        mctx.beginPath();
        mctx.moveTo(magCanvas.width / 2, 0); mctx.lineTo(magCanvas.width / 2, magCanvas.height);
        mctx.moveTo(0, magCanvas.height / 2); mctx.lineTo(magCanvas.width, magCanvas.height / 2);
        mctx.stroke();
      }
    }
  }, [points, draggingIndex]);

  //NOTE: Control del arrastre con corrección de escala visual para PC y Móvil
  const getPointerPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // Proporción entre el tamaño interno del canvas (pixels) y el tamaño visual en el DOM
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return { 
      x: (clientX - rect.left) * scaleX, 
      y: (clientY - rect.top) * scaleY 
    };
  };

  const startDrag = (x: number, y: number) => {
    // Aumentamos el hitbox a 30px para mayor facilidad en móviles
    const hit = points.findIndex((p) => Math.hypot(p.x - x, p.y - y) < 30);
    if (hit !== -1) {
      setDraggingIndex(hit);
      // Pequeña vibración táctil al seleccionar el punto
      if ("vibrate" in navigator) navigator.vibrate(20);
    }
  };

  const moveDrag = (x: number, y: number) => {
    if (draggingIndex === null || !canvasRef.current) return;
    const canvas = canvasRef.current;

    // Restringir puntos dentro de los límites del canvas (Clamping)
    const clampedX = Math.max(0, Math.min(x, canvas.width));
    const clampedY = Math.max(0, Math.min(y, canvas.height));

    const newPts = [...points];
    newPts[draggingIndex] = { x: clampedX, y: clampedY };
    setPoints(newPts);
  };

  const stopDrag = () => setDraggingIndex(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getPointerPos(e.clientX, e.clientY);
    startDrag(x, y);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getPointerPos(e.clientX, e.clientY);
    moveDrag(x, y);
  };

  // Manejo de eventos táctiles nativos para evitar el error de "passive event listener"
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStartNative = (e: TouchEvent) => {
      const touch = e.touches[0];
      const { x, y } = getPointerPos(touch.clientX, touch.clientY);
      startDrag(x, y);
    };

    const handleTouchMoveNative = (e: TouchEvent) => {
      // Solo prevenimos el scroll si estamos arrastrando un punto
      if (draggingIndex !== null) {
        if (e.cancelable) e.preventDefault();
      }
      const touch = e.touches[0];
      const { x, y } = getPointerPos(touch.clientX, touch.clientY);
      moveDrag(x, y);
    };

    canvas.addEventListener("touchstart", handleTouchStartNative, {
      passive: false,
    });
    canvas.addEventListener("touchmove", handleTouchMoveNative, {
      passive: false,
    });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStartNative);
      canvas.removeEventListener("touchmove", handleTouchMoveNative);
    };
  }, [points, draggingIndex]);



  const handleRotate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const oldW = canvas.width;
    const oldH = canvas.height;

    // Intercambiar dimensiones del canvas (viewport)
    const newW = oldH;
    const newH = oldW;
    canvas.width = newW;
    canvas.height = newH;

    // Mantener los puntos fijos en la pantalla, pero asegurar que estén dentro de los nuevos límites
    const clampedPoints = points.map((p) => ({
      x: Math.min(Math.max(p.x, 0), newW),
      y: Math.min(Math.max(p.y, 0), newH),
    }));

    setPoints(clampedPoints);
    setDisplaySize({ width: newW, height: newH });
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleResetPoints = () => {
    setRotation(0);
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (img && canvas) {
      const scaleFactor = img.width > 800 ? 800 / img.width : 1;
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;
      const scaledPoints = initialPoints.map((p) => ({
        x: p.x * scaleFactor,
        y: p.y * scaleFactor,
      }));
      setPoints(scaledPoints);
    } else {
      setPoints(initialPoints);
    }
  };
  // const handleConfirm = () => onProcess(points);
  const handleConfirm = async (finalPoints: Point[]) => {
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Iniciar Sesión",
        text: "Debes Iniciar Sesion para Continuar",
      });
      return;
    }

    try {
      const warpedBase64 = getWarpedPreview(true); // Generar recorte en alta resolución
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/process/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl,
          warped_image: warpedBase64, // Enviamos el documento ya recortado y rotado
          rotation,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        Swal.fire({
          icon: "error",
          title: "Error en el procesamiento",
          text: `${err.error || res.statusText}`,
        });
        return;
      }

      const correctedData = await res.json();
      // console.log("Datos recibidos de la API (correctedData):", correctedData);
      Swal.fire({
        title: "Reconocimiento Completado",
        icon: "success",
        draggable: true,
      });
      localStorage.setItem("avc09_data", JSON.stringify(correctedData));
      navigate("/formavc09", {
        replace: true,
        state: { data: correctedData },
      });
    } catch (err) {
      alert("⚠️ ");
      Swal.fire({
        icon: "error",
        title: "Falló la comunicación con el backend",
        text: `${err}`,
      });
    }
  };

  //NOTE: Color de contorno dinámico
  const getElasticColor = (): string => {
    if (points.length < 4) return "#00ffff";
    const [tl, tr, br, bl] = points;
    const angle = (a: Point, b: Point, c: Point) => {
      const ab = { x: a.x - b.x, y: a.y - b.y };
      const cb = { x: c.x - b.x, y: c.y - b.y };
      const dot = ab.x * cb.x + ab.y * cb.y;
      const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
      return (Math.acos(dot / mag) * 180) / Math.PI;
    };
    const avgDev =
      [
        angle(bl, tl, tr),
        angle(tl, tr, br),
        angle(tr, br, bl),
        angle(br, bl, tl),
      ].reduce((a, b) => a + Math.abs(90 - b), 0) / 4;
    if (avgDev < 5) return "#00ff00";
    if (avgDev < 15) return "#ffff00";
    return "#ff0000";
  };

  const path =
    points.length > 0
      ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") +
        " Z"
      : "";
  const color = getElasticColor();

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2 className="dark:text-white mb-4">
        Corrige los puntos del documento 📐
      </h2>

      <div style={{ position: "relative", display: "inline-block" }}>
        <img
          ref={imgRef}
          src={imageUrl}
          alt="documento"
          crossOrigin="anonymous"
          onLoad={handleImageLoad}
          style={{ display: "none" }}
        />
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onTouchEnd={stopDrag}
          style={{
            cursor: draggingIndex !== null ? "grabbing" : "grab",
            touchAction: "none",
            maxWidth: "100%", // Prevenir desbordamiento en móviles
            height: "auto",
            display: "inline-block",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            borderRadius: "8px"
          }}
        />

        <motion.svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${canvasRef.current?.width || 800} ${canvasRef.current?.height || 600}`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
        >
          {points.length > 0 && (
            <motion.path
              d={path}
              fill={`${color}22`}
              stroke={color}
              strokeWidth="2"
              animate={{ d: path, stroke: color }}
              transition={{ type: "spring", stiffness: 900, damping: 10 }}
            />
          )}
        </motion.svg>

        <AnimatePresence>
          {draggingIndex !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              style={{
                position: "absolute",
                // Posicionamos la lupa arriba del punto para evitar que el dedo la tape
                left: points[draggingIndex].x - 60,
                top: points[draggingIndex].y - 150,
                width: 120,
                height: 120,
                borderRadius: "50%",
                border: "4px solid white",
                backgroundColor: "#222",
                boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                overflow: "hidden",
                zIndex: 100,
                pointerEvents: "none",
              }}
            >
              <canvas
                ref={magnifierCanvasRef}
                width={120}
                height={120}
                style={{ width: "100%", height: "100%" }}
              />
            </motion.div>
          )}
          {points.map((p, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{
                // El punto crece al arrastrar para ser visible por fuera del dedo
                scale: draggingIndex === i ? 1.4 : 0.8,
                x: p.x - 10,
                y: p.y - 10,
              }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              style={{
                position: "absolute",
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor: i === draggingIndex ? "#ff0000" : "#00ff00",
                border: "2px solid white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                top: 0,
                left: 0,
                pointerEvents: "none",
                // El punto activo siempre está por encima de los demás
                zIndex: i === draggingIndex ? 50 : 10,
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      <div
        style={{
          marginTop: "15px",
          display: "flex",
          gap: "10px",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => handleConfirm(points)}
          style={{
            background: "#007bff",
            color: "white",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ✅ Confirmar
        </button>
        <button
          onClick={handleRotate}
          style={{
            background: "#fd7e14",
            color: "white",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          Rotar 90°
        </button>
        <button
          onClick={handleResetPoints}
          style={{
            background: "#6c757d",
            color: "white",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          🔄 Reiniciar
        </button>
      </div>

      {previewUrl && (
        <div style={{ marginTop: "25px" }}>
          <h3 className="dark:text-white mb-2">Vista previa corregida ✂️</h3>
          <img
            src={previewUrl}
            alt="preview"
            style={{
              maxWidth: "300px",
              border: "1px solid #ccc",
              borderRadius: "6px",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PointCorrector;
