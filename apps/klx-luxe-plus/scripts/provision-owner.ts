import "./load-env";

import { env, getOwnerCredentials } from "../src/env";
import { createOwnerSetupToken, ensureOwnerAccount } from "../src/server/auth/users";
import { COLLECTIONS, ensureIndexes, getDb, getMongoClient } from "../src/server/db/client";
import { initServicesIfEmpty } from "../src/server/db/repositories";

async function main() {
  await ensureIndexes();
  await initServicesIfEmpty();
  const { email: ownerEmail, password: ownerPassword } = getOwnerCredentials();

  if (process.argv.includes("--sync-credentials")) {
    const owner = await ensureOwnerAccount(ownerEmail, ownerPassword);
    process.stdout.write(`Super Admin owner credentials synchronized: ${owner.email}\n`);
    await (await getMongoClient()).close();
    return;
  }

  const existing = await (
    await getDb()
  )
    .collection(COLLECTIONS.USERS)
    .findOne({ email: ownerEmail });
  const recovery = process.argv.includes("--recovery");
  if (existing && !recovery)
    throw new Error(
      "Owner already exists. Use --recovery to generate a recovery link, or --sync-credentials to update password."
    );
  const token = await createOwnerSetupToken(ownerEmail, recovery ? "recovery" : "setup");
  process.stdout.write(
    `Open this private setup link (expires in 24 hours):\n${env.KLX_SITE_URL}/admin/login?setup=${token}\n`
  );
  await (await getMongoClient()).close();
}
main().catch(() => {
  process.stderr.write(
    "Owner provisioning failed. Check database configuration and existing owner account.\n"
  );
  process.exit(1);
});
