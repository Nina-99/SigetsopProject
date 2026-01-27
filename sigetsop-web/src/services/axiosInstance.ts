import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000, // 10 segundos de timeout
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor de respuesta para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      // Error de red (sin conexión al servidor)
      if (error.code === "ERR_NETWORK" || !error.response) {
        throw new Error("No se puede conectar al servidor. Verifica tu conexión a internet.");
      }

      // Timeout
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        throw new Error("Tiempo de espera agotado. Intente nuevamente.");
      }

      // Manejo específico por código de estado HTTP
      switch (error.response?.status) {
        case 400:
          // Error de validación
          const detail = error.response.data?.detail;
          if (detail) {
            throw new Error(detail);
          }
          throw new Error("Datos inválidos. Por favor verifica la información.");

        case 401:
          // Error de autenticación
          const authDetail = error.response.data?.detail;
          if (authDetail?.includes("desactivado")) {
            throw new Error("Usuario desactivado. Contacta al administrador.");
          } else if (authDetail?.includes("No active account")) {
            throw new Error("Usuario no encontrado o contraseña incorrecta.");
          } else if (authDetail?.includes("credenciales")) {
            throw new Error("Credenciales incorrectas. Por favor verifica tu usuario y contraseña.");
          } else if (authDetail?.includes("token")) {
            throw new Error("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
          } else if (authDetail) {
            throw new Error(authDetail);
          }
          throw new Error("Error de autenticación. Por favor inicia sesión nuevamente.");

        case 403:
          throw new Error("No tienes permisos para realizar esta acción.");

        case 404:
          throw new Error("Recurso no encontrado.");

        case 429:
          throw new Error("Demasiadas solicitudes. Por favor espera un momento.");

        case 500:
          // Error interno del servidor
          const serverDetail = error.response.data?.detail;
          if (serverDetail?.includes("base de datos") || serverDetail?.includes("database")) {
            throw new Error("Error de conexión con la base de datos. Intente nuevamente.");
          } else if (serverDetail?.includes("timeout")) {
            throw new Error("Tiempo de espera agotado en el servidor. Intente nuevamente.");
          } else if (serverDetail) {
            throw new Error(serverDetail);
          }
          throw new Error("Error interno del servidor. Intente nuevamente más tarde.");

        case 502:
        case 503:
        case 504:
          throw new Error("Servidor no disponible. Intente nuevamente más tarde.");

        default:
          throw new Error("Error desconocido. Intente nuevamente.");
      }
    }

    // Error no relacionado con Axios
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Error desconocido. Intente nuevamente.");
  }
);

export default api;
