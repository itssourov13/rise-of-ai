import { publicEnv } from "./env";

function parseUrl(value: string | undefined): URL | undefined {
  if (!value) return undefined;
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

export const siteConfig = {
  name: "RISE OF AI",
  tagline: "From Machine to Intelligence",
  description:
    "A scroll-driven cinematic journey through the evolution of artificial intelligence, from machine to intelligence.",
  url: parseUrl(publicEnv.siteUrl),
} as const;
