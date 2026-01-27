import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "./ModalComponents";
import Swal from "sweetalert2";
import {
  api,
  NatalData,
  natalDataService,
} from "../../../services"; 
import { DatePicker, Select } from "../../form"; 

// Interfaz para el manejo de objetos de personal en el Autocomplete
interface LocalPersonnel {
  id: number;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  maternal_name?: string;
  identity_card?: string;
  grade_data?: { grade_abbr: string };
}

interface NatalDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit: NatalData | null;
  onSave: (record: NatalData) => void;
  personnelId?: number;
}

type NatalDataState = {
  relationshipType: "officer" | "civil_partner";
  civilPartnerName: string;
  birthdate: string;
  country: string;
  department: string;
  province: string;
  locality: string;
  nationality: string;
  observations: string;
};

const initialState: NatalDataState = {
  relationshipType: "officer",
  civilPartnerName: "",
  birthdate: "",
  country: "BOLIVIA",
  department: "",
  province: "",
  locality: "",
  nationality: "BOLIVIANA",
  observations: "",
};

const relationshipOptions = [
  { value: "officer", label: "Funcionario" },
  { value: "civil_partner", label: "Pareja Civil" },
];

const departmentOptions = [
  { value: "la_paz", label: "La Paz" },
  { value: "cochabamba", label: "Cochabamba" },
  { value: "santa_cruz", label: "Santa Cruz" },
  { value: "oru", label: "Oruro" },
  { value: "potosi", label: "Potosí" },
  { value: "tarija", label: "Tarija" },
  { value: "chuquisaca", label: "Chuquisaca" },
  { value: "beni", label: "Beni" },
  { value: "pando", label: "Pando" },
];

