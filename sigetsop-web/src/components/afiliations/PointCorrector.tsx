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
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [points, setPoints] = useState<Point[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  //NOTE:  Cargar imagen
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const imge = e.currentTarget;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    setImageSize({ width: imge.naturalWidth, height: imge.naturalHeight });
    setDisplaySize({ width: imge.width, height: imge.height });
    if (!img || !canvas) return;

    const maxWidth = 800;
    const scaleFactor = img.width > maxWidth ? maxWidth / img.width : 1;
    setScale(scaleFactor);

    canvas.width = img.width * scaleFactor;
    canvas.height = img.height * scaleFactor;

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
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, [points]);

  //NOTE: Función de transformación de perspectiva (divide en dos triángulos)
  const getWarpedPreview = (): string | null => {
    const img = imgRef.current;
    if (!img || points.length < 4) return null;

    const [tl, tr, br, bl] = points;
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
      ctx.drawImage(img, 0, 0, img.width * scale, img.height * scale);
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
      const warped = getWarpedPreview();
      if (warped) setPreviewUrl(warped);
    }
  }, [points]);

  //NOTE: Control del arrastre (mouse/touch)
  const getPointerPos = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrag = (x: number, y: number) => {
    const hit = points.findIndex((p) => Math.hypot(p.x - x, p.y - y) < 12);
    if (hit !== -1) setDraggingIndex(hit);
  };

  const moveDrag = (x: number, y: number) => {
    if (draggingIndex === null) return;
    const newPts = [...points];
    newPts[draggingIndex] = { x, y };
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

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const { x, y } = getPointerPos(touch.clientX, touch.clientY);
    startDrag(x, y);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const { x, y } = getPointerPos(touch.clientX, touch.clientY);
    moveDrag(x, y);
  };
  const handleResetPoints = () => setPoints(initialPoints);
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
      const realPoints = finalPoints.map((p) => ({
        x: p.x / scale,
        y: p.y / scale,
      }));
      const res = await fetch(`${import.meta.env.VITE_API_URL}/process/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl,
          points: realPoints,
          imageSize,
          displaySize,
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDrag}
          style={{
            cursor: draggingIndex !== null ? "grabbing" : "grab",
            touchAction: "none",
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
          {points.map((p, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{
                scale: draggingIndex === i ? 0.4 : 0.8,
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
                border: "2px solid black",
                top: 0,
                left: 0,
                pointerEvents: "none",
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
