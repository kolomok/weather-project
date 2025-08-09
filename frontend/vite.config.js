import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    manifest: true,
    outDir: "dist",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/main.js"),
        city: path.resolve(__dirname, "src/city.js"),
        login: path.resolve(__dirname, "src/login.js"),
        register: path.resolve(__dirname, "src/register.js"),
        favorites: path.resolve(__dirname, "src/favorites.js"),
      },
    },
  },
});
