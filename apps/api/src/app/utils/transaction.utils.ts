import mongoose, { ClientSession } from "mongoose";

/**
 * Checks if the current MongoDB connection supports multi-document transactions.
 * Multi-document transactions require a replica set member or mongos (sharded cluster).
 */
export const isTransactionSupported = (): boolean => {
  try {
    const client = mongoose.connection.getClient();
    const topologyType = (client as any)?.topology?.description?.type;
    return (
      topologyType === "ReplicaSetWithPrimary" ||
      topologyType === "Sharded" ||
      topologyType === "LoadBalanced"
    );
  } catch {
    return false;
  }
};

/**
 * Helper to run operations within a MongoDB transaction if replica sets are supported.
 * Falls back to executing without a session if the MongoDB server is a standalone instance
 * (common in local Docker development), avoiding:
 * "MongoServerError: Transaction numbers are only allowed on a replica set member or mongos"
 */
export const withTransaction = async <T>(
  callback: (session: ClientSession | undefined) => Promise<T>
): Promise<T> => {
  if (!isTransactionSupported()) {
    return await callback(undefined);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    // Safe fallback in case topology check missed a standalone instance
    if (
      error?.code === 20 ||
      error?.message?.includes("Transaction numbers are only allowed on a replica set member or mongos")
    ) {
      return await callback(undefined);
    }
    throw error;
  } finally {
    session.endSession();
  }
};
