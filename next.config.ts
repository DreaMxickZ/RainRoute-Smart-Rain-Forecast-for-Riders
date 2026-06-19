import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-leaflet 4.x is incompatible with React 18 Strict Mode's double-invoke:
  // the second mount tries to re-init a container that already has _leaflet_id.
  reactStrictMode: false,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.tile.openstreetmap.org" },
    ],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

export default nextConfig;
