import type { NextConfig } from "next";

const frameAncestors = (process.env.NEXT_PUBLIC_FRAME_ANCESTORS ?? "").trim();

const nextConfig: NextConfig = {
  // Ship the ProofLoop run snapshot with the serverless functions that read it.
  outputFileTracingIncludes: {
    "/proofloop": ["./proofloop-snapshot/**/*"],
    "/api/proofloop/evidence/\\[\\.\\.\\.path\\]": ["./proofloop-snapshot/**/*"],
  },
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
