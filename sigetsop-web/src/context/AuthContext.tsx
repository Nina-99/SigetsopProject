import { createContext, useContext } from "react";
import { AuthTokenResponse } from "../services/auth";

interface Role {
  id: number;
  name: string;
  description: string;
}

interface UserData {
  username: string;
  first_name: string;
  last_name: string;
  maternal_name: string;
  phone: number;
  email: string;
  role: Role;
  exp: number;
}

export interface AuthContextType {
  token: string | null;
  user: UserData | null;
  login: (tokens: AuthTokenResponse) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
