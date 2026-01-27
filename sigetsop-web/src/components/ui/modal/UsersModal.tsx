import { useState, useEffect, useCallback } from "react";
import { Button } from "..";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "./ModalComponents";
import { Input, Select } from "../../form";
import { Users, UsersService } from "../../../services/auth";

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  usersToEdit: Users | null;
  onSave: (personnel: Users) => void;
}

type UsersState = {
  firstName: string;
  lastName: string;
  maternalName: string;
  username: string;
  phone: string;
  email: string;
  roleId: number | string;
};

const initialState: UsersState = {
  firstName: "",
  lastName: "",
  maternalName: "",
  username: "",
  phone: "",
  email: "",
  roleId: "",
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

export default function UsersModal({
  isOpen,
  onClose,
  usersToEdit,
  onSave,
}: UsersModalProps) {
  const [usersState, setUsersState] = useState<UsersState>(initialState);
  const [rolesOptions, setRolesOptions] = useState<
    { value: number | string; label: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = usersToEdit !== null;
  const title = isEditing
    ? "Editar Personal Existente"
    : "Crear Nuevo Personal";

  const fetchRoles = useCallback(async () => {
    try {
      const rolesRes = await UsersService.listRole();
      const rawData = rolesRes.data.results || rolesRes.data;

      if (!Array.isArray(rawData)) {
        console.error("El servicio de roles no devolvió un array", rawData);
        return;
      }

      const rolesOpts = rawData.map((r: any, index: number) => {
        const safeId = r?.id ?? `fallback-${index}`;
        const normalizedId =
          typeof safeId === "number" || !isNaN(Number(safeId))
            ? Number(safeId)
            : String(safeId);

        return {
          value: normalizedId,
          label: r?.name || "Sin nombre",
        };
      });

      setRolesOptions(rolesOpts);
    } catch (error) {
      console.error("Error cargando roles:", error);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (!isOpen) {
      setUsersState(initialState);
      return;
    }

    if (isEditing && usersToEdit) {
      setUsersState({
        firstName: usersToEdit.first_name || "",
        lastName: usersToEdit.last_name || "",
        maternalName: usersToEdit.maternal_name || "",
        username: usersToEdit.username || "",
        phone: String(usersToEdit.phone || ""),
        email: usersToEdit.email || "",
        roleId: "",
      });
    } else {
      setUsersState(initialState);
    }
  }, [isOpen, isEditing, usersToEdit]);

  useEffect(() => {
    if (!isEditing || !usersToEdit || rolesOptions.length === 0) return;

    const incomingRoleId = usersToEdit.role_data?.id ?? usersToEdit.role ?? "";

    if (incomingRoleId !== "") {
      const normalized =
        typeof incomingRoleId === "number" || !isNaN(Number(incomingRoleId))
          ? Number(incomingRoleId)
          : String(incomingRoleId);

      setUsersState((prev) => ({
        ...prev,
        roleId: normalized,
      }));
    }
  }, [rolesOptions, isEditing, usersToEdit]);

  const handleChange = (fieldName: string) => (valueOrEvent: any) => {
    const newValue = valueOrEvent?.target?.value ?? valueOrEvent ?? "";
    setUsersState((p) => ({ ...p, [fieldName]: newValue }));
  };

  const handleSelectChange = (field: keyof UsersState) => (value: any) => {
    console.log("Select onChange raw:", value);

    let extracted;
    if (value && typeof value === "object" && "value" in value) {
      extracted = value.value;
    } else {
      extracted = value;
    }

    setUsersState((prev) => ({ ...prev, [field]: extracted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !usersState.lastName.trim() ||
      !usersState.firstName.trim() ||
      !usersState.roleId
    ) {
      alert("Los campos Nombre, Apellido Paterno y Rol son obligatorios.");
      return;
    }

    setIsLoading(true);

    let roleForPayload: number | null = null;
    const rawRole = usersState.roleId;

    const candidate = typeof rawRole === "number" ? rawRole : Number(rawRole);

    if (!isNaN(candidate) && candidate > 0) {
      roleForPayload = candidate;
    }

    const payload = {
      first_name: usersState.firstName.trim(),
      last_name: usersState.lastName.trim(),
      maternal_name: usersState.maternalName.trim(),
      username: usersState.username.trim(),
      phone: usersState.phone.trim(),
      email: usersState.email.trim(),
      role: roleForPayload,
    };

    try {
      let response;

      if (isEditing && usersToEdit) {
        response = await UsersService.update(usersToEdit.id, payload);
      } else {
        response = await UsersService.create(payload);
      }

      onSave(response.data);
      onClose();
    } catch (error: any) {
      console.error("Error al guardar:", error);

      const serverError = error.response?.data;
      const firstKey = serverError ? Object.keys(serverError)[0] : null;

      alert(
        "Error de validación: " +
          (firstKey ? `${firstKey}: ${serverError[firstKey]}` : "Desconocido."),
      );
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
              <fieldset className="border p-4 rounded-md space-y-4">
                <legend className="text-lg font-semibold dark:text-gray-200 px-2">
                  Datos Personales
                </legend>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">
                      Apellido Paterno *
                    </label>
                    <Input
                      type="text"
                      value={usersState.lastName}
                      onChange={handleChange("lastName")}
                      disabled={isEditing}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Apellido Materno
                    </label>
                    <Input
                      type="text"
                      value={usersState.maternalName}
                      onChange={handleChange("maternalName")}
                      disabled={isEditing}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Primer Nombre *
                    </label>
                    <Input
                      type="text"
                      value={usersState.firstName}
                      onChange={handleChange("firstName")}
                      disabled={isEditing}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Correo Electrónico
                    </label>
                    <Input
                      type="text"
                      value={usersState.email}
                      onChange={handleChange("email")}
                      disabled={isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium">
                      Username
                    </label>
                    <Input
                      type="text"
                      value={usersState.username}
                      onChange={handleChange("username")}
                      disabled={isEditing}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Celular</label>
                    <Input
                      type="text"
                      value={usersState.phone}
                      onChange={handleChange("phone")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Rol *</label>
                    <Select
                      options={rolesOptions}
                      value={usersState.roleId}
                      onChange={handleSelectChange("roleId")}
                      placeholder="Seleccione un Rol"
                    />
                  </div>
                </div>
              </fieldset>

              <div className="pt-2 border-t">
                <p className="text-xs text-gray-400">
                  Campos con * son obligatorios.
                </p>
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="flex justify-end gap-3 p-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={
                isLoading ||
                !usersState.lastName.trim() ||
                !usersState.firstName.trim() ||
                !usersState.roleId
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
