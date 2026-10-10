import { HOME_METADATA, HOME_STRUCTURED_DATA } from "@/config/seo";

import { App } from "@/App";

export const metadata = HOME_METADATA;

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(HOME_STRUCTURED_DATA).replace(/</g, "\\u003c")
        }}
      />
      <App />
    </>
  );
}
