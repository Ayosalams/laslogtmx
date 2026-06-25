import { defineCloudflareConfig, type OpenNextConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig(),
  buildCommand: "npx next build",
} satisfies OpenNextConfig;