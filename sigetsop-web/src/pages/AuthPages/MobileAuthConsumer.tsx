import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { avc09 } from "../../services";

const CONSUME_TOKEN_URL_BASE = `${import.meta.env.VITE_API_URL}/consume-mobile-token/`;

const MobileAuthConsumer: React.FC = () => {
  // Captura el :tokenKey de la URL (ej: /auth/mobile-login/xyz123)
  const { tokenKey } = useParams<{ tokenKey: string }>();
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState(
    "Procesando autenticación...",
  );

  useEffect(() => {
    if (!tokenKey) {
      setStatusMessage("Error: No se encontró el código de sesión en la URL.");
      return;
    }

    const consumeToken = async () => {
      try {
        // Llama al endpoint de consumo de Django
        const response = await avc09.post(
          `${CONSUME_TOKEN_URL_BASE}${tokenKey}/`,
          {},
        );

        // El backend debe devolver el nuevo tóken JWT o DRF
        const { auth_token, username } = response.data;

        // 1. Guardar el nuevo tóken de autenticación en el móvil
        // Esto permite que las futuras llamadas a /upload/mobile estén autenticadas
        localStorage.setItem("token", auth_token);

        // 2. Notificar y Redirigir al componente de Subida Móvil
        setStatusMessage(
          `✅ Sesión iniciada como ${username}. Redirigiendo a la subida...`,
        );

        const sessionId = new URLSearchParams(window.location.search).get("session_id");

        setTimeout(() => {
          // 💡 REDIRECCIÓN FINAL AL COMPONENTE DE SUBIDA MÓVIL con el session_id para el WS
          navigate(`/upload/mobile/${sessionId ? `?session_id=${sessionId}` : ""}`, { replace: true });
        }, 1500);
      } catch (error: any) {
        console.error("❌ Error al consumir el tóken:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          setStatusMessage(
            "❌ Autenticación fallida: El código QR expiró o ya fue utilizado.",
          );
        } else {
          setStatusMessage("❌ Error de conexión con el servidor.");
        }
      }
    };

    consumeToken();
  }, [tokenKey, navigate]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>{statusMessage}</h1>
      {/* Puedes agregar un spinner o un indicador de carga aquí si lo deseas */}
    </div>
  );
};

export default MobileAuthConsumer;
