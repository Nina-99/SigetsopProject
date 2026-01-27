import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLE_PATHS } from "../../@core";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!token) return <Navigate to="/signin" replace />;
  if (!user) return null; // Esperando a que se carguen los datos del usuario

  const roleName = user?.role_data?.name;

  if (roleName === "Admin") return <>{children}</>;

  const allowedPaths = ROLE_PATHS[roleName] || [];
  const isAllowed = allowedPaths.includes(location.pathname);

  if (!isAllowed) {
    console.warn(
      `Acceso denegado para el rol ${roleName} a ${location.pathname}`,
    );
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
