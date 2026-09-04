import bcryptjs from "bcryptjs";
import crypto from "crypto";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { sendEmail } from "../../utils/sendEmail";
import { createNewAccessTokenWithRefreshToken, createUserTokens } from "../../utils/userTokens";
import { ms } from "../../utils/ms";
import { AuthProvider, IUser, Role, UserStatus, VerificationChannel } from "../user/user.interface";
import { User } from "../user/user.model";
import { ILoginPayload, ILoginResponse } from "./auth.interface";
import { logActivity } from "../../utils/activityLogger";
import { Settings } from "../settings/settings.model";
import { normalizePhone, generatePhoneHash } from "../../utils/phoneUtils";
import { sendSMS } from "../../utils/sendSMS";
import { AuditLog, AuditAction, EntityType } from "../auditLog/auditLog.model";
import { emitRealTimeNotification, enqueuePushNotification } from "../../utils/notification.utils";
import { Notification, NotificationType } from "../notification/notification.model";

const checkPhoneConflict = (user: IUser) => {
  if (user && user.phoneConflict) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This phone number is already associated with another account. Please contact support or update your phone number."
    );
  }
};

const register = async (payload: Partial<IUser>) => {
  // Age Verification (18+) if provided
  if (payload.dateOfBirth) {
    const dob = new Date(payload.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const month = today.getMonth() - dob.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 18) {
      throw new AppError(httpStatus.FORBIDDEN, "You must be at least 18 years old to register");
    }
  }

  // Check if registration is enabled globally
  const settings = await Settings.findOne();
  if (settings && !settings.isUserRegistrationEnabled) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "User registration is currently disabled by admin."
    );
  }

  const isExist = await User.findOne({ email: payload.email });
  if (isExist) {
    if (!isExist.isVerified) {
      throw new AppError(
        httpStatus.CONFLICT,
        "User already exists but email is not verified. Please verify your email to proceed."
      );
    }
    throw new AppError(httpStatus.CONFLICT, "User already exists with this email");
  }

  // Phone Normalization & Duplicate Check
  let normalizedPhone = "";
  let phoneHash = "";
  if (payload.phone) {
    normalizedPhone = normalizePhone(payload.phone);
    phoneHash = generatePhoneHash(normalizedPhone);
    
    const isPhoneExist = await User.findOne({ phoneHash });
    if (isPhoneExist) {
      throw new AppError(httpStatus.CONFLICT, "User already exists with this phone number");
    }
  }

  const hashedPassword = await bcryptjs.hash(
    payload.password as string,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour
  const verificationLastSent = new Date();

  // Set default status to pending (needs super admin approval)
  const newUser = await User.create({
    ...payload,
    phone: normalizedPhone || payload.phone,
    phoneHash: phoneHash || undefined,
    password: hashedPassword,
    status: UserStatus.PENDING,
    role: Role.USER,
    authProviders: [AuthProvider.EMAIL],
    isVerified: false,
    verificationCode,
    verificationCodeExpires,
    verificationLastSent,
  });

  await logActivity(newUser._id, "USER_REGISTER", `User registered with email ${newUser.email}`);

  await sendEmail({
    to: newUser.email,
    subject: "Verify Your Email",
    templateName: "verifyEmail",
    templateData: {
      name: newUser.fullName,
      code: verificationCode,
    },
  });

  if (newUser.phone) {
    await sendSMS(
      newUser.phone,
      `Your PoolPay verification code is: ${verificationCode}. It expires in 1 hour.`
    );
  }

  // Notify Admins about new registration
  const admins = await User.find({ role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] } });
  const adminTitle = "New User Registered";
  const adminBody = `${newUser.fullName} has registered and is pending approval.`;

  const notificationsToInsert = [];

  for (const admin of admins) {
    emitRealTimeNotification(admin._id.toString(), adminTitle, adminBody, { userId: newUser._id });
    enqueuePushNotification(admin._id.toString(), adminTitle, adminBody, { userId: newUser._id.toString() });
    notificationsToInsert.push({
      userId: admin._id,
      title: adminTitle,
      message: adminBody,
      type: NotificationType.NEW_MESSAGE
    });
  }

  if (notificationsToInsert.length > 0) {
    await Notification.insertMany(notificationsToInsert);
  }

  const user = newUser.toObject();
  const { password: _, ...userWithoutPassword } = user;

  return userWithoutPassword;
};

