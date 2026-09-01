import { dbConnect } from "../../config/dbConnect";
import { User } from "../../modules/user/user.model";
import { normalizePhone, generatePhoneHash, generateStripeCustomerIdHash } from "../phoneUtils";
import logger from "../logger";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

interface IConflictRecord {
  userId: string;
  email: string;
  name: string;
  phone: string;
  hash: string;
  conflictingWithUserId: string;
  resolution: string;
}

interface IFailureRecord {
  userId: string;
  email: string;
  error: string;
}

const migrateCryptographicHashes = async () => {
  const summary = {
    totalScanned: 0,
    totalMigrated: 0,
    totalConflictsHandled: 0,
    totalDecryptionFailures: 0,
  };

  const conflictsList: IConflictRecord[] = [];
  const failuresList: IFailureRecord[] = [];

  try {
    await dbConnect();
    logger.info("🚀 Starting Cryptographic Hashes Migration & Conflict Resolution...");

    // Find all users (do not use lean() so that getters are applied automatically)
    const users = await User.find({});
    summary.totalScanned = users.length;
    logger.info(`Found ${users.length} user records to inspect.`);

    // Map to keep track of who owns the primary hash in-memory
    const phoneHashMap = new Map<string, string>(); // hash -> userId
    const stripeCustomerIdHashMap = new Map<string, string>(); // hash -> userId

    for (const user of users) {
      try {
        let needsSave = false;

        // 1. Phone Hash Migration
        if (user.phone) {
          const normalized = normalizePhone(user.phone);
          const hash = generatePhoneHash(normalized);

          const existingOwnerId = phoneHashMap.get(hash);
          if (existingOwnerId) {
            summary.totalConflictsHandled++;
            const conflictPlaceholder = `conflict_phone_${user._id}_${Date.now()}`;
            
            // Overwrite hash to unique placeholder to prevent cross-talk and index collision
            user.phoneHash = conflictPlaceholder;
            user.phoneConflict = true;
            needsSave = true;

            conflictsList.push({
              userId: user._id.toString(),
              email: user.email || "N/A",
              name: user.fullName || "N/A",
              phone: user.phone,
              hash,
              conflictingWithUserId: existingOwnerId,
              resolution: "Assigned unique placeholder to phoneHash to secure account from cross-talk and prevent Mongoose index collisions.",
            });

            logger.error(`🚨 [DUPLICATE PHONE DETECTED] User ${user._id} has same phone as User ${existingOwnerId}. Assigned safe placeholder to prevent cross-talk.`);
          } else {
            phoneHashMap.set(hash, user._id.toString());
            if (user.phoneHash !== hash) {
              user.phoneHash = hash;
              needsSave = true;
            }
          }
        }

        // 2. Stripe Customer ID Hash Migration
        if (user.stripeCustomerId) {
          const hash = generateStripeCustomerIdHash(user.stripeCustomerId);

          const existingOwnerId = stripeCustomerIdHashMap.get(hash);
          if (existingOwnerId) {
            summary.totalConflictsHandled++;
            const conflictPlaceholder = `conflict_stripe_${user._id}_${Date.now()}`;
            
            // Overwrite hash to unique placeholder to prevent duplicate key index collision
            user.stripeCustomerIdHash = conflictPlaceholder;
            needsSave = true;

            conflictsList.push({
              userId: user._id.toString(),
              email: user.email || "N/A",
              name: user.fullName || "N/A",
              phone: "N/A",
              hash,
              conflictingWithUserId: existingOwnerId,
              resolution: "Assigned unique placeholder to stripeCustomerIdHash to prevent index collision.",
            });

            logger.error(`🚨 [DUPLICATE STRIPE CUSTOMER ID DETECTED] User ${user._id} has same customer ID as User ${existingOwnerId}. Assigned placeholder.`);
          } else {
            stripeCustomerIdHashMap.set(hash, user._id.toString());
            if (user.stripeCustomerIdHash !== hash) {
              user.stripeCustomerIdHash = hash;
              needsSave = true;
            }
          }
        }

        if (needsSave) {
          await user.save();
          summary.totalMigrated++;
          logger.info(`✅ Migrated User ${user._id}: Hashed fields updated.`);
        }
      } catch (userError) {
        summary.totalDecryptionFailures++;
        const errorMsg = userError instanceof Error ? userError.message : String(userError);
        
        failuresList.push({
          userId: user._id.toString(),
          email: user.email || "N/A",
          error: errorMsg,
        });

        logger.error(`❌ Failed to migrate user ${user._id} due to corruption: ${errorMsg}. Skipping to next record...`);
      }
    }

    // Write conflict report to disk
    const reportPath = path.join(process.cwd(), "cryptographic_migration_conflict_report.json");
    const reportData = {
      timestamp: new Date().toISOString(),
      summary,
      conflicts: conflictsList,
      failures: failuresList,
    };
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    logger.info("====================================================");
    logger.info("           MIGRATION COMPLETE SUMMARY               ");
    logger.info("====================================================");
    logger.info(`Total Records Scanned       : ${summary.totalScanned}`);
    logger.info(`Total Records Migrated      : ${summary.totalMigrated}`);
    logger.info(`Total Conflicts Handled     : ${summary.totalConflictsHandled}`);
    logger.info(`Total Decryption Failures   : ${summary.totalDecryptionFailures}`);
    logger.info(`Conflict Report Written To  : ${reportPath}`);
    logger.info("====================================================");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error("❌ Cryptographic hashes migration failed:", error);
    process.exit(1);
  }
};

migrateCryptographicHashes();
