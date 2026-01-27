import React, { useState } from "react";

type Props = { initialData: any; onSave: (data: any) => void };

export default function DataTable({ initialData, onSave }: Props) {
  const [data, setData] = useState<any>(initialData);

  function handleChange(k: string, v: string) {
    setData((d: any) => ({ ...d, [k]: v }));
  }

  return (
    <div>
      <table className="data-table">
        <tbody>
          {Object.entries(data).map(([k, v]) => (
            <tr key={k}>
              <td style={{ width: 200 }}>{k}</td>
              <td>
                <input
                  value={v ?? ""}
                  onChange={(e) => handleChange(k, e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => onSave(data)}>Guardar</button>
      </div>
    </div>
  );
}