const verifyEmail = async (identifier: string, code: string) => {
  const identifierHash = crypto.createHash("sha256").update(identifier).digest("hex");
  const user = await User.findOne({
    $or: [{ email: identifier }, { phoneHash: identifierHash }],
  }).select("+verificationCode +verificationCodeExpires");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  checkPhoneConflict(user);

  if (user.isVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email is already verified");
  }

  // Check Cooldown
  if (user.otpCooldownUntil && user.otpCooldownUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.otpCooldownUntil.getTime() - Date.now()) / (60 * 1000));
    throw new AppError(
      httpStatus.FORBIDDEN,
      `Too many failed attempts. OTP verification is locked. Please try again in ${remainingMinutes} minutes.`
    );
  }

  if (user.verificationCode !== code) {
    const attempts = (user.otpAttempts || 0) + 1;
    const updateData: Partial<IUser> = { otpAttempts: attempts };

    if (attempts >= 5) {
      updateData.otpCooldownUntil = new Date(Date.now() + 15 * 60 * 1000);
      updateData.otpAttempts = 0;
    }

    await User.findByIdAndUpdate(user._id, updateData);
    
    const remaining = 5 - attempts;
    throw new AppError(
      httpStatus.BAD_REQUEST, 
      attempts >= 5 
        ? "Too many failed attempts. OTP verification locked for 15 minutes." 
        : `Invalid verification code. ${remaining} attempts remaining.`
    );
  }

  if (user.verificationCodeExpires && new Date() > user.verificationCodeExpires) {
    throw new AppError(httpStatus.BAD_REQUEST, "Verification code has expired");
  }

  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  user.otpAttempts = 0;
  user.otpCooldownUntil = undefined;
  await user.save();

  return { message: "Email verified successfully. Please wait for an admin to approve your account." };
};

