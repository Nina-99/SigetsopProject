import React from "react";
import QRCode from "react-qr-code";

type Props = { token: string };

export default function QrLink({ token }: Props) {
  const url = `${window.location.origin}/camera/${token}`;
  return (
    <div style={{ marginTop: 12 }}>
      <p>Escanea con el celular para conectar sesión:</p>
      <div style={{ background: "white", display: "inline-block", padding: 8 }}>
        <QRCode value={url} size={160} />
      </div>
      <p>
        <small>{url}</small>
      </p>
    </div>
  );
}
