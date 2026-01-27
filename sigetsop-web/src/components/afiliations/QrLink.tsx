import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface QrCodeDisplayProps {
  tokenKey: string;
  sessionId: string;
  mobileUrlBase: string;
}

const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({
  tokenKey,
  sessionId,
  mobileUrlBase,
}) => {
  const url = `${mobileUrlBase}/${tokenKey}?session_id=${sessionId}`;
  return (
    <div className="flex flex-col items-center justify-center space-y-4 mt-6">
      <p className="dark:text-gray-400">
        Escanea este código QR con tu celular:
      </p>
      <QRCodeSVG
        value={url}
        size={200}
        className="rounded-lg shadow-lg bg-white"
      />
    </div>
  );
};

export default QrCodeDisplay;
