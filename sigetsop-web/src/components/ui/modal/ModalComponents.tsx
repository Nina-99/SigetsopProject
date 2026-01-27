import React, { useEffect, useRef } from "react";

// ===============================================
// 1. MODAL (Componente principal que gestiona la visibilidad y el fondo)
// ===============================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Efecto para cerrar el modal al presionar la tecla ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Evitar el scroll del cuerpo de la página cuando el modal está abierto
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  // Maneja el clic en el fondo oscuro para cerrar el modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && e.target === modalRef.current) {
      onClose();
    }
  };

  return (
    // Fondo oscuro (Backdrop)
    <div
      ref={modalRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 transition-opacity duration-300 dark:bg-black/70"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      {/* Contenedor del contenido del Modal */}
      {children}
    </div>
  );
}

// ===============================================
// 2. MODAL CONTENT (El contenedor central del diálogo)
// ===============================================

interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  // Permite pasar clases para controlar el ancho (ej: 'max-w-lg')
  className?: string;
}

export function ModalContent({
  children,
  className = "",
  ...props
}: ModalContentProps) {
  return (
    <div
      className={`
                relative flex w-full flex-col rounded-xl 
                border border-gray-200 bg-white 
                shadow-2xl transition-all duration-100 ease-out 
                transform opacity-200 scale-100
                dark:border-white dark:bg-gray-900
                ${className}
            `}
      // Previene que los clics dentro del contenido cierren el modal
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
}

// ===============================================
// 3. MODAL HEADER (Título y Subtítulo)
// ===============================================

interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function ModalHeader({
  children,
  className = "",
  ...props
}: ModalHeaderProps) {
  // Nota: El botón de cerrar se suele incluir aquí, pero en el UnitModal lo pusimos dentro del 'children'
  return (
    <div
      className={`flex items-center justify-between p-5 border-b border-gray-200 dark:border-white/[0.05] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ===============================================
// 4. MODAL BODY (Contenido principal y scroll)
// ===============================================

interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function ModalBody({
  children,
  className = "",
  ...props
}: ModalBodyProps) {
  return (
    // Aplica padding, permite scroll y establece una altura máxima (si es necesario)
    <div className={`p-5 overflow-y-auto ${className}`} {...props}>
      {children}
    </div>
  );
}

// ===============================================
// 5. MODAL FOOTER (Botones de acción)
// ===============================================

interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({
  children,
  className = "",
  ...props
}: ModalFooterProps) {
  return (
    <div
      className={`flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-white/[0.05] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
