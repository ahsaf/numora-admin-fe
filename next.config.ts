import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const DEFAULT_PAGE_EXTENSIONS = ["tsx", "ts", "jsx", "js"];

export default function config(phase: string): NextConfig {
  return {
    cacheComponents: true,
    partialPrefetching: true,
    // `page.dev.tsx` routes exist under `next dev` only: the local E2E tests page (app/(portal)/e2e)
    // drives Playwright on this machine and must never be built or deployed.
    pageExtensions:
      phase === PHASE_DEVELOPMENT_SERVER ? ["dev.tsx", ...DEFAULT_PAGE_EXTENSIONS] : DEFAULT_PAGE_EXTENSIONS,
    turbopack: {
      rules: {
        "*.css": {
          loaders: ["@tailwindcss/turbopack"],
          as: "*.css",
        },
      },
    },
  };
}
