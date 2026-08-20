import type { NextConfig } from "next";

const frameAncestors = (process.env.NEXT_PUBLIC_FRAME_ANCESTORS ?? "").trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: frameAncestors
              ? `frame-ancestors 'self' ${frameAncestors};`
              : "frame-ancestors 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
