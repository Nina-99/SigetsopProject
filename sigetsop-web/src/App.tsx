import { HelmetProvider } from "react-helmet-async";
import { AppRouter } from "./components";
import { AuthProvider, SidebarProvider } from "./context";

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <SidebarProvider>
          <AppRouter />
        </SidebarProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
