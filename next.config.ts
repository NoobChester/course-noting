import type { NextConfig } from "next";

const isExport = process.env.NEXT_EXPORT === "true";
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const repoName = "course-noting";

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export" } : {}),
  basePath: isGitHubActions ? `/${repoName}` : undefined,
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
