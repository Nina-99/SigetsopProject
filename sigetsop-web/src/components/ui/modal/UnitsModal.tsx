import { useState, useEffect } from "react";
import { Units, UnitsService, PersonnelService } from "../../../services";
import { Button } from "..";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "./ModalComponents";
import { AutocompleteSelect, Input } from "../../form";

interface LocalPersonnel {
  id: number;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  maternal_name?: string;
  grade_data?: { grade_abbr: string };
}

interface UnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitToEdit: Units | null;
  onSave: (unit: Units) => void;
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

export default function UnitModal({
  isOpen,
  onClose,
  unitToEdit,
  onSave,
}: UnitModalProps) {
  const isEditing = unitToEdit !== null;
  const title = isEditing ? "Editar Unidad Existente" : "Crear Nueva Unidad";

  const [unitName, setUnitName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assistant, setAssistant] = useState<LocalPersonnel | null>(null);
  const [commander, setCommander] = useState<LocalPersonnel | null>(null);

  useEffect(() => {
    if (isEditing && unitToEdit) {
      setUnitName(unitToEdit.name || "");
      setAssistant(
        unitToEdit.assistant_data && unitToEdit.assistant_data.length > 0
          ? unitToEdit.assistant_data[0]
          : null,
      );
      setCommander(unitToEdit.commander_data || null);
    } else {
      setUnitName("");
      setAssistant(null);
      setCommander(null);
    }
  }, [unitToEdit, isEditing, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim()) return;

    setIsLoading(true);
    const payload = {
      name: unitName.trim(),
      commander: commander?.id ?? null,
      assistant: assistant ? [assistant.id] : [],
    };

    try {
      let response;
      if (isEditing) {
        response = await UnitsService.update(unitToEdit!.id, payload);
      } else {
        response = await UnitsService.create(payload);
      }
      onSave(response.data);
      onClose();
    } catch (error: any) {
      console.error("Error al guardar la unidad:", error);
      alert("Error al guardar la unidad. Revise la consola para más detalles.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
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
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.05] transition"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody className="p-5 overflow-y-scroll max-h-[70vh] space-y-4">
            {/* Nombre de la unidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre de la Unidad <span className="text-red-500">*</span>
              </label>
              <Input
                id="unitName"
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="Ej: Patrulla Motorizada 101"
              />
            </div>

            {/* Autocomplete para Auxiliar */}
            <AutocompleteSelect
              label="Seleccionar Auxiliar"
              value={assistant}
              onChange={(p) => setAssistant(p)}
              fetchResults={async (query) => {
                try {
                  const res = await PersonnelService.search(query);
                  const data = res.data?.results ?? [];
                  return Array.isArray(data) ? data : [];
                } catch (err) {
                  console.error("Error buscando Auxiliar:", err);
                  return [];
                }
              }}
            />

            <AutocompleteSelect
              label="Seleccionar Comandante"
              value={commander}
              onChange={(p) => setCommander(p)}
              fetchResults={async (query) => {
                try {
                  const res = await PersonnelService.search(query);
                  const data = res.data?.results ?? [];
                  return Array.isArray(data) ? data : [];
                } catch (err) {
                  console.error("Error buscando Comandante:", err);
                  return [];
                }
              }}
            />

            <div className="pt-4">
              <p className="text-xs text-gray-400 dark:text-gray-600">
                Asegúrese de que el nombre de la unidad sea único y preciso para
                el registro.
              </p>
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
              disabled={isLoading || !unitName.trim()}
            >
              {isLoading ? "Guardando..." : "Guardar Unidad"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
