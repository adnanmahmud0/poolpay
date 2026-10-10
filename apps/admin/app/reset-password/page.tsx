"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { resetPassword } from "@/lib/api-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // If email is passed in the URL (e.g., from an email link or previous page)
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetPassword({
        email,
        code,
        newPassword
      });

      if (response.success) {
        toast.success(response.message || "Password reset successfully");
        setIsSuccess(true);
      } else {
        toast.error(response.message || "Failed to reset password");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 font-sans">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/auth.jpg"
          alt="Authentication Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Reset Password Card */}
      <div className="relative z-10 flex w-full max-w-[450px] flex-col items-center rounded-xl bg-white p-8 shadow-2xl md:p-10">
        {/* Back to Login Link */}
        <div className="mb-4 flex w-full justify-start">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-[#1A227F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>

        {/* Header */}
        <h1 className="mb-2 text-center text-2xl font-medium text-gray-800 md:text-3xl">
          Reset Password
        </h1>
        <p className="mb-8 px-4 text-center text-sm text-gray-500">
          {!isSuccess
            ? "Enter your reset code and new password to regain access."
            : "Your password has been successfully reset."}
        </p>

        {/* Form */}
        {!isSuccess ? (
          <form className="w-[90%] space-y-4" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-normal text-gray-600">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-full border-gray-300 pl-10 placeholder:text-gray-400 focus-visible:ring-[#1A227F]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-normal text-gray-600">
                  Reset Code
                </Label>
                <div className="relative">
                  <KeyRound className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="h-12 rounded-full border-gray-300 pl-10 placeholder:text-gray-400 focus-visible:ring-[#1A227F]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-normal text-gray-600">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 rounded-full border-gray-300 pr-10 pl-10 placeholder:text-gray-400 focus-visible:ring-[#1A227F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-normal text-gray-600">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 rounded-full border-gray-300 pr-10 pl-10 placeholder:text-gray-400 focus-visible:ring-[#1A227F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !code || !newPassword || !confirmPassword}
              className="mt-6 h-12 w-full rounded-full bg-[#1A227F] text-base font-medium text-white hover:bg-[#1A227F]/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        ) : (
          <div className="flex w-[90%] flex-col items-center space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Lock className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-xl font-medium text-gray-800">Password Updated!</h3>
              <p className="text-sm text-gray-500">You can now log in with your new password.</p>
            </div>
            <Button
              onClick={() => router.push("/login")}
              className="h-12 w-full rounded-full bg-[#1A227F] text-base font-medium text-white hover:bg-[#1A227F]/90"
            >
              Go to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#1A227F]" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
