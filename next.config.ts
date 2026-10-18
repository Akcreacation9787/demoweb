import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Prevent Turbopack from treating a parent directory's lockfile as this
  // application's root.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
