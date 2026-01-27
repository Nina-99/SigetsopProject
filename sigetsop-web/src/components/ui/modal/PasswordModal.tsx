import { useState, useEffect } from "react";
import { Button } from "..";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "./ModalComponents";
import { Input, Label } from "../../form";
import { useAuth } from "../../../@core";
import { UsersService } from "../../../services/auth";
import { EyeCloseIcon, EyeIcon } from "../../../icons";

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  usersToEdit: { id: string; username: string } | null;
  onSave: () => void;
}

interface PasswordState {
  password: string;
  confirmPassword: string;
}

const initialPasswordState: PasswordState = {
  password: "",
  confirmPassword: "",
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

export default function PasswordModal({
  isOpen,
  onClose,
  usersToEdit,
  onSave,
}: PasswordModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordState, setPasswordState] =
    useState<PasswordState>(initialPasswordState);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      setPasswordState(initialPasswordState);
    }
  }, [isOpen]);

  const handleChange = (field: keyof PasswordState) => (e: any) => {
    setPasswordState((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validate = () => {
    const { password, confirmPassword } = passwordState;
    if (!password || password.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres.");
      return false;
    }
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!user?.id) {
      alert("No se encontró el usuario para actualizar la contraseña.");
      return;
    }

    setIsLoading(true);

    try {
      await UsersService.update(user?.id, {
        password: passwordState.password,
      });
      alert("Contraseña actualizada correctamente.");
      onSave();
      onClose();
    } catch (error: any) {
      console.error("Error al actualizar contraseña:", error);
      const serverError = error.response?.data;
      const firstKey = serverError ? Object.keys(serverError)[0] : null;
      alert(
        "Error al actualizar: " +
          (firstKey ? `${firstKey}: ${serverError[firstKey]}` : "Desconocido."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent className="max-w-md w-full">
        <ModalHeader className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold">Actualizar Contraseña</h3>
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody className="p-5">
            <div className="space-y-4">
              <div>
                <Label>Nueva Contraseña *</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={passwordState.password}
                  onChange={handleChange("password")}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30  cursor-pointer right-1/3 top-1/2"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  )}
                </span>
              </div>

              <div>
                <Label>Confirmar Contraseña *</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={passwordState.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  placeholder="Repite la contraseña"
                  required
                />
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="flex justify-end gap-3 p-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
