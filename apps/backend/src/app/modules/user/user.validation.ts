import z from "zod";
import { Role, UserStatus, KYCStatus } from "./user.interface";

export const createUserZodSchema = z.object({
  body: z.object({
    fullName: z
      .string({ message: "Name must be string" })
      .min(2, { message: "Name must be at least 2 characters long." })
      .max(50, { message: "Name cannot exceed 50 characters." }),
    email: z
      .string({ message: "Email must be string" })
      .email({ message: "Invalid email address format." })
      .min(5, { message: "Email must be at least 5 characters long." })
      .max(100, { message: "Email cannot exceed 100 characters." }),
    password: z
      .string({ message: "Password must be string" })
      .min(8, { message: "Password must be at least 8 characters long." })
      .regex(/^(?=.*[A-Z])/, {
        message: "Password must contain at least 1 uppercase letter.",
      })
      .regex(/^(?=.*[!@#$%^&*])/, {
        message: "Password must contain at least 1 special character.",
      })
      .regex(/^(?=.*\d)/, {
        message: "Password must contain at least 1 number.",
      }),
    phone: z
      .string({ message: "Phone Number must be string" })
      .regex(
        /^\+\d+/,
        "Phone number must include a country code (e.g., +1234567890)"
      )
      .optional(),
    address: z
      .string({ message: "Address must be string" })
      .max(200, { message: "Address cannot exceed 200 characters." })
      .optional(),
  }),
});

export const updateUserZodSchema = z.object({
  body: z.object({
    firstName: z
      .string({ message: "First name must be string" })
      .min(1, { message: "First name cannot be empty" })
      .max(50, { message: "First name cannot exceed 50 characters." })
      .optional(),
    lastName: z
      .string({ message: "Last name must be string" })
      .min(1, { message: "Last name cannot be empty" })
      .max(50, { message: "Last name cannot exceed 50 characters." })
      .optional(),
    fullName: z
      .string({ message: "Full name must be string" })
      .min(2, { message: "Full name must be at least 2 characters long." })
      .max(100, { message: "Full name cannot exceed 100 characters." })
      .optional(),
    phone: z
      .string({ message: "Phone Number must be string" })
      .regex(
        /^\+\d+/,
        "Phone number must include a country code (e.g., +1234567890)"
      )
      .optional(),
    profileImage: z
      .string({ message: "Profile image URL must be string" })
      .optional(),
    dateOfBirth: z
      .string()
      .optional()
      .transform((val) =>
        val && val.trim() !== "" ? new Date(val) : undefined
      )
      .refine(
        (date) => {
          if (!date) return true;
          const today = new Date();
          let age = today.getFullYear() - date.getFullYear();
          const month = today.getMonth() - date.getMonth();
          if (month < 0 || (month === 0 && today.getDate() < date.getDate())) {
            age--;
          }
          return age >= 18;
        },
        {
          message: "You must be at least 18 years old.",
        }
      ),
    occupation: z.string({ message: "Occupation must be string" }).optional(),
    address: z
      .string({ message: "Address must be string" })
      .max(200, { message: "Address cannot exceed 200 characters." })
      .optional(),
    streetAddress: z
      .string({ message: "Street address must be string" })
      .optional(),
    city: z.string({ message: "City must be string" }).optional(),
    state: z.string({ message: "State must be string" }).optional(),
    zipCode: z.string({ message: "Zip code must be string" }).optional(),
    language: z
      .enum(["English", "Spanish", "French", "Haitian Creole"])
      .optional(),
    role: z.enum(Object.values(Role) as [string, ...string[]]).optional(),
    status: z
      .enum(Object.values(UserStatus) as [string, ...string[]])
      .optional(),
    kycStatus: z
      .enum(Object.values(KYCStatus) as [string, ...string[]])
      .optional(),
    documentType: z.string().optional(),
    documentUrl: z.string().url().optional(),
    twoFactorEnabled: z.boolean().optional(),
    fcmToken: z.string().optional(),
  }),
});

export const suspendUserZodSchema = z.object({
  body: z.object({}),
});

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
  suspendUserZodSchema,
};
