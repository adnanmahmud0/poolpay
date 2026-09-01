"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/api-auth";

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

      {/* Forgot Password Card */}
      <div className="relative z-10 w-full max-w-[450px] bg-white rounded-xl shadow-2xl p-8 md:p-10 flex flex-col items-center">
        {/* Back to Login Link */}
        <div className="w-full flex justify-start mb-6">
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-[#1A227F] flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>

        {/* Header */}
        <h1 className="text-2xl md:text-3xl text-gray-800 font-medium mb-4 text-center">
          Forgot Password
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8 px-4">
          Enter your email address and we'll send you instructions to reset your password.
        </p>

        {/* Form */}
        {!isSuccess ? (
          <form className="w-[90%] space-y-6" onSubmit={handleForgotPassword}>
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
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full h-12 rounded-full bg-[#1A227F] hover:bg-[#1A227F]/90 text-white font-medium text-base mt-4"
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
          <div className="w-[90%] flex flex-col items-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-medium text-gray-800 mb-2">Check your email</h3>
              <p className="text-sm text-gray-500">
                We have sent a password reset link to <span className="font-medium text-gray-800">{email}</span>
              </p>
            </div>
            <Button
              onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
              className="w-full h-12 rounded-full bg-[#1A227F] hover:bg-[#1A227F]/90 text-white font-medium text-base"
            >
              Enter Reset Code
            </Button>
            <Button
              onClick={() => router.push("/login")}
              className="w-full h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-base"
            >
              Return to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
