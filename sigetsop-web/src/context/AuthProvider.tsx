import { ReactNode, useCallback, useEffect, useState, useMemo } from "react";
import { AuthContext } from "./AuthContext";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { AuthTokenResponse } from "../services/auth";

const BASE_API_URL = import.meta.env.VITE_API_URL;
const INACTIVITY_LIMIT_MS = 600_000;
const REFRESH_THRESHOLD_SECONDS = 30;

const authAxios = axios.create({ baseURL: BASE_API_URL });

interface UserPayload {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  maternal_name: string;
  phone: number;
  email: string;
  role?: string;
  exp: number;
}

interface UserData extends UserPayload {
  // Aquí van todos los campos del endpoint /users/ID, más la exp del token
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );
  const [user, setUser] = useState<UserData | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const saveTokens = useCallback((access: string, refresh?: string) => {
    localStorage.setItem("token", access);
    setToken(access);
    if (refresh) {
      localStorage.setItem("refresh", refresh);
    }
  }, []);

  const decodeAndSetUser = useCallback((access: string) => {
    try {
      const decoded = jwtDecode<UserPayload>(access);

      if (decoded.exp * 1000 < Date.now()) {
        console.log("Token de acceso expirado, intentando refrescar...");
      } else {
        return decoded;
      }
    } catch {
      return null;
    }
    return null;
  }, []);

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetActivity));
    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetActivity),
      );
    };
  }, [resetActivity]);

  const logout = useCallback(() => {
    console.log("Sesión cerrada (Logout)");
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("avc09_data");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (Date.now() - lastActivity > INACTIVITY_LIMIT_MS && user) {
        console.log(
          `Inactividad detectada: ${INACTIVITY_LIMIT_MS / 1000} segundos`,
        );
        logout();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [lastActivity, user, logout]);

  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem("refresh");

    if (!refresh) return logout();

    try {
      const response = await authAxios.post(`/token/refresh/`, {
        refresh: refresh,
      });

      const data: AuthTokenResponse = response.data;

      if (data.access) {
        console.log("Token refrescado y rotado.");
        saveTokens(data.access, data.refresh);

        const decoded = jwtDecode<UserPayload>(data.access);
        setUser((prevUser) =>
          prevUser ? { ...prevUser, exp: decoded.exp } : prevUser,
        );
      }
    } catch (error) {
      console.log("Error refreshing token:", error);
      logout();
    }
  }, [logout, saveTokens]);

  useEffect(() => {
    if (!user?.exp || !token) return;

    const intervalId = setInterval(() => {
      const now = Date.now() / 1000;
      const remaining = user.exp - now;

      if (remaining < REFRESH_THRESHOLD_SECONDS && remaining > 0) {
        console.log(`Expira en ${remaining.toFixed(0)}s. Refrescando...`);
        refreshToken();
      } else if (remaining < 0) {
        console.log("Token de acceso expirado. Forzando logout.");
        logout();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [user, token, refreshToken, logout]);

  const login = useCallback(
    async (tokens: AuthTokenResponse) => {
      saveTokens(tokens.access, tokens.refresh);

      try {
        const decoded = jwtDecode<UserPayload>(tokens.access);

        const res = await axios.get(
          `${BASE_API_URL}/users/${decoded.user_id}`,
          {
            headers: { Authorization: `Bearer ${tokens.access}` },
          },
        );

        const userData: UserData = res.data;

        setUser({ ...userData, exp: decoded.exp, user_id: decoded.user_id });
        resetActivity();
      } catch (err) {
        console.error("Error al decodificar o cargar datos de usuario:", err);
        logout();
      }
    },
    [logout, resetActivity, saveTokens],
  );

  const initializeAuth = useCallback(async () => {
    const initialToken = localStorage.getItem("token");
    const initialRefresh = localStorage.getItem("refresh");

    if (!initialToken) {
      setUser(null);
      return;
    }

    try {
      const decoded = jwtDecode<UserPayload>(initialToken);

      // Chequeo de expiración: si está expirado, intenta refrescar.
      if (decoded.exp * 1000 < Date.now()) {
        console.log("Token inicial expirado. Intentando refrescar...");
        // Intentamos refrescar. Si falla, refreshToken llama a logout.
        await refreshToken();
      } else {
        // Si no está expirado, cargamos los datos del usuario.
        await login({
          access: initialToken,
          refresh: initialRefresh || "",
        } as AuthTokenResponse);
      }
    } catch (e) {
      console.error("Error al decodificar token inicial:", e);
      logout();
    }
  }, [login, logout, refreshToken]);

  useEffect(() => {
    // Ejecuta la inicialización
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const decodedPayload = decodeAndSetUser(token);

    if (decodedPayload) {
      login({
        access: token,
        refresh: localStorage.getItem("refresh") || "",
      } as AuthTokenResponse);
    } else {
      logout();
    }
  }, []);

  const contextValue = useMemo(
    () => ({ token, user, login, logout }),
    [token, user, login, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
