"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, KeyRound, Eye, EyeOff, Loader2, ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/api-auth";

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
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 font-sans">
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
      <div className="relative z-10 w-full max-w-[450px] bg-white rounded-xl shadow-2xl p-8 md:p-10 flex flex-col items-center">
        {/* Back to Login Link */}
        <div className="w-full flex justify-start mb-4">
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-[#1A227F] flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>

        {/* Header */}
        <h1 className="text-2xl md:text-3xl text-gray-800 font-medium mb-2 text-center">
          Reset Password
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8 px-4">
          {!isSuccess ? "Enter your reset code and new password to regain access." : "Your password has been successfully reset."}
        </p>

        {/* Form */}
        {!isSuccess ? (
          <form className="w-[90%] space-y-4" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-600 text-sm font-normal">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 rounded-full border-gray-300 h-12 focus-visible:ring-[#1A227F] placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-600 text-sm font-normal">
                  Reset Code
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="pl-10 rounded-full border-gray-300 h-12 focus-visible:ring-[#1A227F] placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-600 text-sm font-normal">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 rounded-full border-gray-300 h-12 focus-visible:ring-[#1A227F] placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-600 text-sm font-normal">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 rounded-full border-gray-300 h-12 focus-visible:ring-[#1A227F] placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !code || !newPassword || !confirmPassword}
              className="w-full h-12 rounded-full bg-[#1A227F] hover:bg-[#1A227F]/90 text-white font-medium text-base mt-6"
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
          <div className="w-[90%] flex flex-col items-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-medium text-gray-800 mb-2">Password Updated!</h3>
              <p className="text-sm text-gray-500">
                You can now log in with your new password.
              </p>
            </div>
            <Button
              onClick={() => router.push("/login")}
              className="w-full h-12 rounded-full bg-[#1A227F] hover:bg-[#1A227F]/90 text-white font-medium text-base"
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
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#1A227F]" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
