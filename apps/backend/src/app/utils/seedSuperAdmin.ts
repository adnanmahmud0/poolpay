import bcryptjs from "bcryptjs";
import { envVars } from "../config/env";
import { AuthProvider, Role, UserStatus } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";

export const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExist = await User.findOne({
      $or: [
        { email: envVars.SUPER_ADMIN_EMAIL },
        { role: Role.SUPER_ADMIN },
        { phone: "01700000000" },
      ],
    });

    const hashedPassword = await bcryptjs.hash(
      envVars.SUPER_ADMIN_PASSWORD,
      Number(envVars.BCRYPT_SALT_ROUND)
    );

    if (isSuperAdminExist) {
      isSuperAdminExist.email = envVars.SUPER_ADMIN_EMAIL;
      isSuperAdminExist.password = hashedPassword;
      isSuperAdminExist.role = Role.SUPER_ADMIN;
      isSuperAdminExist.status = UserStatus.ACTIVE;
      isSuperAdminExist.isVerified = true;
      await isSuperAdminExist.save();
      console.log(
        "✅ Super Admin credentials synchronized with environment variables!"
      );
      return;
    }

    console.log("🌱 Seeding Super Admin...");

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
  } catch (error: any) {
    if (error?.code === 11000) {
      console.log("ℹ️ Super Admin already seeded.");
      return;
    }
    console.error("❌ Error seeding Super Admin:", error);
  }
};
