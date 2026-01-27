import { createContext, useContext, useState } from "react";

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
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
