import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/Discipline_frontend",
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://displine-backend.onrender.com",
        changeOrigin: true,
      },
    },
  },
});

