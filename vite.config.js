import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    outDir: "dist",
  },
  base: "/",
  server: mode === "development" ? {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://displine-backend.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  } : undefined,
}));


