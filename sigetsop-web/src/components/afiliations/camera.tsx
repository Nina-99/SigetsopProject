import React, { useRef } from "react";
import { useParams } from "react-router-dom";
import { uploadFile } from "../../services/avc09";
import { CameraCapture } from "../common";

export default function CameraPage() {
  const { token } = useParams();
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleBlob(blob: Blob) {
    const fd = new FormData();
    fd.append("file", new File([blob], "capture.jpg", { type: "image/jpeg" }));
    if (token) fd.append("session_token", token);
    const res = await uploadFile(fd);
    // After upload, redirect to desktop view (the desktop receives via socket) or show confirmation
    return res.data;
  }

  return (
    <div className="page camera-page">
      <h2>Tomar foto / Subir desde el móvil</h2>
      <CameraCapture onCapture={handleBlob} />
      <hr />
      <input ref={inputRef} type="file" accept="image/*,application/pdf" />
    </div>
  );
}
