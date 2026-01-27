import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Points } from "../../types"; // Asume que tienes src/types/index.ts

interface LiveEdgeDetectorProps {
  // Callback que se dispara cuando el usuario captura la imagen
  onCapture: (image: string, points: Points) => void;
  // Callback para cancelar y volver
  onCancel: () => void;
}

const LiveEdgeDetector: React.FC<LiveEdgeDetectorProps> = ({
  onCapture,
  onCancel,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detectedPoints, setDetectedPoints] = useState<Points | null>(null);
  const [isCvLoaded, setIsCvLoaded] = useState(false);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [feedback, setFeedback] = useState(
    "Cargando Visión por Computadora...",
  );
  // Nuevo estado para controlar el fallo (mantenemos para mostrar el mensaje de error)
  const [useFallback, setUseFallback] = useState(false);
  // Eliminamos manualImageSrc ya que el usuario quiere forzar la cámara

  // Hook para el loop de procesamiento
  const animationFrameId = useRef<number>(0);

  // Cargar OpenCV.js (buscándolo en 'window')
  useEffect(() => {
    // Cast window to 'any' to resolve TypeScript error [2339] if OpenCV is loaded globally
    if (typeof (window as any).cv !== "undefined" && (window as any).cv.Mat) {
      setIsCvLoaded(true);
      setFeedback("Cargado. Esperando permisos de la cámara...");
    } else {
      console.error("OpenCV.js no está cargado en window.cv.");
      setFeedback("Error: Librería de Visión por Computadora no cargada.");
    }
  }, []);

  // Función para ordenar puntos (JS/TS)
  const orderPoints = (pts: number[][]): Points => {
    // Esta es una implementación simplificada.
    pts.sort((a, b) => a[1] - b[1]); // Ordenar por Y
    const top = [pts[0], pts[1]].sort((a, b) => a[0] - b[0]); // Top-L, Top-R
    const bottom = [pts[2], pts[3]].sort((a, b) => a[0] - b[0]); // Bot-L, Bot-R
    return [
      top[0] as [number, number],
      top[1] as [number, number],
      bottom[1] as [number, number],
      bottom[0] as [number, number],
    ];
  };

  // Lógica principal de procesamiento de frames (solo procesa video)
  const processFrame = useCallback(() => {
    const cv = (window as any).cv;

    // Si no está listo, salimos.
    if (
      !isCvLoaded ||
      !isMediaReady ||
      !webcamRef.current ||
      !canvasRef.current
    ) {
      animationFrameId.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = webcamRef.current.video;
    const imageSource: HTMLVideoElement = video as HTMLVideoElement;

    if (
      !isMediaReady ||
      !video ||
      video.readyState !== 4 ||
      video.videoWidth === 0
    ) {
      // Si el video no está listo, esperamos.
      animationFrameId.current = requestAnimationFrame(processFrame);
      return;
    }

    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    // 2. Ajustar el tamaño del Canvas al tamaño del video
    canvasRef.current.width = imageSource.videoWidth;
    canvasRef.current.height = imageSource.videoHeight;

    const src = cv.imread(imageSource);
    const dst = new cv.Mat();
    let currentPoints: Points | null = null;
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    try {
      // === Algoritmo de Detección de Bordes (OpenCV.js) ===
      cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
      cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
      // Volvemos a los umbrales estándar de video
      cv.Canny(dst, dst, 75, 200, 3, false);
      cv.findContours(
        dst,
        contours,
        hierarchy,
        cv.RETR_LIST,
        cv.CHAIN_APPROX_SIMPLE,
      );

      let maxArea = 0;
      let bestContour = null;

      for (let i = 0; i < contours.size(); ++i) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);

        if (area > 10000) {
          // Filtrar por área mínima
          const perimeter = cv.arcLength(contour, true);
          const approx = new cv.Mat();
          cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);

          if (approx.rows === 4 && area > maxArea) {
            maxArea = area;
            bestContour = approx.clone();
          }
          approx.delete();
        }
        contour.delete();
      }

      if (bestContour) {
        // Dibuja el contorno verde
        cv.drawContours(
          src,
          new cv.MatVector([bestContour]),
          0,
          [0, 255, 0, 255],
          5,
        );

        const ptsArray = [
          [bestContour.data32S[0], bestContour.data32S[1]],
          [bestContour.data32S[2], bestContour.data32S[3]],
          [bestContour.data32S[4], bestContour.data32S[5]],
          [bestContour.data32S[6], bestContour.data32S[7]],
        ];

        currentPoints = orderPoints(ptsArray);
        setFeedback("Documento detectado. ¡Listo para capturar!");
        bestContour.delete();
      } else {
        setFeedback("Buscando documento...");
      }

      // 3. Mostrar la imagen procesada
      cv.imshow(canvasRef.current, src);
      setDetectedPoints(currentPoints);
    } catch (err) {
      console.error("Error en procesamiento OpenCV:", err);
      setFeedback("Error en procesamiento.");
    } finally {
      src.delete();
      dst.delete();
      contours.delete();
      hierarchy.delete();
    }

    animationFrameId.current = requestAnimationFrame(processFrame);
  }, [isCvLoaded, isMediaReady, webcamRef, canvasRef]);

  // Inicia/Detiene el loop de procesamiento
  useEffect(() => {
    if (isCvLoaded && isMediaReady) {
      animationFrameId.current = requestAnimationFrame(processFrame);
    }
    // Limpieza al desmontar
    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [isCvLoaded, isMediaReady, processFrame]);

  // Handler de Captura final (solo para Webcam)
  const handleCaptureClick = () => {
    if (detectedPoints && canvasRef.current) {
      // Obtenemos el Base64 directamente del canvas que tiene el contorno dibujado
      const imageSrc = canvasRef.current.toDataURL("image/jpeg", 0.95);
      if (imageSrc) {
        onCapture(imageSrc, detectedPoints);
      }
    }
  };

  // Handler de Fallo de Cámara
  const handleCameraError = (error: any) => {
    console.error("Camera error:", error);
    setIsMediaReady(false);
    setUseFallback(true); // Activa la bandera de error
    setFeedback(
      "🚫 ERROR: El acceso a la cámara está bloqueado por el navegador/entorno. Por favor, **abre la previsualización en una ventana nueva** para permitir el acceso.",
    );
    // Cancelamos el loop si se inició.
    cancelAnimationFrame(animationFrameId.current);
  };

  // Estilos
  const canvasStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "800px",
    minHeight: "300px",
    backgroundColor: useFallback ? "#4a1212" : "#111", // Fondo oscuro o rojo si hay error
    display: "block",
    margin: "0 auto",
    borderRadius: "8px",
  };

  // Modo Normal (Webcam) - Forzado
  return (
    <div
      style={{
        padding: "10px",
        textAlign: "center",
        background: "black",
        minHeight: "100vh",
        color: "white",
      }}
    >
      {/* Mensaje de Feedback */}
      <p
        style={{
          color: useFallback ? "#ffc107" : "white",
          fontWeight: useFallback ? "bold" : "normal",
        }}
      >
        {feedback}
      </p>

      {/* 1. Webcam (oculta el video y lo usa como fuente) */}
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          facingMode: "environment",
          width: 1280,
          height: 720,
        }}
        // Handlers para verificar el estado del stream de la cámara
        onUserMedia={() => {
          setIsMediaReady(true);
          setUseFallback(false); // Reinicia el estado de error si funciona
          setFeedback("Cámara lista. Apunte al documento...");
        }}
        onUserMediaError={handleCameraError} // Usamos el nuevo handler
        // Nota: Mantenemos 'display: none' porque el Canvas muestra el resultado.
        style={{ display: "none" }}
      />

      {/* 2. Canvas (Muestra el frame procesado con el contorno dibujado) */}
      <canvas ref={canvasRef} style={canvasStyle} />

      {/* 3. Botones de Acción */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "space-around",
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: "15px",
            fontSize: "16px",
            backgroundColor: "gray",
            borderRadius: "8px",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleCaptureClick}
          disabled={!detectedPoints}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            backgroundColor: detectedPoints ? "green" : "#555",
            color: "white",
            borderRadius: "8px",
          }}
        >
          📸 Capturar
        </button>
      </div>
    </div>
  );
};