const resendVerificationCode = async (identifier: string) => {
  const identifierHash = crypto.createHash("sha256").update(identifier).digest("hex");
  const user = await User.findOne({
    $or: [{ email: identifier }, { phoneHash: identifierHash }],
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  checkPhoneConflict(user);

  if (user.isVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email is already verified");
  }

  // Check cooldown (2 minutes)
  const now = new Date();
  if (user.verificationLastSent) {
    const timeDiff = now.getTime() - user.verificationLastSent.getTime();
    const cooldown = 2 * 60 * 1000; // 2 minutes

    if (timeDiff < cooldown) {
      const remaining = Math.ceil((cooldown - timeDiff) / 1000);
      throw new AppError(
        httpStatus.TOO_MANY_REQUESTS,
        `Please wait ${remaining} seconds before requesting a new code.`
      );
    }
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour

  user.verificationCode = verificationCode;
  user.verificationCodeExpires = verificationCodeExpires;
  user.verificationLastSent = now;
  await user.save();

  const channel = user.twoFactorChannel || VerificationChannel.EMAIL;

  await sendEmail({
    to: user.email,
    subject: "Verify Your Email",
    templateName: "verifyEmail",
    templateData: {
      name: user.fullName,
      code: verificationCode,
    },
  });

  if (user.phone) {
    await sendSMS(
      user.phone,
      `Your PoolPay verification code is: ${verificationCode}. It expires in 1 hour.`
    );
  }

  await AuditLog.create({
    entityType: EntityType.USER,
    entityId: user._id,
    action: AuditAction.ADMIN_ACTION,
    metadata: { action: "VERIFICATION_OTP_RESENT", channel }
  });

  return { message: `Verification code resent successfully to your ${channel}` };
};

const credentialsLogin = async (payload: ILoginPayload): Promise<ILoginResponse> => {
  const { identifier, password, isDashboardLogin } = payload;

  const identifierHash = crypto.createHash("sha256").update(identifier).digest("hex");

  const isUserExist = await User.findOne({
    $or: [{ email: identifier }, { phoneHash: identifierHash }],
  }).select("+password");

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User with this email or phone does not exist");
  }

  checkPhoneConflict(isUserExist);

  if (!isUserExist.isVerified) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your email is not verified. Please verify your email first."
    );
  }

  // Dashboard Access Control
  if (isDashboardLogin) {
    if (isUserExist.role !== Role.ADMIN && isUserExist.role !== Role.SUPER_ADMIN) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Access Denied: Only administrators can access the dashboard."
      );
    }
    await logActivity(isUserExist._id, "ADMIN_DASHBOARD_LOGIN_ATTEMPT", `Admin login attempt for dashboard: ${isUserExist.email}`);
  }

  if (isUserExist.status === UserStatus.PENDING) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Registration successful but your account is pending approval by an admin. Please wait."
    );
  }

  if (isUserExist.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "Your account has been blocked");
  }

  // Check Lockout
  if (isUserExist.lockoutUntil && isUserExist.lockoutUntil > new Date()) {
    const remainingMinutes = Math.ceil((isUserExist.lockoutUntil.getTime() - Date.now()) / (60 * 1000));
    throw new AppError(
      httpStatus.FORBIDDEN,
      `Too many failed attempts. Your account is locked. Please try again in ${remainingMinutes} minutes.`
    );
  }

  if (!isUserExist.password) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No password is set for this account. Please use Set Password or contact support."
    );
  }

  const isPasswordMatched = await bcryptjs.compare(
    password as string,
    isUserExist.password
  );

  if (!isPasswordMatched) {
    // Increment failed attempts
    const failedAttempts = (isUserExist.failedLoginAttempts || 0) + 1;
    const updateData: Partial<IUser> = { failedLoginAttempts: failedAttempts };

    if (failedAttempts >= 5) {
      updateData.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      updateData.failedLoginAttempts = 0; // Reset count but keep lockout
    }

    await User.findByIdAndUpdate(isUserExist._id, updateData);

    const remaining = 5 - failedAttempts;
    throw new AppError(
      httpStatus.UNAUTHORIZED, 
      failedAttempts >= 5 
        ? "Too many failed attempts. Your account has been locked for 15 minutes." 
        : `Invalid credentials. ${remaining} attempts remaining.`
    );
  }

  // Reset failed attempts on success
  if (isUserExist.failedLoginAttempts !== 0 || isUserExist.lockoutUntil) {
    await User.findByIdAndUpdate(isUserExist._id, {
      failedLoginAttempts: 0,
      lockoutUntil: null,
    });
  }

  // Check if 2FA is enabled globally and for the user (exclude dashboard logins as web dashboard has no 2FA prompt)
  const settings = await Settings.findOne();
  const isGlobal2FAEnabled = settings ? settings.isTwoFactorAuthenticationEnabled : false;

  if (!isDashboardLogin && (isGlobal2FAEnabled || isUserExist.twoFactorEnabled)) {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
    const otpExpires = new Date(Date.now() + ms(envVars.OTP_EXPIRES));

    isUserExist.twoFactorEmailCode = otpCode;
    isUserExist.twoFactorEmailCodeExpires = otpExpires;
    isUserExist.otpAttempts = 0; // Reset attempts
    await isUserExist.save();

    const channel = "Both Email & SMS";

    await sendEmail({
      to: isUserExist.email,
      subject: "Your 2FA Login Code",
      templateName: "verifyEmail",
      templateData: {
        name: isUserExist.fullName,
        code: otpCode,
      },
    });

    if (isUserExist.phone) {
      await sendSMS(
        isUserExist.phone,
        `Your PoolPay 2FA code is: ${otpCode}. Expire in ${envVars.OTP_EXPIRES}.`
      );
    }

    await AuditLog.create({
      entityType: EntityType.USER,
      entityId: isUserExist._id,
      action: AuditAction.ADMIN_ACTION,
      metadata: { action: "2FA_OTP_SENT", channel: "EMAIL_AND_SMS" }
    });

    return {
      requires2FA: true,
      email: isUserExist.email,
      phone: isUserExist.phone,
      channel,
      message: `2FA code sent to your email and phone number`,
    };
  }

  await logActivity(isUserExist._id, "USER_LOGIN", `User logged in with email ${isUserExist.email}`);

  const userTokens = createUserTokens(isUserExist, settings?.sessionTimeoutMinutes);

  const user = isUserExist.toObject();
  const { password: _, ...userWithoutPassword } = user;

  return {
    requires2FA: false,
    ...userTokens,
    user: userWithoutPassword,
  };
};

