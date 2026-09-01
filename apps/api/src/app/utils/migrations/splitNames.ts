/* eslint-disable @typescript-eslint/no-explicit-any */
import { dbConnect } from "../../config/dbConnect";
import { User } from "../../modules/user/user.model";
import logger from "../logger";
import mongoose from "mongoose";

const migrateNames = async () => {
  try {
    await dbConnect();
    logger.info("Starting name migration...");

    // Use lean() to get raw objects from DB, including fields not in the schema
    const users = await User.find({ fullName: { $exists: true, $ne: "" } }).lean();
    logger.info(`Found ${users.length} users to migrate.`);

    for (const user of users) {
      const full = (user as any).fullName;
      
      if (!full) {
        logger.warn(`Skipping user ${user._id}: fullName is missing or empty.`);
        continue;
      }

      const parts = full.trim().split(/\s+/);
      const firstName = parts[0] || "User";
      const lastName = parts.slice(1).join(" ") || "PoolPay";

      await User.updateOne(
        { _id: user._id },
        { 
          $set: { firstName, lastName },
          $unset: { fullName: "" } 
        }
      );
      logger.info(`Migrated User ${user._id}: "${full}" -> [${firstName}] [${lastName}]`);
    }


    logger.info("✅ Name migration completed successfully!");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

migrateNames();