export default LiveEdgeDetector;

// import React, { useRef, useEffect, useState, useCallback } from "react";
// import Webcam from "react-webcam";
// // No importamos 'cv' como módulo, ya que usaremos la variable global 'window.cv'
// import { Points } from "../../types"; // Asume que tienes src/types/index.ts
//
// interface LiveEdgeDetectorProps {
//   // Callback que se dispara cuando el usuario captura la imagen
//   onCapture: (image: string, points: Points) => void;
//   // Callback para cancelar y volver
//   onCancel: () => void;
// }
//
// const LiveEdgeDetector: React.FC<LiveEdgeDetectorProps> = ({
//   onCapture,
//   onCancel,
// }) => {
//   const webcamRef = useRef<Webcam>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [detectedPoints, setDetectedPoints] = useState<Points | null>(null);
//   const [isCvLoaded, setIsCvLoaded] = useState(false);
//   const [feedback, setFeedback] = useState(
//     "Cargando Visión por Computadora...",
//   );
//
//   // Hook para el loop de procesamiento
//   const animationFrameId = useRef<number>(0);
//
//   // Cargar OpenCV.js (buscándolo en 'window')
//   useEffect(() => {
//     // Usamos window.cv, que coincide con tu archivo opencv.d.ts
//     if (typeof (window as any).cv !== "undefined" && (window as any).cv.Mat) {
//       setIsCvLoaded(true);
//       setFeedback("Apunte la cámara al documento...");
//     } else {
//       console.error("OpenCV.js no está cargado en window.cv.");
//       setFeedback("Error al cargar la librería de Visión por Computadora.");
//     }
//   }, []);
//
//   // Función para ordenar puntos (JS/TS)
//   const orderPoints = (pts: number[][]): Points => {
//     // Esta es una implementación simplificada. Para robustez, usa la lógica
//     // completa de tu backend (sumas y diferencias) si esta falla.
//     pts.sort((a, b) => a[1] - b[1]); // Ordenar por Y
//     const top = [pts[0], pts[1]].sort((a, b) => a[0] - b[0]); // Top-L, Top-R
//     const bottom = [pts[2], pts[3]].sort((a, b) => a[0] - b[0]); // Bot-L, Bot-R
//     return [
//       top[0] as [number, number],
//       top[1] as [number, number],
//       bottom[1] as [number, number],
//       bottom[0] as [number, number],
//     ];
//   };
//
//   // Lógica principal de procesamiento de frames
//   const processFrame = useCallback(() => {
//     // Ahora 'cv' se refiere a 'window.cv'
//     const cv = (window as any).cv;
//
//     if (!isCvLoaded || !webcamRef.current || !canvasRef.current) return;
//
//     const video = webcamRef.current.video;
//     if (!video || video.readyState !== 4) {
//       animationFrameId.current = requestAnimationFrame(processFrame);
//       return;
//     }
//
//     const context = canvasRef.current.getContext("2d");
//     if (!context) return;
//
//     canvasRef.current.width = video.videoWidth;
//     canvasRef.current.height = video.videoHeight;
//
//     const src = cv.imread(video);
//     const dst = new cv.Mat();
//     const currentPoints: Points | null = null;
//     const contours = new cv.MatVector();
//     const hierarchy = new cv.Mat();
//
//     try {
//       // === Algoritmo de Detección de Bordes (OpenCV.js) ===
//       cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
//       cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
//       cv.Canny(dst, dst, 75, 200, 3, false);
//       cv.findContours(
//         dst,
//         contours,
//         hierarchy,
//         cv.RETR_LIST,
//         cv.CHAIN_APPROX_SIMPLE,
//       );
//
//       let maxArea = 0;
//       let bestContour = null;
//
//       for (let i = 0; i < contours.size(); ++i) {
//         const contour = contours.get(i);
//         const area = cv.contourArea(contour);
//
//         if (area > 10000) {
//           // Filtrar por área mínima
//           const perimeter = cv.arcLength(contour, true);
//           const approx = new cv.Mat();
//           cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);
//
//           if (approx.rows === 4 && area > maxArea) {
//             maxArea = area;
//             // Clonamos el Mat, ya que 'approx' será liberado
//             bestContour = approx.clone();
//           }
//           approx.delete();
//         }
//         contour.delete();
//       }
//
//       if (bestContour) {
//         // Dibuja el contorno verde
//         cv.drawContours(
//           src,
//           new cv.MatVector([bestContour]),
//           0,
//           [0, 255, 0, 255],
//           5,
//         );
//
//         const ptsArray = [
//           [bestContour.data32S[0], bestContour.data32S[1]],
//           [bestContour.data32S[2], bestContour.data32S[3]],
//           [bestContour.data32S[4], bestContour.data32S[5]],
//           [bestContour.data32S[6], bestContour.data32S[7]],
//         ];
//
//         currentPoints = orderPoints(ptsArray);
//         setFeedback("Documento detectado. ¡Toma la foto!");
//         bestContour.delete();
//       } else {
//         setFeedback("Buscando documento...");
//       }
//
//       cv.imshow(canvasRef.current, src);
//       setDetectedPoints(currentPoints);
//     } catch (err) {
//       console.error("Error en procesamiento OpenCV:", err);
//       setFeedback("Error en procesamiento.");
//     } finally {
//       src.delete();
//       dst.delete();
//       contours.delete();
//       hierarchy.delete();
//     }
//
//     animationFrameId.current = requestAnimationFrame(processFrame);
//   }, [isCvLoaded, webcamRef, canvasRef]);
//
//   // Inicia el loop de procesamiento
//   useEffect(() => {
//     if (isCvLoaded) {
//       animationFrameId.current = requestAnimationFrame(processFrame);
//     }
//     // Limpieza al desmontar
//     return () => {
//       cancelAnimationFrame(animationFrameId.current);
//     };
//   }, [isCvLoaded, processFrame]);
//
//   // Handler de Captura final
//   const handleCaptureClick = () => {
//     if (detectedPoints && webcamRef.current) {
//       const imageSrc = webcamRef.current.getScreenshot();
//       if (imageSrc) {
//         onCapture(imageSrc, detectedPoints);
//       }
//     }
//   };
//
//   return (
//     <div
//       style={{
//         padding: "10px",
//         textAlign: "center",
//         background: "black",
//         minHeight: "100vh",
//         color: "white",
//       }}
//     >
//       <p>{feedback}</p>
//
//       {/* 1. Webcam (oculta el video y lo usa como fuente) */}
//       <Webcam
//         ref={webcamRef}
//         audio={false}
//         screenshotFormat="image/jpeg"
//         videoConstraints={{
//           facingMode: "environment",
//           width: 1280,
//           height: 720,
//         }}
//         style={{ display: "none" }}
//       />
//
//       {/* 2. Canvas (Muestra el frame procesado con el contorno dibujado) */}
//       <canvas ref={canvasRef} style={{ width: "100%", maxWidth: "800px" }} />
//
//       {/* 3. Botones de Acción */}
//       <div
//         style={{
//           marginTop: "20px",
//           display: "flex",
//           justifyContent: "space-around",
//         }}
//       >
//         <button
//           onClick={onCancel}
//           style={{ padding: "15px", fontSize: "16px", backgroundColor: "gray" }}
//         >
//           Cancelar
//         </button>
//         <button
//           onClick={handleCaptureClick}
//           disabled={!detectedPoints}
//           style={{
//             padding: "15px 30px",
//             fontSize: "18px",
//             backgroundColor: detectedPoints ? "green" : "#555",
//             color: "white",
//           }}
//         >
//           📸 Capturar
//         </button>
//       </div>
//     </div>
//   );
// };
//
// export default LiveEdgeDetector;
