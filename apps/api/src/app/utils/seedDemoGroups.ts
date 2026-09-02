import dns from "node:dns/promises";
import mongoose from "mongoose";
import { envVars } from "../config/env";
import { ContributionFrequency, GroupStatus } from "../modules/group/group.interface";
import { Group } from "../modules/group/group.model";
import { MemberStatus } from "../modules/groupMember/groupMember.interface";
import { GroupMember } from "../modules/groupMember/groupMember.model";
import { Role } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import logger from "./logger";

export const seedDemoGroups = async () => {
  try {
    // 1. Find Admin user to act as group creator
    let adminUser = await User.findOne({
      $or: [{ role: Role.SUPER_ADMIN }, { role: Role.ADMIN }, { email: envVars.SUPER_ADMIN_EMAIL }],
    });

    if (!adminUser) {
      logger.warn("⚠️ No Admin user found to assign as creator for demo groups.");
      return;
    }

    // 2. Demo Group 1: Family Savings Circle (FAM2026XYZ)
    const demo1Code = "FAM2026XYZ";
    let group1 = await Group.findOne({ inviteCode: demo1Code });

    if (!group1) {
      logger.info("🌱 Seeding Demo Group: Family Savings Circle (FAM2026XYZ)...");
      group1 = await Group.create({
        name: "Family Savings Circle",
        description:
          "A monthly savings circle for family members to save together, build emergency reserves, and achieve collective financial milestones.",
        createdBy: adminUser._id,
        contributionAmount: 500,
        contributionFrequency: ContributionFrequency.MONTHLY,
        totalMembers: 5,
        currentMembers: 1,
        inviteCode: demo1Code,
        poolAmount: 2500,
        totalCycles: 1,
        status: GroupStatus.UPCOMING,
        isAdminCreated: true,
        isMock: false,
        creatorCommissionPercent: 0,
      });

      // Add admin as first member
      await GroupMember.findOneAndUpdate(
        { groupId: group1._id, userId: adminUser._id },
        {
          groupId: group1._id,
          userId: adminUser._id,
          joinMonth: 1,
          position: 1,
          status: MemberStatus.ACTIVE,
          noticeStatus: "NONE",
          missedPaymentCount: 0,
          totalPaidAmount: 0,
          missedPayments: 0,
          missedAmount: 0,
        },
        { upsert: true, new: true }
      );
      logger.info("✅ Family Savings Circle seeded successfully!");
    } else {
      logger.info("ℹ️ Family Savings Circle (FAM2026XYZ) already exists.");
    }

    // 3. Demo Group 2: Tech Startup Fund (TECH2026ABC)
    const demo2Code = "TECH2026ABC";
    let group2 = await Group.findOne({ inviteCode: demo2Code });

    if (!group2) {
      logger.info("🌱 Seeding Demo Group: Tech Startup Fund (TECH2026ABC)...");
      group2 = await Group.create({
        name: "Tech Startup Fund",
        description:
          "A cooperative funding pool for tech builders, entrepreneurs, and startup collaborators to bootstrap tools, projects, and resources.",
        createdBy: adminUser._id,
        contributionAmount: 1000,
        contributionFrequency: ContributionFrequency.MONTHLY,
        totalMembers: 5,
        currentMembers: 1,
        inviteCode: demo2Code,
        poolAmount: 5000,
        totalCycles: 1,
        status: GroupStatus.UPCOMING,
        isAdminCreated: true,
        isMock: false,
        creatorCommissionPercent: 0,
      });

      // Add admin as first member
      await GroupMember.findOneAndUpdate(
        { groupId: group2._id, userId: adminUser._id },
        {
          groupId: group2._id,
          userId: adminUser._id,
          joinMonth: 1,
          position: 1,
          status: MemberStatus.ACTIVE,
          noticeStatus: "NONE",
          missedPaymentCount: 0,
          totalPaidAmount: 0,
          missedPayments: 0,
          missedAmount: 0,
        },
        { upsert: true, new: true }
      );
      logger.info("✅ Tech Startup Fund seeded successfully!");
    } else {
      logger.info("ℹ️ Tech Startup Fund (TECH2026ABC) already exists.");
    }

    // 4. Ensure existing test user (Adnan Mahmud) has verified stripeConnectStatus for smooth demo joining
    const testUser = await User.findOne({ email: "adnan99mahmud@gmail.com" });
    if (testUser && testUser.stripeConnectStatus !== "verified") {
      testUser.stripeConnectStatus = "verified";
      await testUser.save();
      logger.info("✅ Test user (adnan99mahmud@gmail.com) verified for Stripe Connect demo testing.");
    }
  } catch (error) {
    logger.error("❌ Error seeding demo groups:", error);
  }
};

// If run directly via CLI
if (require.main === module) {
  (async () => {
    if (envVars.DATABASE_URL.startsWith("mongodb+srv://")) {
      dns.setServers(["8.8.8.8", "8.8.4.4"]);
    }
    await mongoose.connect(envVars.DATABASE_URL, { dbName: "poolPay-db" });
    await seedDemoGroups();
    await mongoose.disconnect();
    process.exit(0);
  })();
}
