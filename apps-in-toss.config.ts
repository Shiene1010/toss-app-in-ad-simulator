import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "ad-simulator",
  entry: "dist/index.html",
  brand: {
    displayName: "ad-simulator",
    primaryColor: "#3182F6",
  },
  web: {
    host: "0.0.0.0",
    port: 3000,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});