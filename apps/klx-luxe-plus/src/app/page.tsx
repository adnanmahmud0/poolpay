import { HOME_METADATA, SITE_URL } from "@/config/seo";

import { PublicSite } from "@/components/PublicSite";
import { publicData } from "@/server/public-data";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { settings, content } = await publicData();
  const title = settings.seoTitle || `${settings.siteTitle} | PoolPay & Professional Services`;
  const description = settings.seoDescription || content.footer.description;
  const shareImage = new URL(settings.socialImageUrl, SITE_URL).toString();
  return {
    ...HOME_METADATA,
    title,
    description,
    openGraph: {
      ...HOME_METADATA.openGraph,
      title,
      description,
      images: [{ url: shareImage, width: 1200, height: 630, alt: settings.siteTitle }]
    },
    twitter: { ...HOME_METADATA.twitter, title, description, images: [shareImage] }
  };
}
export default async function Home() {
  const data = await publicData();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: data.settings.siteTitle,
            url: SITE_URL,
            email: data.settings.supportEmail,
            telephone: data.settings.phone,
            logo: `${SITE_URL}/images/klx-logo.png`
          }).replace(/</g, "\\u003c")
        }}
      />
      <PublicSite {...data} />
    </>
  );
}
