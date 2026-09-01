import bcryptjs from "bcryptjs";
import { envVars } from "../config/env";
import { AuthProvider, Role, UserStatus } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";

export const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExist = await User.findOne({
      email: envVars.SUPER_ADMIN_EMAIL,
    });

    if (isSuperAdminExist) {
      console.log("ℹ️ Super Admin already exists.");
      return;
    }

    console.log("🌱 Seeding Super Admin...");

    const hashedPassword = await bcryptjs.hash(
      envVars.SUPER_ADMIN_PASSWORD,
      Number(envVars.BCRYPT_SALT_ROUND)
    );

    await User.create({
      firstName: "Super",
      lastName: "Admin",
      role: Role.SUPER_ADMIN,
      phone: "01700000000",
      agreeToTerms: true,
      email: envVars.SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      authProvider: AuthProvider.EMAIL,
      isVerified: true,
      twoFactorEnabled: false,
    });

    console.log("✅ Super Admin created successfully!");
  } catch (error) {
    console.error("❌ Error seeding Super Admin:", error);
  }
};
