import {
  ComponentCard,
  PageBreadCrumb,
  PageMeta,
  PersonnelTable,
  PrenatalRecordsTable,
} from "../../components";
import { useState } from "react";

export default function PersonnelTables() {
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<number | null>(null);

  return (
    <>
      <PageMeta
        title="Sigetsop - Table"
        description="This is Tables Dashboard Personnel page"
      />
      <PageBreadCrumb pageTitle="Personal Policial" />
      <div className="space-y-6">
        <ComponentCard title="Tabla Personnel">
          <PersonnelTable />
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Personal para Registros Prenatales
            </label>
            <input
              type="number"
              placeholder="Ingrese ID del personal"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              onChange={(e) => setSelectedPersonnelId(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </ComponentCard>

        {selectedPersonnelId && (
          <ComponentCard title={`Registros Prenatales - Personal ID: ${selectedPersonnelId}`}>
            <PrenatalRecordsTable personnelId={selectedPersonnelId} />
          </ComponentCard>
        )}
      </div>
    </>
  );
}
