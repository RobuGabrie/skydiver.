import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the monorepo local package is transpiled by Next/Turbopack
  // so imports from `@skydiver/shared` (TypeScript source) work during build.
  transpilePackages: ["@skydiver/shared"],
};

export default nextConfig;
