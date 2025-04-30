"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LoadingScreen from "@/app/components/loadingscreen";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const { login, error, loading, user } = useAuth();

  useEffect(() => {
    if (user && isNavigating) {
    }
  }, [user, isNavigating]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsNavigating(true);
    await login(email, password);
  };

  if (isNavigating && user) {
    return <LoadingScreen message="Please wait..." />;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      {/* Left side with illustration for larger screens */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 justify-center items-center p-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Bible Trivia Bowl
          </h1>

          <div className="w-full max-w-md mx-auto bg-white/10 p-8 rounded-lg shadow-lg">
            <div className="flex justify-center mb-6">
              <MenuBookIcon style={{ fontSize: 128, color: "white" }} />
            </div>
            <p className="text-blue-100 text-lg">
              Test your knowledge, challenge friends, and explore the Bible in a
              fun, engaging way.
            </p>
          </div>
        </div>
      </div>

      {/* Right side with form */}
      <div className="w-full lg:w-1/2 flex justify-center items-center p-4 md:p-8">
        <div className="bg-white rounded-xl shadow-xl p-6 md:p-10 w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-3">
              <MenuBookIcon style={{ fontSize: 64, color: "#2563EB" }} />
            </div>
            <p className="text-gray-600 text-sm mt-2">Welcome back!</p>
          </div>

          <h2 className="text-2xl font-bold text-blue-600 mb-2">Sign In</h2>
          <p className="text-gray-600 mb-6">
            Ready to test your biblical knowledge?
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <EmailIcon style={{ fontSize: 20, color: "#9CA3AF" }} />
              </div>
              <input
                id="email"
                type="email"
                className="border border-gray-300 rounded-lg p-4 pl-10 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <LockIcon style={{ fontSize: 20, color: "#9CA3AF" }} />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="border border-gray-300 rounded-lg p-4 pl-10 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <VisibilityOffIcon
                    style={{ fontSize: 20, color: "#9CA3AF" }}
                    className="hover:text-gray-600"
                  />
                ) : (
                  <VisibilityIcon
                    style={{ fontSize: 20, color: "#9CA3AF" }}
                    className="hover:text-gray-600"
                  />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <Link
                  href="/pages/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-lg font-medium transition-colors duration-300 shadow-md hover:shadow-lg disabled:opacity-70"
              disabled={loading || isNavigating}
            >
              {loading
                ? "Signing in..."
                : isNavigating
                ? "Redirecting..."
                : "Sign In"}
            </button>

            <div className="text-center pt-4">
              <p className="text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>

          {/* <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-500 text-sm">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
