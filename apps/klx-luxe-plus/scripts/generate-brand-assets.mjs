import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const APP_ROOT = new URL("../", import.meta.url);
const assetPath = (path) => new URL(path, APP_ROOT);
const SOCIAL_WIDTH = 1200;
const SOCIAL_HEIGHT = 630;
const LOGO_SIZE = 512;
const APPLE_ICON_SIZE = 180;
const FAVICON_SIZE = 48;

await mkdir(assetPath("public/images/"), { recursive: true });
const [socialSvg, logoSvg] = await Promise.all([
  readFile(assetPath("brand/social-card.svg")),
  readFile(assetPath("public/favicon.svg"))
]);

// Code-native artwork gives crawlers a small, widely supported PNG without any runtime image service.
await Promise.all([
  sharp(socialSvg)
    .resize(SOCIAL_WIDTH, SOCIAL_HEIGHT)
    .png({ compressionLevel: 9 })
    .toFile(fileURLToPath(assetPath("public/images/klx-social-card.png"))),
  ...[
    [LOGO_SIZE, "public/images/klx-logo.png"],
    [APPLE_ICON_SIZE, "public/apple-touch-icon.png"],
    [FAVICON_SIZE, "public/favicon-48.png"]
  ].map(([size, path]) =>
    sharp(logoSvg)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(fileURLToPath(assetPath(path)))
  )
]);
