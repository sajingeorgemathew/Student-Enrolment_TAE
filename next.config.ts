import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pizzip", "docxtemplater", "exceljs"],
  experimental: {
    serverActions: {
      // ACADEMIC-03: legacy student Excel files are uploaded to a server action
      // for preview parsing. Allow headroom above the default 1 MB limit.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
