import { useState, useEffect } from "react";
import { FilePersonnel, FilePersonnelService } from "../../../services"; // Asume que esta es tu interfaz de datos

// Ajusta estas importaciones a la ubicación real de tus componentes UI
import { Button } from "..";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "./ModalComponents";
import { Input, TextArea } from "../../form";

interface FileModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileToEdit: FilePersonnel | null;
  onSave: (file: FilePersonnel) => void;
}

interface LocalPersonnel {
  id: number;
  last_name: string;
  maternal_name: string;
  first_name: string;
  middle_name: string;
  grade_data?: { grade_abbr: string } | null;
  units_data?: { name: string } | null;
  phone: string;
}

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    className="h-5 w-5"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const getFullName = (personnel: LocalPersonnel | null): string => {
  if (!personnel) return "Personal No Asignado";
  const { last_name, maternal_name, first_name, middle_name } = personnel;
  return `${last_name} ${maternal_name}, ${first_name} ${middle_name || ""}`.trim();
};

export default function FileModal({
  isOpen,
  onClose,
  fileToEdit,
  onSave,
}: FileModalProps) {
  const isEditing = fileToEdit !== null;
  const title = isEditing ? "Editar Unidad Existente" : "Crear Nueva Unidad";

  // Estado local del formulario
  const [documentsHas, setDocumentsHas] = useState("");
  const [observation, setObservation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [personnel, setPersonnel] = useState<LocalPersonnel | null>(null);

  useEffect(() => {
    if (isEditing && fileToEdit) {
      setPersonnel(fileToEdit.personnel_data || null);
      setDocumentsHas(fileToEdit.documents_has || "");
      setObservation(fileToEdit.observation || "");
    } else {
      setPersonnel(null);
      setDocumentsHas("");
      setObservation("");
    }
  }, [fileToEdit, isEditing, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personnel?.id) return;

    setIsLoading(true);

    const payload = {
      personnel: personnel?.id ?? null,
      documents_has: documentsHas.trim(),
      observation: observation.trim(),
    };

    try {
      let response;

      if (isEditing) {
        response = await FilePersonnelService.update(fileToEdit!.id, payload);
      }

      console.log("response ", response.data);
      onSave(response.data);
      onClose();
    } catch (error) {
      console.error(`Error al guardar la unidad:`, error);
      alert("Error al guardar la unidad.");
    } finally {
      setIsLoading(false);
    }
  };

  // Si el modal está cerrado, no renderizar nada para optimizar
  if (!isOpen) return null;
  const fullName = getFullName(personnel);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* El Dialog de Material Tailwind tenía una clase 'size="xs"', aquí simularíamos un contenedor pequeño */}
      <ModalContent className="max-w-md w-full">
        <ModalHeader className="flex justify-between items-center p-4 border-b dark:border-white/[0.05]">
          <div>
            <h3 className="text-xl font-semibold text-blue-gray dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isEditing
                ? "Modifique el nombre u otros datos de la unidad."
                : "Ingrese los datos para la nueva unidad."}
            </p>
          </div>
          {/* Botón de Cerrar */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.05] transition"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody className="p-5 overflow-y-scroll max-h-[70vh]">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="fileName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Nombre
                </label>
                <Input
                  className="cursor-not-allowed"
                  id="fileName"
                  type="text"
                  disabled
                  value={fullName}
                />
              </div>
              <div>
                <label
                  htmlFor="fileName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Documetos presentados <span className="text-red-500">*</span>
                </label>
                <TextArea
                  id="documents_has"
                  type="text"
                  value={documentsHas}
                  onChange={setDocumentsHas}
                  placeholder="Ej: Memorandum, riesgo profesional"
                  rows={5}
                />
              </div>
              <div>
                <label
                  htmlFor="fileName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Obeservaciones <span className="text-red-500">*</span>
                </label>
                <TextArea
                  id="observation"
                  type="text"
                  value={observation}
                  onChange={setObservation}
                  placeholder="Ej: No cuenta con memorandum de destino"
                  rows={5}
                />
              </div>
              <div className="pt-4">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  Asegúrese de detallar los documentos presentados por el
                  personal
                </p>
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="flex justify-end gap-3 p-4 border-t dark:border-white/[0.05]">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={isLoading || !personnel?.id}
            >
              {isLoading ? "Guardando..." : "Guardar File"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
