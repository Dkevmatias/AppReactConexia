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
    //mode === "development" && basicSsl(),
  ],//.filter(Boolean),

  server: {
 host: "0.0.0.0",   // 🔥 CLAVE
    port: 5173,
    strictPort: true,
    allowedHosts: [".trycloudflare.com"],
  },

  build: {
    sourcemap: false,
    minify: "terser",
    outDir: 'dist',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
}));