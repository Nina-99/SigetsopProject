import React, { useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "../ui/modal/ModalComponents";
import { Button } from "../ui";
import { DownloadIcon, CalenderIcon, CloseIcon } from "../../icons";

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (params: { from_date: string; to_date: string; format: "pdf" | "csv" }) => void;
  title?: string;
}

export default function ReportExportModal({
  isOpen,
  onClose,
  onExport,
  title = "Generar Reporte de Bajas",
}: ReportExportModalProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handlePreset = (type: "this_month" | "last_3_months" | "this_year" | "all") => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    let start = new Date();

    switch (type) {
      case "this_month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last_3_months":
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "this_year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case "all":
        setFromDate("");
        setToDate("");
        return;
    }

    setFromDate(start.toISOString().split("T")[0]);
    setToDate(today);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </ModalHeader>

        <ModalBody className="space-y-6">
          {/* Accesos Rápidos */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Márgenes de tiempo rápidos
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("this_month")}
                className="text-xs"
              >
                Este Mes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("last_3_months")}
                className="text-xs"
              >
                Últimos 3 Meses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("this_year")}
                className="text-xs"
              >
                Todo el Año
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("all")}
                className="text-xs"
              >
                Ver Todo
              </Button>
            </div>
          </div>

          {/* Rango de Fechas Personalizado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Desde
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full py-2 pl-3 pr-2 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Hasta
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full py-2 pl-3 pr-2 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <span className="font-bold">Nota:</span> El reporte incluirá todas las bajas que inicien dentro del margen seleccionado. Si no seleccionas fechas, se exportarán todos los registros activos.
            </p>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={() => onExport({ from_date: fromDate, to_date: toDate, format: "csv" })}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              onClick={() => onExport({ from_date: fromDate, to_date: toDate, format: "pdf" })}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
