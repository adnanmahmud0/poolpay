"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { login } from "@/lib/api-auth";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        isDashboardLogin: true
      });

      if (response.success) {
        if (!response.data?.accessToken) {
          toast.error(response.message || "Authentication token missing. Please try again.");
          return;
        }

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
        {/* Optional overlay if the image needs darkening/lightening */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 flex w-full max-w-[450px] flex-col items-center rounded-xl bg-white p-8 shadow-2xl md:p-10">
        {/* Header */}
        <h1 className="mb-8 text-2xl font-medium text-gray-800 md:text-3xl">Login Here</h1>

        {/* Form */}
        <form className="w-[90%] space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-normal text-gray-600">
                Email / Phone Number
              </Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <Input
                  id="email"
                  type="text"
                  placeholder="Enter your @ Email"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-12 rounded-full border-gray-300 pl-10 placeholder:text-gray-400 focus-visible:ring-[#1A227F]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-normal text-gray-600">
                Password
              </Label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center justify-center text-gray-500">
                  <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-gray-500">
                    <div className="mb-[2px] flex gap-[2px]">
                      <div className="h-[2px] w-[2px] rounded-full bg-gray-500" />
                      <div className="h-[2px] w-[2px] rounded-full bg-gray-500" />
                      <div className="h-[2px] w-[2px] rounded-full bg-gray-500" />
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
                  className="h-12 w-full rounded-full border-gray-300 pr-10 pl-10 placeholder:text-gray-400 focus-visible:ring-[#1A227F]"
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
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-gray-300 data-[state=checked]:border-[#1A227F] data-[state=checked]:bg-[#1A227F]"
              />
              <Label
                htmlFor="remember"
                className="text-xs leading-none font-normal text-gray-500 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </Label>
            </div>

            <Link
              href="/forgot-password"
              className="text-xs font-normal text-gray-500 hover:text-[#1A227F] hover:underline"
            >
              Forgot Password ?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="mt-2 h-12 w-full rounded-full bg-[#1A227F] text-base font-medium text-white hover:bg-[#1A227F]/90"
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
