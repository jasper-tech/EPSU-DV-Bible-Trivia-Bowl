"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebase";
import toast from "react-hot-toast";
import Link from "next/link";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import EmailIcon from "@mui/icons-material/Email";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Sending reset email...");

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!", { id: toastId });
      setEmailSent(true);
    } catch (error: unknown) {
      let errorMessage = "Failed to send reset email.";

      if (error instanceof Error) {
        if (error.message.includes("auth/user-not-found")) {
          errorMessage = "No account found with this email address.";
        } else if (error.message.includes("auth/invalid-email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message.includes("auth/too-many-requests")) {
          errorMessage = "Too many requests. Please try again later.";
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
        <div className="w-full flex justify-center items-center p-4 md:p-8">
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-10 w-full max-w-md text-center">
            <div className="flex justify-center mb-6">
              <CheckCircleIcon style={{ fontSize: 64, color: "#059669" }} />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Check Your Email
            </h2>

            <p className="text-gray-600 mb-6">
              We&apos;ve sent a password reset link to{" "}
              <span className="font-medium text-blue-600">{email}</span>
            </p>

            <p className="text-sm text-gray-500 mb-8">
              Didn&apos;t receive the email? Check your spam folder or try
              again.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors duration-300"
              >
                Try Different Email
              </button>

              <Link
                href="/pages/login"
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors duration-300 text-center"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
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
              Forgot your password? No worries! We&apos;ll help you get back to
              exploring the Bible.
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
            <p className="text-gray-600 text-sm mt-2">Reset your password</p>
          </div>

          <div className="mb-6">
            <Link
              href="/pages/login"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <ArrowBackIcon style={{ fontSize: 20 }} className="mr-2" />
              Back to Sign In
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-blue-600 mb-2">
            Reset Password
          </h2>
          <p className="text-gray-600 mb-6">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>

          <form onSubmit={handleResetPassword} className="space-y-5">
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

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-lg font-medium transition-colors duration-300 shadow-md hover:shadow-lg disabled:opacity-70"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Email"}
            </button>

            <div className="text-center pt-4">
              <p className="text-gray-600">
                Remember your password?{" "}
                <Link
                  href="/pages/login"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-500 text-sm">
              Need help?{" "}
              <Link href="/contact" className="text-blue-600 hover:underline">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
