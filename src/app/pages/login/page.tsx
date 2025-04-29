"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, loading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    await login(email, password);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      {/* Left side with illustration for larger screens */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-400 justify-center items-center p-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Bible Trivia Bowl
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Welcome back! Continue your biblical knowledge journey.
          </p>
          <div className="w-full max-w-md mx-auto bg-white/10 p-8 rounded-lg shadow-lg">
            <div className="flex justify-center mb-6">
              <svg
                className="w-32 h-32 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
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
            <h1 className="text-xl font-bold text-gray-700">
              Bible Trivia Bowl
            </h1>
            <p className="text-gray-600 text-sm mt-2">Welcome back!</p>
          </div>

          <h2 className="text-2xl font-bold text-blue-600 mb-2">Sign In</h2>
          <p className="text-gray-600 mb-6">
            Ready to test your biblical knowledge?
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail size={20} className="text-gray-400" />
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
                <Lock size={20} className="text-gray-400" />
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
                  <EyeOff
                    size={20}
                    className="text-gray-400 hover:text-gray-600"
                  />
                ) : (
                  <Eye
                    size={20}
                    className="text-gray-400 hover:text-gray-600"
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
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
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
