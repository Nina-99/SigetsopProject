import { useState, useEffect } from "react";
import { Grade } from "../../../services";

import { Button } from "..";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "./ModalComponents";
import { Input } from "../../form";

interface GradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradeToEdit: Grade | null;
  onSave: (grade: Grade) => void;
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

export default function GradeModal({
  isOpen,
  onClose,
  gradeToEdit,
  onSave,
}: GradeModalProps) {
  const isEditing = gradeToEdit !== null;
  const title = isEditing ? "Editar Grado Existente" : "Crear Nuevo Grado";

  // Estado local del formulario
  const [gradeName, setGradeName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Podrías añadir más estados aquí para Auxiliar, Comandante, etc.

  // 🔄 Llenar el formulario si estamos editando
  useEffect(() => {
    if (isEditing && gradeToEdit) {
      setGradeName(gradeToEdit.name || "");
      // Llenar otros campos
    } else {
      // Limpiar al abrir en modo Creación
      setGradeName("");
    }
  }, [gradeToEdit, isEditing, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeName.trim()) return;

    setIsLoading(true);

    const savedGradeData: Grade = {
      id: isEditing ? gradeToEdit!.id : Date.now(),
      name: gradeName.trim(),
      // Simulación de que los datos de Auxiliar/Comandante no se modifican aquí
      // assistant_data: gradeToEdit?.assistant_data || [],
      // commander_data: gradeToEdit?.commander_data || null,
    };

    try {
      // **Aquí iría la llamada a Axios para Crear o Editar**
      // if (isEditing) { await axios.put(...) } else { await axios.post(...) }

      console.log(
        `Guardando ${isEditing ? "edición" : "nueva unidad"}...`,
        savedGradeData,
      );
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulación de retraso de API

      onSave(savedGradeData);
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
                  htmlFor="gradeName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Nombre de la Unidad <span className="text-red-500">*</span>
                </label>
                <Input
                  id="gradeName"
                  type="text"
                  value={gradeName}
                  onChange={(e) => setGradeName(e.target.value)}
                  placeholder="Ej: Patrulla Motorizada 101"
                  // required
                  // Asume que tu componente Input maneja el estado visual de focus y hover
                />
              </div>
              {/* --- Aquí se agregarían más campos para Auxiliar y Comandante --- */}

              {/* <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Asignación de Personal</h4>
                                // Componentes Select para Auxiliar y Comandante
                            </div> */}

              {/* Texto de ayuda general, similar al 'New to Ethereum wallets?' */}
              <div className="pt-4">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  Asegúrese de que el nombre de la unidad sea único y preciso
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
              disabled={isLoading || !gradeName.trim()}
            >
              {isLoading ? "Guardando..." : "Guardar Unidad"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
