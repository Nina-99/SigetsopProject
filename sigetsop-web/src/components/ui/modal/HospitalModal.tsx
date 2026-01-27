import { useState, useEffect } from "react";
import { Hospital, HospitalService } from "../../../services";

import { Button } from "..";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "./ModalComponents";
import { Input } from "../../form";

interface HospitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalToEdit: Hospital | null;
  onSave: (hospital: Hospital) => void;
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

export default function HospitalModal({
  isOpen,
  onClose,
  hospitalToEdit,
  onSave,
}: HospitalModalProps) {
  const isEditing = hospitalToEdit !== null;
  const title = isEditing
    ? "Editar Hospital Existente"
    : "Crear Nuevo Hospital";

  const [hospitalName, setHospitalName] = useState("");
  const [hospitalPhone, setHospitalPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditing && hospitalToEdit) {
      setHospitalName(hospitalToEdit.name || "");
      setHospitalPhone(hospitalToEdit.phone || "");
    } else {
      setHospitalName("");
      setHospitalPhone("");
    }
  }, [hospitalToEdit, isEditing, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName.trim()) return;

    setIsLoading(true);

    const payload: Hospital = {
      id: isEditing ? hospitalToEdit!.id : Date.now(),
      name: hospitalName.trim(),
      phone: hospitalPhone.trim(),
    };

    console.log("response ", payload);
    try {
      let response;
      if (isEditing) {
        response = await HospitalService.update(hospitalToEdit!.id, payload);
      } else {
        response = await HospitalService.create(payload);
      }
      console.log(
        `Guardando ${isEditing ? "edición" : "nuevo hospital"}...`,
        payload,
      );
      // await new Promise((resolve) => setTimeout(resolve, 800)); // Simulación de retraso de API

      onSave(response?.data);
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
                ? "Modifique el nombre u otros datos del hospital."
                : "Ingrese los datos para la nuevo hospital."}
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
                  htmlFor="hospitalName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Nombre del Hospital <span className="text-red-500">*</span>
                </label>
                <Input
                  id="hospitalName"
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="Ej: Hospital 10 Febrero"
                />
              </div>
              <div>
                <label
                  htmlFor="hospitalPhone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Celular del Hospital <span className="text-red-500">*</span>
                </label>
                <Input
                  id="hospitalPhone"
                  type="text"
                  value={hospitalPhone}
                  onChange={(e) => setHospitalPhone(e.target.value)}
                  placeholder="76267263"
                />
              </div>
              {/* Texto de ayuda general, similar al 'New to Ethereum wallets?' */}
              <div className="pt-4">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  Asegúrese de que el nombre del hospital sea único y preciso
                  para el registro.
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
              // Asumiendo que 'primary' es tu variante principal/marca (brand-500)
              variant="primary"
              // Asumiendo que tu Button acepta 'isLoading' y maneja la deshabilitación/spinner
              isLoading={isLoading}
              disabled={isLoading || !hospitalName.trim()}
            >
              {isLoading ? "Guardando..." : "Guardar Unidad"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
