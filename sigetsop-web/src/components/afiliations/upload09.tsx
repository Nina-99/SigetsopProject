import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateQr, uploadFile } from "../../services/avc09";
import { DropzoneComponent } from "../form";
import QrLink from "./QrLink";
import axios from "axios";

export default function UploadPage() {
  const [qrData, setQrData] = useState(null); // Contiene { session_key, qr_url }
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [session, setSession] = useState<string | null>(null);
  const [uploadedId, setUploadedId] = useState<string | null>(null);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone/i.test(navigator.userAgent));
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const urlParams = new URLSearchParams(window.location.search);
    const sessionKey = urlParams.get("session_key");
    if (sessionKey) {
      formData.append("session_key", sessionKey);
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/upload09/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      navigate(`/correct/${response.data.document_id}`);
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      alert("Fallo la subida. Inténtalo de nuevo.");
      setIsLoading(false);
    }
  };

  // 3. Generar el enlace QR
  const generateQrLink = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/qr-link/`);
      setQrData(response.data);
      setIsLoading(false);
      // Iniciar el sondeo para esperar la subida desde el móvil
      startPolling(response.data.session_key);
    } catch (error) {
      console.error("Error al generar QR:", error);
      alert("Fallo la generación del QR.");
      setIsLoading(false);
    }
  };

  async function handleFile(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadFile(fd);
    setUploadedId(res.data.id);
    // redirect to correction page
    window.location.href = `/correction/${res.data.id}`;
  }

  async function handleGenerateQr() {
    const res = await generateQr();
    setSession(res.data.token);
  }

  return (
    <div className="page upload-page">
      <h2>Subir imagen o PDF</h2>
      {/* <UploadBox onFileSelected={handleFile} /> */}
      <DropzoneComponent />

      <section style={{ marginTop: 16 }}>
        <button onClick={handleGenerateQr}>Generar QR y enlazar móvil</button>
        {session && <QrLink token={session} />}
      </section>
    </div>
  );
}
