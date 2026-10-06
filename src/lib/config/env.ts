// Public, browser-safe values only. Literal process.env.NEXT_PUBLIC_* access is required for inlining.
export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  assetBaseUrl: process.env.NEXT_PUBLIC_ASSET_BASE_URL,
} as const;
