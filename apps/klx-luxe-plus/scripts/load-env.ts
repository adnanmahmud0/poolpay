import { resolve } from "node:path";

import { config } from "dotenv";

config({
  path: [resolve(".env.local"), process.env.KLX_ENV_FILE || resolve("../../.env"), resolve(".env")],
  quiet: true
});
