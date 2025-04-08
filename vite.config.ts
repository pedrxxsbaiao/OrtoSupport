import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.join(process.cwd(), "client", "src"),
      "@shared": path.join(process.cwd(), "shared"),
      "@assets": path.join(process.cwd(), "attached_assets"),
    },
  },
  root: path.join(process.cwd(), "client"),
  build: {
    outDir: path.join(process.cwd(), "dist/public"),
    emptyOutDir: true,
  },
});
