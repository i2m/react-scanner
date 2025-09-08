import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "https://api-rs.dexcelerate.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/socket": {
        target: "wss://api-rs.dexcelerate.com",
        ws: true,
        secure: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/socket/, "/ws"),
      },
    },
  },
});
