import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    manifest: true,
    outDir: "dist",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/main.js"),
        about: path.resolve(__dirname, "src/pages/about.js"),
        contacts: path.resolve(__dirname, "src/pages/contacts.js"),
      },
    },
  },
});