export default function NatalDataModal({
  isOpen,
  onClose,
  recordToEdit,
  onSave,
  personnelId,
}: NatalDataModalProps) {
  const [recordState, setRecordState] = useState<NatalDataState>(initialState);
  const [selectedPersonnel, setSelectedPersonnel] =
    useState<LocalPersonnel | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = recordToEdit !== null;
  const title = isEditing
    ? "Editar Datos Natales"
    : "Nuevo Registro de Datos Natales";

  useEffect(() => {
    if (!isOpen) {
      setRecordState(initialState);
      setSelectedPersonnel(null);
      return;
    }

    if (isEditing && recordToEdit) {
      // Seteamos el estado de los campos de texto
      setRecordState({
        relationshipType: recordToEdit.relationship_type || "officer",
        civilPartnerName: recordToEdit.civil_partner_name || "",
        birthdate: recordToEdit.birthdate || "",
        country: recordToEdit.country || "BOLIVIA",
        department: recordToEdit.department || "",
        province: recordToEdit.province || "",
        locality: recordToEdit.locality || "",
        nationality: recordToEdit.nationality || "BOLIVIANA",
        observations: recordToEdit.observations || "",
      });

      // Mapeamos el personal para el Autocomplete (si aún se usa internamente o para mostrar)
      if (recordToEdit.personnel_data) {
        setSelectedPersonnel(recordToEdit.personnel_data as any);
      } else if (recordToEdit.personnel) {
        // Fallback si solo viene el ID
        setSelectedPersonnel({
          id: Number(recordToEdit.personnel),
        } as LocalPersonnel);
      }
    } else {
      setRecordState(initialState);
      if (personnelId) {
        setSelectedPersonnel({ id: personnelId } as LocalPersonnel);
      } else {
        setSelectedPersonnel(null);
      }
    }
  }, [isOpen, isEditing, recordToEdit, personnelId]);

  const handleSelectChange = useCallback(
    (field: keyof NatalDataState) => (value: string) => {
      setRecordState((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleDateChange = useCallback(
    (_selectedDates: Date[], dateStr: string) => {
      setRecordState((prevState) => ({
        ...prevState,
        birthdate: dateStr || "",
      }));
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      (recordState.relationshipType === "officer" && !selectedPersonnel?.id) ||
      (recordState.relationshipType === "civil_partner" && !recordState.civilPartnerName.trim()) ||
      !recordState.birthdate.trim() ||
      !recordState.department.trim() ||
      !recordState.province.trim() ||
      !recordState.locality.trim()
    ) {
      Swal.fire({
        icon: "error",
        title: "Error al Guardar:",
        text: "Por favor complete todos los campos obligatorios.",
      });
      return;
    }

    setIsLoading(true);

    const payload = {
      personnel: recordState.relationshipType === "officer" ? selectedPersonnel?.id : null,
      relationship_type: recordState.relationshipType,
      civil_partner_name: recordState.relationshipType === "civil_partner" ? recordState.civilPartnerName.trim() : null,
      birthdate: recordState.birthdate,
      country: recordState.country,
      department: recordState.department,
      province: recordState.province,
      locality: recordState.locality,
      nationality: recordState.nationality,
      observations: recordState.observations,
    };

    try {
      let response;
      if (isEditing && recordToEdit) {
        response = await natalDataService.update(recordToEdit.id, payload);
      } else {
        response = await natalDataService.create(payload);
      }
      onSave(response.data);
      onClose();
    } catch (error: any) {
      console.error("Error al guardar:", error);
      const serverError = error.response?.data;
      const firstKey = serverError ? Object.keys(serverError)[0] : null;
      Swal.fire({
        icon: "error",
        title: "Error de validación",
        text: firstKey
          ? `${firstKey}: ${serverError[firstKey]}`
          : "Desconocido.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValid =
    (recordState.relationshipType === "officer" ? !!selectedPersonnel?.id : !!recordState.civilPartnerName.trim()) &&
    recordState.birthdate.trim() &&
    recordState.department.trim() &&
    recordState.province.trim() &&
    recordState.locality.trim();

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
                ? "Modifique los datos natales del registro."
                : "Ingrese los datos para el nuevo registro de datos natales."}
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
                  Datos del Registro
                </legend>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Relación
                  </label>
                  <Select
                    options={relationshipOptions}
                    value={recordState.relationshipType}
                    onChange={handleSelectChange("relationshipType")}
                    placeholder="Seleccione Tipo"
                  />
                </div>

                {recordState.relationshipType === "civil_partner" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre de la Pareja Civil <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      value={recordState.civilPartnerName}
                      onChange={(e) =>
                        setRecordState((prev) => ({
                          ...prev,
                          civilPartnerName: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="INGRESE NOMBRE COMPLETO"
                    />
                  </div>
                )}
              </fieldset>

              <fieldset className="border p-4 rounded-md space-y-4">
                <legend className="text-lg font-semibold dark:text-gray-200 px-2">
                  Datos de Nacimiento
                </legend>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de Nacimiento <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    id="birthdate"
                    value={recordState.birthdate}
                    placeholder="Seleccione una Fecha"
                    onChange={handleDateChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Departamento <span className="text-red-500">*</span>
                    </label>
                    <Select
                      options={departmentOptions}
                      value={recordState.department}
                      onChange={handleSelectChange("department")}
                      placeholder="Seleccione Departamento"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Provincia <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      value={recordState.province}
                      onChange={(e) =>
                        setRecordState((prev) => ({
                          ...prev,
                          province: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Ingrese Provincia"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Localidad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      value={recordState.locality}
                      onChange={(e) =>
                        setRecordState((prev) => ({
                          ...prev,
                          locality: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Ingrese Localidad"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      País
                    </label>
                    <input
                      type="text"
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      value={recordState.country}
                      onChange={(e) =>
                        setRecordState((prev) => ({
                          ...prev,
                          country: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="País"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nacionalidad
                    </label>
                    <input
                      type="text"
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      value={recordState.nationality}
                      onChange={(e) =>
                        setRecordState((prev) => ({
                          ...prev,
                          nationality: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Nacionalidad"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white min-h-[100px]"
                    rows={3}
                    value={recordState.observations}
                    onChange={(e) =>
                      setRecordState((prev) => ({
                        ...prev,
                        observations: e.target.value.toUpperCase(),
                      }))
                    }
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
              disabled={isLoading || !isValid}
            >
              {isLoading
                ? "Guardando..."
                : isEditing
                  ? "Actualizar"
                  : "Guardar Registro"}
            </button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
