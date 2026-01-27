import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const MOBILE_UPLOAD_PATH = "/upload/mobile";
const SESSION_STORAGE_KEY = "avc09_mobile_session_token";

const MobileLink: React.FC = () => {
  // Para leer los parámetros de la URL (?token=...)
  const [searchParams] = useSearchParams();
  // Para redirigir programáticamente
  const navigate = useNavigate();

  // Estado para mostrar un mensaje amigable
  const [message, setMessage] = useState("Enlazando sesión móvil...");

  useEffect(() => {
    const SESSION_TOKEN = searchParams.get("token");

    if (SESSION_TOKEN) {
      // 1. Almacenar el token de sesión
      // Este token es el que usará AVC09MovileUpload.tsx para identificar
      // la sesión de PC y enviar la imagen por el canal WebSocket o API.
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, SESSION_TOKEN);
        console.log("✅ Token de sesión móvil guardado:", SESSION_TOKEN);

        setMessage("¡Sesión enlazada! Redirigiendo a la subida de archivos...");

        // 2. Redirigir al componente final
        // El 'replace: true' asegura que el usuario no pueda volver a esta página con el botón 'atrás'
        setTimeout(() => {
          navigate(MOBILE_UPLOAD_PATH, { replace: true });
        }, 100); // Pequeño delay para asegurar que el state se actualice o para UX
      } catch (error) {
        console.error("❌ Error al guardar el token en localStorage:", error);
        setMessage("Error: No se pudo guardar el token en el dispositivo.");
      }
    } else {
      // Error si se accede a la ruta sin el token
      setMessage(
        "❌ Error: El enlace QR es inválido o el token no se encontró.",
      );
      console.error("❌ Token de sesión no encontrado en la URL.");
      // Opcional: Redirigir a una página de error o login manual
      // setTimeout(() => {
      //      navigate('/auth/mobile-login', { replace: true });
      // }, 2000);
    }
  }, [searchParams, navigate]);

  return (
    <div
      style={{
        textAlign: "center",
        padding: "50px",
        backgroundColor: "#1f2937",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "15px" }}>
        {message.includes("Error")
          ? "⚠️ Proceso Fallido"
          : "🔗 Enlazando Dispositivo"}
      </h1>
      <p>{message}</p>
    </div>
  );
};

export default MobileLink;
