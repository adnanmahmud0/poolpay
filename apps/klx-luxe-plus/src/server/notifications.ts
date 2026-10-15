import { getDb } from "./db/client";
import { enqueueOutbox } from "./db/repositories";
import type { KlxOutbox } from "./db/types";

export type NotificationIntent = Omit<KlxOutbox, "_id" | "status" | "attempts" | "createdAt">;
export async function queueIntents(collection: string, id: string) {
  const db = await getDb();
  const record = await db
    .collection<{
      id: string;
      notificationQueued: boolean;
      notificationIntents: NotificationIntent[];
    }>(collection)
    .findOne({ id, notificationQueued: false });
  if (!record) return;
  for (const intent of record.notificationIntents) await enqueueOutbox(intent, intent.id);
  await db.collection(collection).updateOne({ id }, { $set: { notificationQueued: true } });
}
