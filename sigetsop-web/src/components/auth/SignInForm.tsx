import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import { themeConfig } from "../../configs";
import { Checkbox, Input, Label } from "../form";
import { Button } from "../ui";
import { auth } from "../../services";
import { useAuth } from "../../@core";
import { jwtDecode } from "jwt-decode";
import {
  showLoginLoading,
  showLoginSuccess,
  showLoginError,
  showConnectionError,
  showServerError,
  showDatabaseError,
  showUserInactiveError,
  showTimeoutError,
  showEmptyFieldsError,
  closeSwal,
} from "../../utils/swalMessages";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validación de campos vacíos
    if (!username.trim() || !password.trim()) {
      showEmptyFieldsError();
      return;
    }

    // Mostrar loading
    showLoginLoading();

    try {
      const response = await auth(username, password);
      
      if (response.access && response.refresh) {
        // Cerrar loading
        closeSwal();
        
        // Guardar token y datos de usuario
        localStorage.setItem("token", JSON.stringify(response));
        login(response);
        
        // Decodificar token para obtener datos del usuario
        const decodedToken = jwtDecode<Record<string, unknown>>(response.access);
        console.log("Usuario logueado:", decodedToken);
        
        // Mostrar mensaje de éxito
        await showLoginSuccess();
        
        // Redirigir al dashboard
        navigate("/");
      }
    } catch (err) {
      // Cerrar loading
      closeSwal();
      
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      
      // Manejo específico de errores
      if (errorMessage.includes("No se puede conectar al servidor")) {
        showConnectionError();
      } else if (errorMessage.includes("Tiempo de espera agotado")) {
        showTimeoutError();
      } else if (errorMessage.includes("Usuario desactivado")) {
        showUserInactiveError();
      } else if (errorMessage.includes("base de datos")) {
        showDatabaseError();
      } else if (errorMessage.includes("servidor") || errorMessage.includes("interno")) {
        showServerError();
      } else {
        // Error genérico de login
        showLoginError(errorMessage);
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Retornar
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <div>
              <h4 className="dark:text-white">{`Bienvenido a ${themeConfig.templateName}!👋🏻`}</h4>
            </div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Iniciar Sesión
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Por favor inicia sesión con tu cuenta para entrar en la aventura
              </p>
            </div>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Username <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    type="text"
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <Label>
                    Contraseña <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresar Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Mantenme Conectado
                    </span>
                  </div>
                  <Link
                    to="/reset-password"
                    className="text-sm text-lime-600 hover:text-lime-700 dark:text-lime-400"
                  >
                    Recuperar Contraseña?
                  </Link>
                </div>
                {/* <div> */}
                <Button
                  type="submit"
                  className="w-full bg-lime-700 hover:bg-lime-800"
                  size="sm"
                >
                  Iniciar Sesión
                </Button>
                {/* </div> */}
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                No tienes cuenta? {""}
                <Link
                  to="/signup"
                  className="text-lime-600 hover:text-lime-700 dark:text-lime-400"
                >
                  Registrate
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
