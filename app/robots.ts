import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hybridized.online";

// AI crawlers that are explicitly blocked from indexing the site
const BLOCKED_AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "Google-Extended",
  "CCBot",
  "anthropic-ai",
  "Claude-Web",
  "ClaudeBot",
  "Bytespider",
  "Omgilibot",
  "FacebookBot",
  "Applebot-Extended",
  "PerplexityBot",
  "Amazonbot",
  "Cohere-ai",
  "meta-externalagent",
  "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...BLOCKED_AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
      {
        userAgent: ["Googlebot", "Bingbot", "DuckDuckBot", "Slurp"],
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
