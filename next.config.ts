import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Local Supabase (127.0.0.1) serves uploaded images in development only.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    qualities: [75, 90],
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "55321", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