const verify2FA = async (identifier: string, code: string): Promise<ILoginResponse> => {
  const identifierHash = crypto.createHash("sha256").update(identifier).digest("hex");
  const user = await User.findOne({
    $or: [{ email: identifier }, { phoneHash: identifierHash }],
  }).select("+twoFactorEmailCode +twoFactorEmailCodeExpires +otpAttempts +otpCooldownUntil");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  checkPhoneConflict(user);

  // Check Cooldown
  if (user.otpCooldownUntil && user.otpCooldownUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.otpCooldownUntil.getTime() - Date.now()) / (60 * 1000));
    throw new AppError(
      httpStatus.FORBIDDEN,
      `Too many failed attempts. 2FA is locked. Please try again in ${remainingMinutes} minutes.`
    );
  }

  if (user.twoFactorEmailCode !== code) {
    const attempts = (user.otpAttempts || 0) + 1;
    const updateData: Partial<IUser> = { otpAttempts: attempts };

    if (attempts >= 5) {
      updateData.otpCooldownUntil = new Date(Date.now() + 15 * 60 * 1000);
      updateData.otpAttempts = 0;
    }

    await User.findByIdAndUpdate(user._id, updateData);

    const remaining = 5 - attempts;
    throw new AppError(
      httpStatus.BAD_REQUEST, 
      attempts >= 5 
        ? "Too many failed attempts. 2FA locked for 15 minutes." 
        : `Invalid 2FA code. ${remaining} attempts remaining.`
    );
  }

  if (user.twoFactorEmailCodeExpires && new Date() > user.twoFactorEmailCodeExpires) {
    throw new AppError(httpStatus.BAD_REQUEST, "2FA code has expired");
  }

  user.twoFactorEmailCode = undefined;
  user.twoFactorEmailCodeExpires = undefined;
  user.otpAttempts = 0;
  user.otpCooldownUntil = undefined;
  await user.save();

  const settings = await Settings.findOne().select("sessionTimeoutMinutes");
  const userTokens = createUserTokens(user, settings?.sessionTimeoutMinutes);

  const userData = user.toObject();
  const { password: _, ...userWithoutPassword } = userData;

  return {
    requires2FA: false,
    ...userTokens,
    user: userWithoutPassword,
  };
};

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken = await createNewAccessTokenWithRefreshToken(
    refreshToken
  );

  return {
    accessToken: newAccessToken,
  };
};

const changePassword = async (
  oldPassword: string,
  newPassword: string,
  decodedToken: JwtPayload
) => {
  const user = await User.findById(decodedToken.userId).select("+password");
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (!user.password) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This account was created using social login and has no password set. Please use 'Set Password' instead."
    );
  }

  const isOldPasswordMatch = await bcryptjs.compare(
    oldPassword,
    user.password
  );
  if (!isOldPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Old password does not match");
  }

  user.password = await bcryptjs.hash(
    newPassword,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  await user.save();
};

