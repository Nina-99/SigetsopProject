import { useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../../../@core";
import { UsersService } from "../../../services/auth";
import { ImageCropper } from "../../afiliations";
import { Modal, ModalBody, ModalContent, ModalHeader, ModalFooter } from "./ModalComponents";

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfilePictureModal({
  isOpen,
  onClose,
}: ProfilePictureModalProps) {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCropConfirm = (points: number[][]) => {
    if (selectedImage && points.length >= 2) {
      // Simplified: assume points[0] is top-left, points[1] is bottom-right
      const [x, y] = points[0];
      const [x2, y2] = points[1];
      const width = x2 - x;
      const height = y2 - y;

      // Create canvas to crop
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, x, y, width, height, 0, 0, width, height);
        setCroppedImage(canvas.toDataURL("image/jpeg"));
      };
      img.src = selectedImage;
    }
  };

  const handleUpload = async () => {
    if (!croppedImage || !user) return;

    const formData = new FormData();
    // Convert base64 to blob
    const response = await fetch(croppedImage);
    const blob = await response.blob();
    formData.append("profile_picture", blob, "profile.jpg");

    try {
      Swal.fire({
        title: "Subiendo...",
        text: "Actualizando foto de perfil.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await UsersService.update(user.id, formData);
      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "Foto de perfil actualizada correctamente.",
        timer: 3000,
      });
      onClose();
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar la foto de perfil. Inténtalo de nuevo.",
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent className="max-w-[500px] w-full">
        <ModalHeader>
          Actualizar Foto de Perfil
        </ModalHeader>
        <ModalBody>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="mb-4"
          />
          {selectedImage && !croppedImage && (
            <ImageCropper src={selectedImage} onConfirm={handleCropConfirm} />
          )}
          {croppedImage && (
            <div className="mb-4">
              <img
                src={croppedImage}
                alt="Cropped"
                className="w-32 h-32 rounded-full mx-auto"
              />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            className="px-4 py-2 bg-blue-500 text-white rounded"
            disabled={!croppedImage}
          >
            Subir
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

