export default function manifest() {
  return {
    name: "Prime Inventory",
    short_name: "Prime Inventory",
    description: "Track your Warframe Prime parts, mastery, ducats and the relics you still need.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#030712",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      // Full-bleed artwork with the gem inside the safe zone, so it can be masked.
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
