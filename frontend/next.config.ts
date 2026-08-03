import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: FastAPI serves the built `out/` directory directly
  // instead of running a Node server (see backend/app/main.py).
  output: "export",
  trailingSlash: true,
  // app/page.tsx reads ../templates/*.md (the repo's canonical source of legal
  // text) at build time; without this, output file tracing would only look
  // inside frontend/ and drop that file from serverless/standalone builds.
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