const resetPassword = async (
  payload: Record<string, unknown>
) => {
  const { identifier, code, newPassword } = payload;
  const identifierHash = crypto.createHash("sha256").update(identifier as string).digest("hex");

  const user = await User.findOne({
    $or: [{ email: identifier }, { phoneHash: identifierHash }],
  }).select("+password +passwordResetCode +passwordResetCodeExpires +otpAttempts +otpCooldownUntil");
  
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User doesn't exist!");
  }

  checkPhoneConflict(user);

  if (!user.password) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No password is set for this account. Please use Set Password instead."
    );
  }

  // Check Cooldown
  if (user.otpCooldownUntil && user.otpCooldownUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.otpCooldownUntil.getTime() - Date.now()) / (60 * 1000));
    throw new AppError(
      httpStatus.FORBIDDEN,
      `Too many failed attempts. Password reset is locked. Please try again in ${remainingMinutes} minutes.`
    );
  }

  if (user.passwordResetCode !== code) {
    const attempts = (user.otpAttempts || 0) + 1;
    const updateData: Partial<IUser> = { otpAttempts: attempts };

    if (attempts >= 5) {
      updateData.otpCooldownUntil = new Date(Date.now() + 15 * 60 * 1000);
      updateData.otpAttempts = 0;
    }

    await User.findByIdAndUpdate(user._id, updateData);

    const remaining = 5 - attempts;
    throw new AppError(
      httpStatus.BAD_REQUEST, 
      attempts >= 5 
        ? "Too many failed attempts. Password reset locked for 15 minutes." 
        : `Invalid reset code. ${remaining} attempts remaining.`
    );
  }

  if (user.passwordResetCodeExpires && new Date() > user.passwordResetCodeExpires) {
    throw new AppError(httpStatus.BAD_REQUEST, "Reset code has expired");
  }

  user.password = await bcryptjs.hash(
    newPassword as string,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  await user.save();
  await logActivity(user._id, "PASSWORD_RESET", "User reset their password via recovery code.");
};

const setPassword = async (userId: string, plainPassword: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (user.password) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Password already set. Please use change password instead."
    );
  }

  user.password = await bcryptjs.hash(
    plainPassword,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  await user.save();
};

const forgotPassword = async (identifier: string) => {
  const identifierHash = crypto.createHash("sha256").update(identifier).digest("hex");
  const isUserExist = await User.findOne({
    $or: [{ email: identifier }, { phoneHash: identifierHash }],
  }).select("+password");

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User with this email or phone does not exist");
  }

  checkPhoneConflict(isUserExist);

  if (!isUserExist.password) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No password is set for this account. Please use Set Password instead."
    );
  }

  if (isUserExist.status !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "User account is not active");
  }

  const passwordResetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const passwordResetCodeExpires = new Date(
    Date.now() + ms(envVars.RESET_PASS_EXPIRES)
  );

  isUserExist.passwordResetCode = passwordResetCode;
  isUserExist.passwordResetCodeExpires = passwordResetCodeExpires;
  isUserExist.otpAttempts = 0;
  await isUserExist.save();

  await sendEmail({
    to: isUserExist.email,
    subject: "Password Reset Code",
    templateName: "forgetPassword",
    templateData: {
      name: isUserExist.fullName,
      code: passwordResetCode,
    },
  });

  if (isUserExist.phone) {
    await sendSMS(
      isUserExist.phone,
      `Your PoolPay password reset code is: ${passwordResetCode}.`
    );
  }

  await AuditLog.create({
    entityType: EntityType.USER,
    entityId: isUserExist._id,
    action: AuditAction.ADMIN_ACTION,
    metadata: { action: "FORGOT_PASSWORD_OTP_SENT", channel: "EMAIL_AND_SMS" }
  });
};

export const AuthServices = {
  register,
  verifyEmail,
  resendVerificationCode,
  credentialsLogin,
  verify2FA,
  getNewAccessToken,
  changePassword,
  resetPassword,
  setPassword,
  forgotPassword,
};
