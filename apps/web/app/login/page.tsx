"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api-auth";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      router.push("/dashboard");
    }

    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setIdentifier(rememberedEmail);
      setRememberMe(true);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await login({
        identifier,
        password,
        isDashboardLogin: true,
      });

      if (response.success) {
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        if (rememberMe) {
          localStorage.setItem("rememberedEmail", identifier);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        toast.success(response.message || "Logged in successfully");
        router.push("/dashboard");
      } else {
        toast.error(response.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
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
        {/* Optional overlay if the image needs darkening/lightening */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[450px] bg-white rounded-xl shadow-2xl p-8 md:p-10 flex flex-col items-center">
        {/* Header */}
        <h1 className="text-2xl md:text-3xl text-gray-800 font-medium mb-8">
          Login Here
        </h1>


        {/* Form */}
        <form className="w-[90%] space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-600 text-sm font-normal">
                Email / Phone Number
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  id="email"
                  type="text"
                  placeholder="Enter your @ Email"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 rounded-full border-gray-300 h-12 focus-visible:ring-[#1A227F] placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-600 text-sm font-normal">
                Password
              </Label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-gray-500 flex items-center justify-center">
                  <div className="w-5 h-5 border-[1.5px] border-gray-500 rounded-full flex items-center justify-center overflow-hidden">
                    <div className="flex gap-[2px] mb-[2px]">
                      <div className="w-[2px] h-[2px] bg-gray-500 rounded-full" />
                      <div className="w-[2px] h-[2px] bg-gray-500 rounded-full" />
                      <div className="w-[2px] h-[2px] bg-gray-500 rounded-full" />
                    </div>
                  </div>
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 rounded-full border-gray-300 h-12 w-full focus-visible:ring-[#1A227F] placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-gray-300 data-[state=checked]:bg-[#1A227F] data-[state=checked]:border-[#1A227F]"
              />
              <Label
                htmlFor="remember"
                className="text-xs text-gray-500 font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </Label>
            </div>

            <Link
              href="/forgot-password"
              className="text-xs text-gray-500 font-normal hover:text-[#1A227F] hover:underline"
            >
              Forgot Password ?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-full bg-[#1A227F] hover:bg-[#1A227F]/90 text-white font-medium text-base mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
