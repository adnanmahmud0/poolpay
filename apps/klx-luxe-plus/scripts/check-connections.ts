import { stripeClient } from "../src/server/commerce";

import "./load-env";

import { getDb, getMongoClient } from "../src/server/db/client";

async function main() {
  try {
    await (await getDb()).command({ ping: 1 });
    process.stdout.write("Database reachable: yes\n");
    await (await getMongoClient()).close();
  } catch {
    process.stdout.write("Database reachable: no\n");
  }
  try {
    await stripeClient().balance.retrieve();
    process.stdout.write("Configured Stripe account reachable: yes\n");
  } catch {
    process.stdout.write("Configured Stripe account reachable: no\n");
  }
}
main();
