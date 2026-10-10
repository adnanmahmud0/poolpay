import type { Metadata } from "next";

import { COMPANY, SERVICES } from "@/data/site";

export const SITE_URL = "https://klxluxeplus.poolpay.space";
export const SITE_HOME = `${SITE_URL}/`;
const ORGANIZATION_ID = `${SITE_HOME}#organization`;
const WEBSITE_ID = `${SITE_HOME}#website`;
const PAGE_ID = `${SITE_HOME}#webpage`;
const PAGE_TITLE = "KLX LUXE PLUS LLC | Luxury Transport & Professional Services";
const PAGE_DESCRIPTION =
  "Connect with Jean Derival for luxury transportation, finance agent services, computer support, taxes, translations, and immigration document assistance.";
const SHARE_TITLE = "KLX LUXE PLUS LLC | A little more luxe. A lot more possible.";
const SHARE_DESCRIPTION =
  "Luxury transportation and everyday professional services. Connect with Jean Derival for your next step.";
const SHARE_IMAGE = {
  url: `${SITE_URL}/images/klx-social-card.png`,
  width: 1200,
  height: 630,
  alt: "KLX LUXE PLUS LLC — Luxury transportation and professional services. A little more luxe. A lot more possible."
};

// Home-page metadata stays here rather than in the root layout so 404s cannot inherit its canonical.
export const HOME_METADATA: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: SITE_HOME },
  category: "Transportation and professional services",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    type: "website",
    url: SITE_HOME,
    siteName: COMPANY.name,
    locale: "en_US",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [{ ...SHARE_IMAGE, secureUrl: SHARE_IMAGE.url, type: "image/png" }]
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [{ url: SHARE_IMAGE.url, alt: SHARE_IMAGE.alt }]
  }
};

// Only confirmed business facts are included: no invented address, credentials, ratings, or profiles.
export const HOME_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: COMPANY.name,
      legalName: COMPANY.name,
      url: SITE_HOME,
      description: PAGE_DESCRIPTION,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/klx-logo.png`,
        contentUrl: `${SITE_URL}/images/klx-logo.png`,
        width: 512,
        height: 512
      },
      email: COMPANY.email,
      telephone: COMPANY.phones[0].href.replace("tel:", ""),
      contactPoint: COMPANY.phones.map((phone) => ({
        "@type": "ContactPoint",
        name: COMPANY.contact,
        telephone: phone.href.replace("tel:", ""),
        email: COMPANY.email,
        contactType: "customer service"
      })),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "KLX LUXE PLUS services",
        itemListElement: SERVICES.map((service) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            "@id": `${SITE_HOME}#service-${service.id}`,
            name: service.name,
            serviceType: service.name,
            description: service.description,
            url: `${SITE_HOME}#services`,
            provider: { "@id": ORGANIZATION_ID }
          }
        }))
      }
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: SITE_HOME,
      name: COMPANY.name,
      alternateName: "KLX Luxe Plus",
      inLanguage: "en",
      publisher: { "@id": ORGANIZATION_ID }
    },
    {
      "@type": "WebPage",
      "@id": PAGE_ID,
      url: SITE_HOME,
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      inLanguage: "en",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      mainEntity: { "@id": ORGANIZATION_ID },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/luxury-transport.webp`,
        caption: "Illustrative transportation image; vehicle availability is confirmed with Jean.",
        width: 1672,
        height: 941
      }
    }
  ]
};
