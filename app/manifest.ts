// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Obras Sanitarias Calc",
    short_name: "Sanitarias",
    description: "Cómputo de materiales de obra. Funciona offline.",
    start_url: "/",
    display: "standalone",
    background_color: "#2C3333",
    theme_color: "#0E8388",
    icons: [
      {
        src: "/favicon.ico", // Puedes cambiar esto por íconos de mejor resolución
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}