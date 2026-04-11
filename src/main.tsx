import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
// 1. Importas la función de registro para la PWA
import { registerSW } from 'virtual:pwa-register';

// 2. Registras el Service Worker para habilitar la instalación
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <App />
  </ThemeProvider>
);