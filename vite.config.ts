import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
    // HTTPS solo en desarrollo
    mode === "development" && basicSsl(),
  ].filter(Boolean),

  // Configuración solo para desarrollo
  server: {
    // port: 5173,
    // allowedHosts: ['tu-host.trycloudflare.com']
  },

  // Configuración de build para producción
  build: {
    sourcemap: false,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
}));