import "./load-env";

import { ensureOwnerAccount } from "../src/server/auth/users";
import { ensureIndexes, getMongoClient } from "../src/server/db/client";
import { initAdvertisementsIfEmpty, initServicesIfEmpty } from "../src/server/db/repositories";

async function main() {
  await ensureIndexes();
  await initServicesIfEmpty();
  await initAdvertisementsIfEmpty();
  const owner = await ensureOwnerAccount();
  process.stdout.write(
    `KLX indexes, default services, advertisements, and Super Admin owner initialized (${owner.email}).\n`
  );
  await (await getMongoClient()).close();
}
main().catch((err) => {
  process.stderr.write(`KLX initialization failed: ${err?.message || err}\n`);
  process.exit(1);
});
