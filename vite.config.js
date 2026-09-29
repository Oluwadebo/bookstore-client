/**
 * Vite configuration.
 * - React plugin for JSX
 * - Tailwind CSS v4 plugin (no separate tailwind.config file needed)
 * - Dev proxy: requests to /api are forwarded to the Express server, so the
 *   browser sees one origin and login cookies work without CORS trouble.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true },
    },
  },
});
