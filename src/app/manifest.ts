import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Knights",
    short_name: "Knights",
    description: "Campaña contra los 12 caballeros de oro",
    start_url: "/",
    display: "standalone",
    background_color: "#ffd700",
    theme_color: "#ffd700",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}