import type { NextConfig } from "next";

const ONE_YEAR = 60 * 60 * 24 * 365;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Service worker must always revalidate so updates ship immediately.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/offline.html",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        // App icons rarely change; cache a day, revalidate in the background.
        source: "/:icon(icon|icon-maskable).svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // Static media served from /public: long cache, revalidate.
        source: "/:all*(svg|png|jpg|jpeg|gif|webp|ico|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: `public, max-age=${ONE_YEAR}, stale-while-revalidate=86400`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
