import Swal from "sweetalert2";

// Configuración global de SweetAlert
const defaultConfig = {
  confirmButtonColor: "#84cc16", // lime-500
  cancelButtonColor: "#ef4444", // red-500
  backdrop: true,
  allowOutsideClick: false,
};

// Mensajes de autenticación
export const showLoginLoading = () => {
  return Swal.fire({
    title: "Iniciando sesión...",
    text: "Por favor espera",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

export const showLoginSuccess = () => {
  return Swal.fire({
    icon: "success",
    title: "¡Bienvenido!",
    text: "Sesión iniciada correctamente",
    timer: 2000,
    showConfirmButton: false,
    ...defaultConfig,
  });
};

export const showLoginError = (message: string) => {
  return Swal.fire({
    icon: "error",
    title: "Error al iniciar sesión",
    text: message,
    ...defaultConfig,
  });
};

export const showConnectionError = () => {
  return Swal.fire({
    icon: "warning",
    title: "Sin conexión",
    text: "No se puede conectar al servidor. Verifica tu conexión a internet.",
    ...defaultConfig,
  });
};

export const showServerError = () => {
  return Swal.fire({
    icon: "error",
    title: "Error del servidor",
    text: "Ocurrió un error en el servidor. Intente nuevamente más tarde.",
    ...defaultConfig,
  });
};

export const showDatabaseError = () => {
  return Swal.fire({
    icon: "error",
    title: "Error de base de datos",
    text: "Error de conexión con la base de datos. Intente nuevamente.",
    ...defaultConfig,
  });
};

export const showUserInactiveError = () => {
  return Swal.fire({
    icon: "warning",
    title: "Usuario desactivado",
    text: "Tu cuenta ha sido desactivada. Contacta al administrador.",
    ...defaultConfig,
  });
};

export const showTimeoutError = () => {
  return Swal.fire({
    icon: "warning",
    title: "Tiempo agotado",
    text: "El servidor tardó demasiado en responder. Intente nuevamente.",
    ...defaultConfig,
  });
};

// Mensajes de registro
export const showRegisterLoading = () => {
  return Swal.fire({
    title: "Creando cuenta...",
    text: "Por favor espera",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

export const showRegisterSuccess = () => {
  return Swal.fire({
    icon: "success",
    title: "¡Cuenta creada!",
    text: "Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.",
    timer: 3000,
    showConfirmButton: false,
    ...defaultConfig,
  });
};

export const showRegisterError = (message: string) => {
  return Swal.fire({
    icon: "error",
    title: "Error al crear cuenta",
    text: message,
    ...defaultConfig,
  });
};

// Mensajes de validación de formulario
export const showValidationError = (message: string) => {
  return Swal.fire({
    icon: "info",
    title: "Validación",
    text: message,
    ...defaultConfig,
  });
};

export const showEmptyFieldsError = () => {
  return Swal.fire({
    icon: "info",
    title: "Campos requeridos",
    text: "Por favor completa todos los campos obligatorios.",
    ...defaultConfig,
  });
};

// Mensajes de logout
export const showLogoutSuccess = () => {
  return Swal.fire({
    icon: "success",
    title: "Sesión cerrada",
    text: "Has cerrado sesión correctamente.",
    timer: 2000,
    showConfirmButton: false,
    ...defaultConfig,
  });
};

// Mensajes genéricos
export const showGenericError = (message: string) => {
  return Swal.fire({
    icon: "error",
    title: "Error",
    text: message,
    ...defaultConfig,
  });
};

export const showGenericSuccess = (title: string, message?: string) => {
  return Swal.fire({
    icon: "success",
    title: title,
    text: message,
    timer: 2000,
    showConfirmButton: false,
    ...defaultConfig,
  });
};

// Cerrar SweetAlert activo
export const closeSwal = () => {
  Swal.close();
};