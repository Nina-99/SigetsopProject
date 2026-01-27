import { useState, useEffect, useCallback } from "react";
import { PrenatalCareService, PrenatalRecord } from "../../../services";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "./ModalComponents";
import { DatePicker, Input, Select } from "../../form";
import Swal from "sweetalert2";

interface PrenatalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit: PrenatalRecord | null;
  personnelId: number;
  onSave: (record: PrenatalRecord) => void;
}

type PrenatalRecordState = {
  relationshipType: "officer" | "civil_partner";
  civilPartnerName: string;
  estimatedDeliveryDate: string;
  currentGestationWeek: number;
  rhFactor: string;
  controlLocation: string;
  observations: string;
};

const initialState: PrenatalRecordState = {
  relationshipType: "officer",
  civilPartnerName: "",
  estimatedDeliveryDate: "",
  currentGestationWeek: 0,
  rhFactor: "",
  controlLocation: "",
  observations: "",
};

const relationshipOptions = [
  { value: "officer", label: "Funcionario" },
  { value: "civil_partner", label: "Pareja Civil" },
];

const rhFactorOptions = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];

export default function PrenatalRecordModal({
  isOpen,
  onClose,
  recordToEdit,
  personnelId,
  onSave,
}: PrenatalRecordModalProps) {
  const [recordState, setRecordState] =
    useState<PrenatalRecordState>(initialState);

  const isEditing = recordToEdit !== null;
  const title = isEditing
    ? "Editar Registro Prenatal"
    : "Nuevo Registro Prenatal";

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRecordState(initialState);
      return;
    }

    if (isEditing && recordToEdit) {
      setRecordState({
        relationshipType: recordToEdit.relationship_type || "officer",
        civilPartnerName: recordToEdit.civil_partner_name || "",
        estimatedDeliveryDate: recordToEdit.estimated_delivery_date || "",
        currentGestationWeek: recordToEdit.current_gestation_week || 0,
        rhFactor: recordToEdit.rh_factor || "",
        controlLocation: recordToEdit.control_location || "",
        observations: recordToEdit.observations || "",
      });
    } else {
      setRecordState(initialState);
    }
  }, [isOpen, isEditing, recordToEdit]);

  const handleDateChange = useCallback((_selectedDates: Date[], dateStr: string) => {
    setRecordState((prevState) => ({
      ...prevState,
      estimatedDeliveryDate: dateStr || "",
    }));
  }, []);

  const handleChange = useCallback((fieldName: string) => (valueOrEvent: any) => {
    let newValue;

    if (valueOrEvent && valueOrEvent.target) {
      newValue = valueOrEvent.target.value;
    } else {
      newValue = valueOrEvent;
    }

    setRecordState((prevState) => ({
      ...prevState,
      [fieldName]: newValue,
    }));
  }, []);

  const handleSelectChange = useCallback(
    (field: keyof PrenatalRecordState) => (value: string) => {
      setRecordState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !recordState.estimatedDeliveryDate.trim() ||
      !recordState.currentGestationWeek ||
      !recordState.rhFactor.trim() ||
      !recordState.controlLocation.trim() ||
      (recordState.relationshipType === "civil_partner" && !recordState.civilPartnerName.trim())
    ) {
      Swal.fire({
        icon: "error",
        title: "Error:",
        text: "Por favor complete todos los campos obligatorios.",
      });
      return;
    }

    setIsLoading(true);

    const payload = {
      personnel_id: personnelId,
      relationship_type: recordState.relationshipType,
      civil_partner_name: recordState.relationshipType === "civil_partner" ? recordState.civilPartnerName.trim() : null,
      estimated_delivery_date: String(recordState.estimatedDeliveryDate),
      current_gestation_week: Number(recordState.currentGestationWeek),
      rh_factor: String(recordState.rhFactor),
      control_location: recordState.controlLocation.trim(),
      observations: recordState.observations.trim(),
    };

    try {
      let response;

      if (isEditing && recordToEdit) {
        response = await PrenatalCareService.update(recordToEdit.id, payload);
      } else {
        response = await PrenatalCareService.create(payload);
      }

      onSave(response.data);
      onClose();
    } catch (error) {
      console.error(`Error al guardar:`, error);
      alert("Error al guardar el registro prenatal. Verifique la consola.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent className="max-w-xl w-full">
        <ModalHeader className="flex justify-between items-center p-4 border-b dark:border-white/[0.05]">
          <div>
            <h3 className="text-xl font-semibold text-blue-gray dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isEditing
                ? "Modifique los datos del registro prenatal."
                : "Ingrese los datos para el nuevo registro prenatal."}
            </p>
          </div>
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.05] transition"
            onClick={onClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody className="p-5 overflow-y-scroll max-h-[70vh]">
            <div className="space-y-6">
              <fieldset className="border p-4 rounded-md space-y-4">
                <legend className="text-lg font-semibold dark:text-gray-200 px-2">
                  Datos del Control Prenatal
                </legend>

                {/* Tipo de Relación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Relación <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={relationshipOptions}
                    value={recordState.relationshipType}
                    onChange={handleSelectChange("relationshipType")}
                    placeholder="Seleccione Tipo"
                  />
                </div>

                {/* Nombre Pareja Civil */}
                {recordState.relationshipType === "civil_partner" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre de la Pareja Civil <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={recordState.civilPartnerName}
                      onChange={handleChange("civilPartnerName")}
                      placeholder="Ingrese el nombre completo"
                    />
                  </div>
                )}

                {/* Fecha Probable de Parto */}
                 <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha Probable de Parto <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    id="estimatedDeliveryDate"
                    value={recordState.estimatedDeliveryDate}
                    placeholder="Seleccione una Fecha"
                    onChange={handleDateChange}
                  />
                </div>

                {/* Semana de Gestación y Factor RH */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Semana de Gestación <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={recordState.currentGestationWeek}
                      onChange={handleChange("currentGestationWeek")}
                      placeholder="Ej: 20"
                      min="0"
                      max="42"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Factor RH <span className="text-red-500">*</span>
                    </label>
                    <Select
                      options={rhFactorOptions}
                      value={recordState.rhFactor}
                      onChange={handleSelectChange("rhFactor")}
                      placeholder="Seleccione Factor RH"
                    />
                  </div>
                </div>

                {/* Lugar de Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lugar de Control <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={recordState.controlLocation}
                    onChange={handleChange("controlLocation")}
                    placeholder="Ej: Hospital San Juan"
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    rows={3}
                    value={recordState.observations}
                    onChange={handleChange("observations")}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </fieldset>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400">
                  Campos con <span className="text-red-500">*</span> son
                  obligatorios.
                </p>
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="flex justify-end gap-3 p-4 border-t dark:border-white/[0.05]">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                isLoading ||
                !recordState.estimatedDeliveryDate.trim() ||
                !recordState.currentGestationWeek ||
                !recordState.rhFactor.trim() ||
                !recordState.controlLocation.trim() ||
                (recordState.relationshipType === "civil_partner" && !recordState.civilPartnerName.trim())
              }
            >
              {isLoading ? "Guardando..." : "Guardar Registro"}
            </button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
