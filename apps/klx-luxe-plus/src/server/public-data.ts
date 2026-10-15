import { env } from "@/env";

import { DEFAULT_SERVICES, DEFAULT_SETTINGS, DEFAULT_SITE_CONTENT } from "./db/defaults";
import { getAds, getServices, getSettings, getSiteContent } from "./db/repositories";
import type { KlxSettings, PublicSettings } from "./db/types";

function visibleSettings(settings: KlxSettings): PublicSettings {
  const {
    siteTitle,
    supportEmail,
    phone,
    timezone,
    currency,
    seoTitle,
    seoDescription,
    socialImageUrl
  } = settings;
  return {
    siteTitle,
    supportEmail,
    phone,
    timezone,
    currency,
    seoTitle,
    seoDescription,
    socialImageUrl
  };
}

export async function publicData(draft = false) {
  if (!env.KLX_DATABASE_URL && !env.DATABASE_URL)
    return {
      content: DEFAULT_SITE_CONTENT,
      services: DEFAULT_SERVICES.filter((s) => s.isVisible),
      settings: visibleSettings(DEFAULT_SETTINGS),
      advertisements: []
    };
  const [content, services, settings, advertisements] = await Promise.all([
    getSiteContent(draft ? "draft" : "published"),
    getServices(),
    getSettings(),
    getAds()
  ]);
  // Strip MongoDB IDs and serialize dates before passing server data to client components.
  return JSON.parse(
    JSON.stringify({ content, services, settings: visibleSettings(settings), advertisements })
  ) as {
    content: typeof content;
    services: typeof services;
    settings: PublicSettings;
    advertisements: typeof advertisements;
  };
}
