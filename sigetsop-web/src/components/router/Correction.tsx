import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { avc09 } from "../../services";
import { ImageCropper } from "../afiliations";

export default function CorrectionPage() {
  const { id } = useParams();
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [points, setPoints] = useState<number[][]>([]);

  useEffect(() => {
    // fetch image url for id
    async function load() {
      const r = await avc09.get(`/uploads/${id}/`);
      setImgUrl(r.data.image_url);
    }
    if (id) load();
  }, [id]);

  async function handleConfirm(pointsData: number[][]) {
    if (!id) return;
    await avc09.post("/ocr/correct/", { id, points: pointsData });
    // after correction, go to extract/review
    window.location.href = `/review/${id}`;
  }

  return (
    <div className="page correction-page">
      <h2>Corrección de puntos</h2>
      {imgUrl ? (
        <ImageCropper src={imgUrl} onConfirm={(p) => handleConfirm(p)} />
      ) : (
        <p>Cargando imagen...</p>
      )}
    </div>
  );
}
