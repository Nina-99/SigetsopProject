import { useState, useEffect } from "react";
import {
  GradesService,
  Personnel,
  PersonnelService,
  UnitsService,
} from "../../../services";
import { Button } from "..";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "./ModalComponents";
import { DatePicker, Input, Select } from "../../form";
import Swal from "sweetalert2";

interface PersonnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnelToEdit: Personnel | null;
  onSave: (personnel: Personnel) => void;
}

type PersonnelState = {
  gradeId: number | string;
  firstName: string;
  middleName: string;
  lastName: string;
  maternalName: string;
  identityCard: string;
  birthdate: string;
  genre: string;
  phone: string;
  joiningPolice: string;
  scale: string;
  insuredNumber: string;
  unitId: number | string;
  address: string;
  doorNumber: string;
  area: string;
  reference: string;
  referencePhone: string;
};

const initialState: PersonnelState = {
  gradeId: "",
  firstName: "",
  middleName: "",
  lastName: "",
  maternalName: "",
  identityCard: "",
  birthdate: "",
  genre: "",
  phone: "",
  joiningPolice: "",
  scale: "",
  insuredNumber: "",
  unitId: "",
  address: "",
  doorNumber: "",
  area: "",
  reference: "",
  referencePhone: "",
};

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

export default function PersonnelModal({
  isOpen,
  onClose,
  personnelToEdit,
  onSave,
}: PersonnelModalProps) {
  const [personnelState, setPersonnelState] =
    useState<PersonnelState>(initialState);

  // Opciones para los Selects
  const [gradeOptions, setGradeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [unitOptions, setUnitOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const isEditing = personnelToEdit !== null;
  const title = isEditing
    ? "Editar Personal Existente"
    : "Crear Nuevo Personal";

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPersonnelState(initialState);
      return;
    }

    if (isEditing && personnelToEdit) {
      setPersonnelState({
        gradeId: personnelToEdit.grade_data?.id || "",
        firstName: personnelToEdit.first_name || "",
        middleName: personnelToEdit.middle_name || "",
        lastName: personnelToEdit.last_name || "",
        maternalName: personnelToEdit.maternal_name || "",
        identityCard: personnelToEdit.identity_card || "",
        birthdate: personnelToEdit.birthdate || "",
        genre: personnelToEdit.genre || "",
        phone: personnelToEdit.phone || "",
        joiningPolice: personnelToEdit.joining_police || "",
        scale: personnelToEdit.scale || "",
        insuredNumber: personnelToEdit.insured_number || "",
        unitId: personnelToEdit.units_data?.id || "",
        address: personnelToEdit.address || "",
        doorNumber: personnelToEdit.door_number || "",
        area: personnelToEdit.area || "",
        reference: personnelToEdit.reference || "",
        referencePhone: personnelToEdit.reference_phone || "",
      });
    } else {
      setPersonnelState(initialState);
    }
  }, [isOpen, isEditing, personnelToEdit]);

  // 2. Cargar listas desplegables (Grades y Units)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchLists = async () => {
      try {
        const [gradesRes, unitsRes] = await Promise.all([
          GradesService.list(),
          UnitsService.list(),
        ]);
        const gradesData = gradesRes.data.results || gradesRes.data;
        const unitsData = unitsRes.data.results || unitsRes.data;

        const gradeOpts = gradesData.map((g: any) => ({
          value: g.id.toString(),
          label: g.grade_abbr,
        }));

        const unitOpts = unitsData.map((u: any) => ({
          value: u.id.toString(),
          label: u.name,
        }));

        setGradeOptions(gradeOpts);
        setUnitOptions(unitOpts);
      } catch (error) {
        console.error("Error cargando catalogos:", error);
      }
    };

    fetchLists();
  }, []);

  const handleChange = (fieldName: string) => (valueOrEvent: any) => {
    let newValue;

    if (valueOrEvent && valueOrEvent.target) {
      newValue = valueOrEvent.target.value;
    } else {
      newValue = valueOrEvent;
    }

    setPersonnelState((prevState) => ({
      ...prevState,
      [fieldName]: newValue,
    }));
  };

  const handleSelectChange =
    (field: keyof PersonnelState) => (value: string) => {
      setPersonnelState((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !personnelState.lastName.trim() ||
      !personnelState.firstName.trim() ||
      !personnelState.identityCard.trim() ||
      !personnelState.gradeId
    ) {
      Swal.fire({
        icon: "error",
        title: "Error al Editar:",
        text: "Los campos Grado, Nombre, Apellido Paterno y CI son obligatorios.",
      });
      return;
    }

    setIsLoading(true);

    const payload = {
      grade: Number(personnelState.gradeId),
      first_name: personnelState.firstName.trim(),
      middle_name: personnelState.middleName.trim(),
      last_name: personnelState.lastName.trim(),
      maternal_name: personnelState.maternalName.trim(),
      identity_card: personnelState.identityCard.trim(),
      birthdate: personnelState.birthdate || null,
      genre: personnelState.genre,
      phone: personnelState.phone.trim(),
      joining_police: personnelState.joiningPolice || null,
      scale: personnelState.scale.trim(),
      insured_number: personnelState.insuredNumber.trim(),
      current_destination: personnelState.unitId
        ? Number(personnelState.unitId)
        : null,
      address: personnelState.address.trim(),
      door_number: personnelState.doorNumber.trim(),
      area: personnelState.area.trim(),
      reference: personnelState.reference.trim(),
      reference_phone: personnelState.referencePhone.trim(),
    };

    try {
      console.log("Enviando payload:", payload);
      let response;

      if (isEditing && personnelToEdit) {
        response = await PersonnelService.update(personnelToEdit.id, payload);
      } else {
        response = await PersonnelService.create(payload);
      }

      onSave(response.data);
      onClose();
    } catch (error) {
      console.error(`Error al guardar:`, error);
      alert("Error al guardar el personal. Verifique la consola.");
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
                ? "Modifique los datos del personal."
                : "Ingrese los datos para el nuevo personal."}
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
          <ModalBody className="p-5 overflow-y-scroll max-h-[70vh]">
            <div className="space-y-6">
              {/* --- Datos Personales --- */}
              <fieldset className="border p-4 rounded-md space-y-4">
                <legend className="text-lg font-semibold dark:text-gray-200 px-2">
                  Datos Personales
                </legend>

                {/* Grado y CI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Grado <span className="text-red-500">*</span>
                    </label>
                    <Select
                      options={gradeOptions}
                      value={String(personnelState.gradeId)}
                      onChange={handleSelectChange("gradeId")}
                      placeholder="Seleccione Grado"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cédula de Identidad{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={personnelState.identityCard}
                      onChange={handleChange("identityCard")}
                      placeholder="Ej: 12345678"
                    />
                  </div>
                </div>

                {/* Nombres y Apellidos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Apellido Paterno <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={personnelState.lastName}
                      onChange={handleChange("lastName")}
                      placeholder="Ej: García"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Apellido Materno
                    </label>
                    <Input
                      type="text"
                      value={personnelState.maternalName}
                      onChange={handleChange("maternalName")}
                      placeholder="Ej: López"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Primer Nombre <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={personnelState.firstName}
                      onChange={handleChange("firstName")}
                      placeholder="Ej: Juan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Segundo Nombre
                    </label>
                    <Input
                      type="text"
                      value={personnelState.middleName}
                      onChange={handleChange("middleName")}
                      placeholder="Ej: Carlos"
                    />
                  </div>
                </div>

                {/* Fechas y Género */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha Nacimiento
                    </label>

                    <DatePicker
                      id="birthdate"
                      value={personnelState.birthdate}
                      placeholder="Seleccione una Fecha"
                      onChange={handleChange("birthdate")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha Ingreso
                    </label>
                    <DatePicker
                      id="joiningdate"
                      value={personnelState.joiningPolice}
                      placeholder="Seleccione una Fecha"
                      onChange={handleChange("joiningPolice")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Género
                    </label>
                    <Select
                      options={[
                        { value: "MASCULINO", label: "MASCULINO" },
                        { value: "FEMENINO", label: "FEMENINO" },
                        { value: "OTRO", label: "OTRO" },
                      ]}
                      value={personnelState.genre}
                      onChange={handleSelectChange("genre")}
                      placeholder="Seleccione"
                    />
                  </div>
                </div>

                {/* Unidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unidad Actual
                  </label>
                  <Select
                    options={unitOptions}
                    value={String(personnelState.unitId)}
                    onChange={handleSelectChange("unitId")}
                    placeholder="Seleccione Unidad"
                  />
                </div>

                {/* Info Adicional */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Teléfono
                    </label>
                    <Input
                      type="number"
                      value={personnelState.phone}
                      onChange={handleChange("phone")}
                      placeholder="Ej: 77777777"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Escalafón
                    </label>
                    <Input
                      type="text"
                      value={personnelState.scale}
                      onChange={handleChange("scale")}
                      placeholder="Ej: C-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      N° Asegurado
                    </label>
                    <Input
                      type="text"
                      value={personnelState.insuredNumber}
                      onChange={handleChange("insuredNumber")}
                      placeholder="Ej: 12345"
                    />
                  </div>
                </div>
              </fieldset>

              {/* --- Dirección y Referencia --- */}
              <fieldset className="border p-4 rounded-md space-y-4">
                <legend className="text-lg font-semibold dark:text-gray-200 px-2">
                  Dirección y Contacto
                </legend>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dirección Completa
                  </label>
                  <Input
                    type="text"
                    value={personnelState.address}
                    onChange={handleChange("address")}
                    placeholder="Ej: Av. Principal #123"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      N° Puerta
                    </label>
                    <Input
                      type="text"
                      value={personnelState.doorNumber}
                      onChange={handleChange("doorNumber")}
                      placeholder="Ej: 101"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Zona/Área
                    </label>
                    <Input
                      type="text"
                      value={personnelState.area}
                      onChange={handleChange("area")}
                      placeholder="Ej: Centro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre Referencia
                    </label>
                    <Input
                      type="text"
                      value={personnelState.reference}
                      onChange={handleChange("reference")}
                      placeholder="Ej: María Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Teléfono Referencia
                    </label>
                    <Input
                      type="number"
                      value={personnelState.referencePhone}
                      onChange={handleChange("referencePhone")}
                      placeholder="Ej: 60000000"
                    />
                  </div>
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
              disabled={
                isLoading ||
                !personnelState.lastName.trim() ||
                !personnelState.firstName.trim() ||
                !personnelState.identityCard.trim() ||
                !personnelState.gradeId
              }
            >
              {isLoading ? "Guardando..." : "Guardar Personal"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
