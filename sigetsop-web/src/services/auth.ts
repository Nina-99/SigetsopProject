import api from "./axiosInstance";

let BASE_URL = "";

// export const UsersService = {
//   list() {
//     return api.get("/users/");
//   },
//
//   create(data: any) {
//     return api.post("/users/", data);
//   },
//
//   update(id: number, data: any) {
//     return api.patch(`/users/${id}/`, data);
//   },
//
//   delete(id: number) {
//     console.log("id ", id);
//     return api.delete(`/users/${id}/`);
//   },
//   search(query: any) {
//     return api.get(`${BASE_URL}search/?q=${query}`);
//   },
//
//   getTotalCount() {
//     return api.get<PersonnelCountResponse>(`${BASE_URL}?limit=1`);
//   },
//
//   listRole() {
//     return api.get("/roles/");
//   },
// };

export interface Role {
  id: number;
  name: string;
}

export interface Users {
  id: number;
  first_name: string;
  last_name: string;
  maternal_name: string;
  username: string;
  phone: number;
  email: string;
  password: string;
  profile_picture?: string | null;
  role: number | null;
  role_data?: Role | null;
  is_active: boolean;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  maternal_name: string;
  username: string;
  phone: number;
  email: string;
  password: string;
  role: number;
  is_active: boolean;
}

export interface AuthTokenResponse {
  access: string;
  refresh: string;
}

export const auth = async (username: string, password: string) => {
  BASE_URL = "token/";
  
  // Validación de entrada
  if (!username.trim() || !password.trim()) {
    throw new Error("El usuario y la contraseña son obligatorios.");
  }

  try {
    const res = await api.post<AuthTokenResponse>(`${BASE_URL}`, {
      username: username.trim(),
      password: password.trim(),
    });

    // Validar respuesta
    if (!res.data || !res.data.access || !res.data.refresh) {
      throw new Error("Respuesta del servidor inválida. No se recibieron los tokens de acceso.");
    }

    return res.data;
  } catch (error) {
    // El interceptor de axiosInstance ya maneja los errores específicos
    // Solo propagamos el error para que el componente lo maneje con SweetAlert
    throw error;
  }
};

export const authRegister = async (data: RegisterData) => {
  BASE_URL = "register/";
  
  // Validación de entrada
  if (!data.first_name?.trim() || !data.last_name?.trim() || 
      !data.maternal_name?.trim() || !data.username?.trim() || 
      !data.email?.trim() || !data.password?.trim()) {
    throw new Error("Todos los campos obligatorios deben estar completos.");
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new Error("El formato del correo electrónico no es válido.");
  }

  // Validar longitud de contraseña
  if (data.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  // Validar teléfono
  if (!data.phone || data.phone.toString().trim() === "") {
    throw new Error("El número de teléfono es obligatorio.");
  }

  try {
    const res = await api.post(`${BASE_URL}`, {
      ...data,
      username: data.username.trim(),
      email: data.email.trim(),
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      maternal_name: data.maternal_name.trim(),
    });

    return res.data;
  } catch (error) {
    // El interceptor de axiosInstance ya maneja los errores específicos
    // Solo propagamos el error para que el componente lo maneje con SweetAlert
    throw error;
  }
};

export const UsersService = {
  list(params?: any) {
    return api.get("/users/", { params });
  },
  create(data: any) {
    return api.post("/users/", data);
  },
  update(id: number, data: any) {
    return api.put(`/users/${id}/`, data);
  },
  delete(id: number) {
    return api.delete(`/users/${id}/`);
  },
  exportCSV(params?: any) {
    return api.get("/users/export/csv/", { params, responseType: "blob" });
  },
  exportPDF(params?: any) {
    return api.get("/users/export/pdf/", { params, responseType: "blob" });
  },
  exportAllJSON(params?: any) {
    return api.get("/users/export/all/", { params });
  },
};

export default auth;

// import axios from "axios";
//
// const BASE_URL = import.meta.env.VITE_API_URL;
//
// export interface RegisterData {
//   first_name: string;
//   last_name: string;
//   maternal_name: string;
//   username: string;
//   phone: number;
//   email: string;
//   password: string;
//   role: number;
//   is_active: boolean;
// }
//
// export interface AuthTokenResponse {
//   access: string;
//   refresh: string;
// }
//
// export const auth = async (username: string, password: string) => {
//   try {
//     const res = await axios.post<AuthTokenResponse>(`${BASE_URL}/token/`, {
//       username,
//       password,
//     });
//
//     return res.data;
//   } catch (error) {
//     if (axios.isAxiosError(error) && error.response?.status === 401) {
//       throw new Error(
//         "Credenciales inválidas. Por favor, revise su nombre de usuario y contraseña.",
//       );
//     }
//     throw error;
//   }
// };
//
// export const authRegister = async (data: RegisterData) => {
//   try {
//     console.log("data: ", data);
//     const res = await axios.post(`${BASE_URL}/register/`, data);
//
//     return res.data;
//   } catch (error: any) {
//     console.log("Error de registro: ", error.response?.data);
//     throw error.response?.data || { error: "Error en el registro" };
//   }
// };
// export default auth;
