"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { forgotPassword } from "@/lib/api-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await forgotPassword({ identifier: email });

      if (response.success) {
        toast.success(response.message || "Password reset email sent successfully");
        setIsSuccess(true);
      } else {
        toast.error(response.message || "Failed to send password reset email");
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
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

      {/* Forgot Password Card */}
      <div className="relative z-10 flex w-full max-w-[450px] flex-col items-center rounded-xl bg-white p-8 shadow-2xl md:p-10">
        {/* Back to Login Link */}
        <div className="mb-6 flex w-full justify-start">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-[#1A227F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>

        {/* Header */}
        <h1 className="mb-4 text-center text-2xl font-medium text-gray-800 md:text-3xl">
          Forgot Password
        </h1>
        <p className="mb-8 px-4 text-center text-sm text-gray-500">
          Enter your email address and we'll send you instructions to reset your password.
        </p>

        {/* Form */}
        {!isSuccess ? (
          <form className="w-[90%] space-y-6" onSubmit={handleForgotPassword}>
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
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="mt-4 h-12 w-full rounded-full bg-[#1A227F] text-base font-medium text-white hover:bg-[#1A227F]/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Code"
              )}
            </Button>
          </form>
        ) : (
          <div className="flex w-[90%] flex-col items-center space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-xl font-medium text-gray-800">Check your email</h3>
              <p className="text-sm text-gray-500">
                We have sent a password reset link to{" "}
                <span className="font-medium text-gray-800">{email}</span>
              </p>
            </div>
            <Button
              onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
              className="h-12 w-full rounded-full bg-[#1A227F] text-base font-medium text-white hover:bg-[#1A227F]/90"
            >
              Enter Reset Code
            </Button>
            <Button
              onClick={() => router.push("/login")}
              className="h-12 w-full rounded-full bg-gray-100 text-base font-medium text-gray-800 hover:bg-gray-200"
            >
              Return to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
