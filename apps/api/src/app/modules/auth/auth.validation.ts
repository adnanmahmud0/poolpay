import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const registerValidationSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be valid").regex(/^\+\d+/, "Phone number must include a country code (e.g., +1234567890)"),
    password: passwordSchema,
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions",
    }),
    agreeToForfeitOnRemoval: z.boolean().optional().default(true),
    agreeToSms: z.boolean().optional().default(false),
    dateOfBirth: z.string().optional().transform((val) => val && val.trim() !== "" ? new Date(val) : undefined).refine((date) => {
      if (!date) return true;
      const today = new Date();
      let age = today.getFullYear() - date.getFullYear();
      const month = today.getMonth() - date.getMonth();
      if (month < 0 || (month === 0 && today.getDate() < date.getDate())) {
        age--;
      }
      return age >= 18;
    }, {
      message: "You must be at least 18 years old to register",
    }),
  }),
});

const loginValidationSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Email or phone number is required"),
    password: z.string().min(1, "Password is required"),
    isDashboardLogin: z.boolean().optional(),
  }),
});

const verify2FAValidationSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Email or phone number is required"),
    code: z.string().length(6, "2FA Code must be 6 digits"),
  }),
});

const changePasswordValidationSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: passwordSchema,
  }),
});

const forgotPasswordValidationSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Email or phone number is required"),
  }),
});

const resetPasswordValidationSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Email or phone number is required"),
    newPassword: passwordSchema,
    code: z.string().length(6, "Code must be 6 digits"),
  }),
});

const verifyEmailSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Email or phone number is required"),
    code: z.string().length(6, "Verification code must be 6 digits"),
  }),
});

const resendVerificationCodeSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Email or phone number is required"),
  }),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

const setPasswordSchema = z.object({
  body: z.object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const AuthValidation = {
  registerValidationSchema,
  loginValidationSchema,
  verify2FAValidationSchema,
  changePasswordValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
  verifyEmailSchema,
  resendVerificationCodeSchema,
  refreshTokenSchema,
  setPasswordSchema,
};
