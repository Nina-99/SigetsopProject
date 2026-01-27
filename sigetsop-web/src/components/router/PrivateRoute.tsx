import { Navigate } from "react-router-dom";
import { useAuth } from "../../@core";
import { JSX } from "react";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/signin" replace />;
};

export default PrivateRoute;
