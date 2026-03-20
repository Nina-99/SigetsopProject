import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { avc09 } from "../../services";

import LiveEdgeDetector from "../../components/afiliations/LiveEdgeDetector";
import { PointCorrector } from "../../components";
import Swal from "sweetalert2";

const API_EXCHANGE_URL = `${import.meta.env.VITE_API_URL}/exchange-mobile-token/`;

interface PointsObject {
  // Asumiendo que Points es un array de [number, number]
  x: number;
  y: number;
}

const AVC09MobileUpload: React.FC = () => {
  const { token } = useParams<{ token: string }>(); // El token mágico del path
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id"); // El ID del WS del query param

  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [authError, setAuthError] = useState<string | null>(null);

  const hasFetched = useRef(false);

  // Estados de Subida/Flujo
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(
    "Selecciona un archivo o toma una foto.",
  );
  const [mode, setMode] = useState<"select" | "detect" | "correct">("select");
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [tempPoints, setTempPoints] = useState<PointsObject[] | undefined>(
    undefined,
  );

  // NOTE: --- 🚀 EFECTO DE AUTO-LOGIN (CORREGIDO CON useRef) ---
  useEffect(() => {
    // WARNING: Previene la doble ejecución accidental
    if (!token || hasFetched.current) return;

    hasFetched.current = true;

    const performMobileLogin = async () => {
      try {
        const response = await avc09.post(API_EXCHANGE_URL, { token });

        if (response.data.access) {
          // Guardamos el JWT real en el móvil
          localStorage.setItem("token", response.data.access);
          setIsAuthenticated(true);
          console.log("✅ Autenticación móvil exitosa via Token Mágico.");
        } else {
          setAuthError("No se recibió el token de acceso.");
        }
      } catch (err: any) {
        console.error("❌ Error en el intercambio de token móvil:", err);
        setAuthError(err.response?.data?.error || "Error de autenticación.");
      }
    };

    performMobileLogin();
  }, [token]);

  // NOTE: ---  FUNCIÓN DE SUBIDA (Actualizada) ---
  const uploadToBackend = async (
    fileBlob: Blob,
    finalPoints?: PointsObject[],
  ) => {
    if (!sessionId || !isAuthenticated) {
      alert("Error: Sesión no autenticada o ID de sesión no encontrado.");
      return;
    }

    setIsUploading(true);
    setMessage("Subiendo archivo procesado...");

    const formData = new FormData();
    const file = new File([fileBlob], "upload.jpg", { type: fileBlob.type });
    formData.append("file", file);
    formData.append("session_id", sessionId);

    // Si tenemos los puntos finales (corregidos por el usuario)
    if (finalPoints) {
      formData.append("points", JSON.stringify(finalPoints));
    }

    try {
      const res = await avc09.post("/upload/mobile/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          // El token ya está en el interceptor o localStorage si usas la instancia de axios correcta
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.status === 200) {
        setMessage("✅ ¡Archivo enviado con éxito! Revisa tu computadora.");
        Swal.fire({
          title: "¡Documento Enviado!",
          text: "¿Deseas subir otro documento con esta misma sesión?",
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "Sí, subir otro",
          cancelButtonText: "No, terminar",
          confirmButtonColor: "#28a745",
        }).then((result) => {
          if (result.isConfirmed) {
            // Resetear estados visuales pero MANTENER token e isAuthenticated
            setMode("select");
            setTempImage(null);
            setTempPoints(undefined);
            setMessage("Selecciona el siguiente archivo.");
          } else {
            // 🔒 CIERRE DE SESIÓN SEGURO
            localStorage.removeItem("token");
            setIsAuthenticated(false);
            
            Swal.fire({
              title: "¡Sesión Finalizada!",
              text: "Tu sesión móvil ha sido cerrada por seguridad. Ya puedes cerrar esta pestaña.",
              icon: "info",
              confirmButtonText: "Entendido",
              confirmButtonColor: "#6c757d",
            }).then(() => {
              // Intentar cerrar la pestaña (opcional, suele ser bloqueado)
              window.close();
              // Redirigir al login como respaldo
              navigate("/signin", { replace: true });
            });
          }
        });
      }
    } catch (err) {
      console.error("❌ Error subiendo archivo:", err);
      setMessage("❌ Error al subir el archivo.");
      alert("Hubo un error al subir la imagen. Reintenta.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- MANEJADORES DE UI ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadToBackend(file);
    }
  };

  // Cuando el usuario recorta o confirma puntos en el móvil (opcional, si decides que el móvil corrija)
  const handleMobileCorrectionComplete = (correctedBlob: Blob) => {
    uploadToBackend(correctedBlob);
  };

  // Cuando el detector de bordes captura la foto
  const handleCapture = (imageBlob: Blob, points: PointsObject[]) => {
    // Si quieres que el usuario confirme los puntos en el móvil ANTES de enviar:
    const imageUrl = URL.createObjectURL(imageBlob);
    setTempImage(imageUrl);
    setTempPoints(points);
    setMode("correct");
    // uploadToBackend(imageBlob, points); // O enviar directo
  };

  if (authError) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "red" }}>
        <h2>Error de Autenticación</h2>
        <p>{authError}</p>
        <p>Intenta escanear el código QR de nuevo.</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Autenticando...</h2>
        <p>Espere un momento mientras vinculamos su dispositivo.</p>
      </div>
    );
  }

  // --- VISTAS DE FLUJO ---

  if (mode === "detect") {
    return (
      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <LiveEdgeDetector
          onCapture={handleCapture}
          onCancel={() => setMode("select")}
        />
      </div>
    );
  }

  if (mode === "correct" && tempImage && tempPoints) {
    return (
      <div style={{ padding: "10px", textAlign: "center" }}>
        <h3 className="dark:text-white">Confirma los bordes</h3>
        <PointCorrector
          imageUrl={tempImage}
          initialPoints={tempPoints}
          onConfirm={(correctedPoints) => {
            // Aquí puedes convertir el Canvas del PointCorrector a Blob o simplemente enviar los puntos
            // Para simplicidad en este ejemplo, enviamos el Blob original con los nuevos puntos
            fetch(tempImage)
              .then((r) => r.blob())
              .then((blob) => uploadToBackend(blob, correctedPoints));
          }}
        />
        <button
          onClick={() => setMode("select")}
          style={{ marginTop: "20px", color: "gray" }}
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "auto",
        padding: "30px",
        textAlign: "center",
      }}
    >
      <h2 className="dark:text-white mb-6">Subir Documento AVC-09</h2>
      <p className="dark:text-gray-400 mb-8">{message}</p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          alignItems: "center",
        }}
      >
        {/* Opción 1: Subir Archivo */}
        <input
          className="dark:text-white"
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          disabled={isUploading}
          style={hiddenInputStyle}
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          style={{ ...buttonStyle, backgroundColor: "#007bff" }}
        >
          📁 Subir Archivo (Galería)
        </label>

        {/* Opción 2: Cámara */}
        <label
          onClick={() => setMode("detect")}
          style={{ ...buttonStyle, backgroundColor: "#28a745" }}
        >
          📸 Tomar Foto (con IA)
        </label>

        {isUploading && (
          <div style={{ marginTop: "20px" }}>
            <div className="spinner"></div>{" "}
            {/* Agrega CSS para un spinner si deseas */}
          </div>
        )}
      </div>
    </div>
  );
};

// --- ESTILOS ---
const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "15px 30px",
  fontSize: "18px",
  color: "white",
  borderRadius: "8px",
  cursor: "pointer",
  width: "80%",
  textAlign: "center",
  fontWeight: "bold",
};

const hiddenInputStyle: React.CSSProperties = {
  display: "none",
};

export default AVC09MobileUpload;
