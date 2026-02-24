import { useEffect, useRef, useState } from "react";
import {
  DataForm,
  DropzoneComponent,
  PointCorrector,
  QrCodeDisplay,
} from "../../components";
import { OcrData } from "../../types";
import { avc09 } from "../../services";
import Swal from "sweetalert2";

const MOBILE_AUTH_URL_BASE = `${window.location.origin}/auth/mobile-login`;
const API_TOKEN_URL = `${import.meta.env.VITE_API_URL}/generate-mobile-token/`;

const AVC09Desktop: React.FC = () => {
  const [sessionTokenKey, setSessionTokenKey] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [initialPoints, setInitialPoints] = useState<number[][] | null>(null);
  const [ocrData, setOcrData] = useState<OcrData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Si estamos en móvil o ya tenemos el ID, no hacer nada
    if (isMobile || sessionTokenKey || isLoading || sessionId) return;

    // Asegúrate de que tu URL de WebSocket sea correcta (usando ws:// o wss://)
    const WS_URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/upload-link/`;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ Conexión WS establecida.");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Esperamos el evento que Django Channels envía al conectarse
        if (data.type === "session_created" && data.session_id) {
          // ESTA ES LA LÍNEA CLAVE: Almacena el ID del WS
          setSessionId(data.session_id);
          // console.log(` Sesión ID recibida: ${data.session_id}`);
        }

        // Lógica para manejar la imagen recibida desde el móvil
        if (data.type === "image_received") {
          setImageUrl(data.image_url);
          setInitialPoints(data.initial_points || null);
          let timerInterval;
          Swal.fire({
            title: "¡Imagen recibida desde el móvil!",
            html: "Preparece para procesar la imagen",
            timer: 3000,
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading();
              timerInterval = setInterval(() => {
                const popup = Swal.getPopup();
                if (popup) {
                  const timerEl = popup.querySelector("b");
                  if (timerEl) {
                    timerEl.textContent = `${Swal.getTimerLeft()}`;
                  }
                }
              }, 100);
            },
            willClose: () => {
              clearInterval(timerInterval);
            },
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              console.log("I was closed by the timer");
            }
          });
        }
      };

      ws.onclose = () => {
        console.warn("⚠️ Conexión WS cerrada.");
        setSessionId(null);
      };

      ws.onerror = (err) => {
        console.error("❌ Error en el WebSocket:", err);
        setError("Error de conexión con el WebSocket (Channels).");
      };
    } catch (err) {
      console.error("Error al intentar abrir el WebSocket:", err);
    }

    // Función de limpieza
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [isMobile, isLoading, sessionTokenKey, sessionId]);

  // 🔍 Detectar si el usuario está en un dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent.toLowerCase();
      const mobile =
        /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(ua);
      setIsMobile(mobile);
    };
    checkMobile();
  }, []);

  useEffect(() => {
    // Si ya estamos en móvil o ya tenemos un tóken, o está cargando, salir.
    if (isMobile || sessionTokenKey || isLoading) return;

    const generateAuthToken = async () => {
      setIsLoading(true);
      setError(null);
      // Llama al endpoint de Django que genera el tóken
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        setError("Error: No se encontró el JWT. ¿Ha iniciado sesión?");
        setIsLoading(false);
        return;
      }
      try {
        const response = await avc09.post(
          API_TOKEN_URL,
          {},
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );

        setSessionTokenKey(response.data.token);
      } catch (err) {
        console.error("❌ Error al generar el tóken de autenticación:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError(
            "❌ Autenticación fallida. El JWT puede haber expirado o es inválido.",
          );
        } else if (err.code === "ERR_NETWORK") {
          setError(
            `❌ Error de red. Verifique que la API esté disponible en ${import.meta.env.VITE_API_URL}.`,
          );
        } else {
          setError(
            "Error al generar el tóken de autenticación desde el backend.",
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (!isMobile) {
      generateAuthToken();
    }
  }, [isMobile, isLoading, sessionTokenKey]);

  // Función para guardar el formulario final
  const handleSave = async (formData: OcrData) => {
    setIsLoading(true);
    setError(null);
    try {
      await avc09.post("/save/", formData);
      Swal.fire({
        title: "Datos guardados exitosamente!",
        icon: "success",
        draggable: true,
      });
      setImageUrl(null);
      setOcrData(null);
    } catch (err) {
      console.error("Error al guardar los datos:", err);
      setError(
        "❌ Error al guardar los datos. Revisa la consola y la base de datos.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !sessionId && !isMobile)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Conectando al servidor...
      </div>
    );
  if (error)
    return (
      <div style={{ textAlign: "center", padding: "50px", color: "red" }}>
        Error: {error}
      </div>
    );

  if (ocrData) {
    return <DataForm initialData={ocrData} onSave={handleSave} />;
  }
  if (imageUrl && initialPoints) {
    interface Point {
      x: number;
      y: number;
    }
    const arrayPoints: number[][] = initialPoints as any;
    const objectPoints: Point[] = arrayPoints.map(([x, y]) => ({ x, y }));

    return (
      <div style={{ textAlign: "center" }}>
        {/* NOTE: Mostrar puntos corregibles */}
        <PointCorrector
          imageUrl={imageUrl}
          initialPoints={objectPoints}
          onProcess={(p) => console.log("Final points:", p)}
        />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div
        style={{
          maxWidth: "600px",
          margin: "auto",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <h1 className="dark:text-white">
          Sube o toma una foto del documento 📸
        </h1>
        <p className="dark:text-gray-400">
          Puedes seleccionar una imagen existente o tomar una foto con la
          cámara.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <input
            className="dark:text-white"
            type="file"
            accept="image/*,application/pdf"
            id="file-upload"
            capture="environment"
            style={hiddenInputStyle}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const formData = new FormData();
              formData.append("file", file);

              setIsLoading(true);
              try {
                const res = await fetch(
                  `${import.meta.env.VITE_API_URL}/upload09/`,
                  {
                    method: "POST",
                    body: formData,
                  },
                );
                const data = await res.json();
                console.log("Respuesta del servidor:", data);

                setImageUrl(data.document_url);
                setInitialPoints(data.initial_points || null);
              } catch (err) {
                console.error("❌ Error subiendo imagen móvil:", err);
                setError("Error al subir la imagen desde el móvil.");
              } finally {
                setIsLoading(false);
              }
            }}
          />
          <label
            htmlFor="file-upload"
            style={{ ...buttonStyle, backgroundColor: "#007bff" }}
          >
            📁 Subir Archivo (Imagen o PDF)
          </label>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "auto",
        padding: "40px",
        textAlign: "center",
      }}
    >
      <h1 className="dark:text-white">
        Sistema de Extracción OCR de Documentos 📄
      </h1>
      <p className="dark:text-gray-400">
        Sube el documento desde tu PC o usa el enlace QR para subirlo con tu
        celular.
      </p>

      <DropzoneComponent
        onUploadSuccess={(data: {
          document_url: string;
          initial_points: any;
        }) => {
          setImageUrl(data.document_url);
          setInitialPoints(data.initial_points);
        }}
      />

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          border: "1px dashed #007bff",
        }}
      >
        <h2 className="dark:text-white">Opción 2: Enlace Móvil por QR 📱</h2>
        {sessionTokenKey && sessionId ? (
          <QrCodeDisplay
            tokenKey={sessionTokenKey}
            sessionId={sessionId}
            mobileUrlBase={MOBILE_AUTH_URL_BASE}
          />
        ) : (
          <p>Generando código de sesión...</p>
        )}
      </div>

      {imageUrl && (
        <p style={{ marginTop: "20px", color: "green" }}>
          ¡Documento recibido! Procede a la corrección de puntos.
        </p>
      )}
    </div>
  );
};

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

export default AVC09Desktop;
