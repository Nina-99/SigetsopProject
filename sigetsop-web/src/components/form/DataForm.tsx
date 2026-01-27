import React, { useState } from "react";
import { OcrData } from "../../types";

interface DataFormProps {
  initialData: OcrData;
  onSave: (formData: OcrData) => void;
}

const DataForm: React.FC<DataFormProps> = ({ initialData, onSave }) => {
  const [formData, setFormData] = useState<OcrData>(initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: "700px",
        margin: "auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Revisa y Corrige los Datos OCR 📝</h2>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        {Object.keys(formData).map((key) => (
          <div key={key} style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: "5px", fontWeight: "bold" }}>
              {key.replace("_", " ").toUpperCase()}:
            </label>
            <input
              type="text"
              name={key}
              // El type assertion 'as keyof OcrData' le indica a TypeScript que la clave existe en el objeto
              value={formData[key as keyof OcrData] || ""}
              onChange={handleChange}
              style={{
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </div>
        ))}
      </div>
      <button
        type="submit"
        style={{
          marginTop: "30px",
          padding: "10px 30px",
          fontSize: "18px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Guardar en Base de Datos
      </button>
    </form>
  );
};

export default DataForm;
