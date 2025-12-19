import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  basicSsl(), // Solo para desarrollo
  ],
  server: {
    port: 5173,
   /*allowedHosts: [
      'laser-lovely-kits-textiles.trycloudflare.com'
    ]*/
    
  },
  /*
  build: {
    sourcemap: false, // ✅ No generar sourcemaps en producción
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@fullcalendar/react', 'react-confetti'],
          charts: ['apexcharts', 'react-apexcharts']
        }
      }
    }
  }*/
});