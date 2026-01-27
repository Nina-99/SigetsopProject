import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../services";
import { DataTable } from "../tables";

export default function ReviewPage() {
  const { id } = useParams();
  const [fields, setFields] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await api.post("/api/ocr/extract/", { id });
      setFields(res.data);
    }
    if (id) load();
  }, [id]);

  async function handleSave(changed: any) {
    await api.post("/api/records/", { ...changed, source_image_id: id });
    window.location.href = "/dashboard";
  }

  return (
    <div className="page review-page">
      <h2>Revisar y corregir datos</h2>
      {fields ? (
        <DataTable initialData={fields} onSave={handleSave} />
      ) : (
        <p>Extrayendo datos...</p>
      )}
    </div>
  );
}
