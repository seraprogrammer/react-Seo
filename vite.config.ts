import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import htmlExport from "./reactSeo";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), htmlExport()],
});
