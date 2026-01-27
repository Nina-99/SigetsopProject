import React from "react";
import Webcam from "react-webcam";

type Props = { onCapture: (blob: Blob) => Promise<any> };

export default function CameraCapture({ onCapture }: Props) {
  const webcamRef = React.useRef<Webcam | null>(null);

  async function capture() {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    await onCapture(blob);
    alert("Imagen subida");
  }

  return (
    <div>
      <Webcam audio={false} screenshotFormat="image/jpeg" ref={webcamRef} />
      <div style={{ marginTop: 8 }}>
        <button onClick={capture}>Capturar y subir</button>
      </div>
    </div>
  );
}
