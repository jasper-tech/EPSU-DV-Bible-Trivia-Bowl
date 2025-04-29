"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountExists, setAccountExists] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isFirebaseError = (err: unknown): err is FirebaseError => {
    return (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      typeof (err as FirebaseError).code === "string"
    );
  };

  const handleSignup = async () => {
    setAccountExists(false);
    setIsSubmitting(true);

    const toastId = toast.loading("Creating account...");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        createdAt: serverTimestamp(),
      });

      toast.success("Signup successful! 🎉", { id: toastId });
      router.push("/pages/profile");
    } catch (err: unknown) {
      toast.dismiss(toastId);
      if (isFirebaseError(err)) {
        if (err.code === "auth/email-already-in-use") {
          setAccountExists(true);
          toast.error("Your account already exists.");
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      {/* Left side with illustration for larger screens */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 justify-center items-center p-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Bible Trivia Bowl
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Test your knowledge and challenge friends in the ultimate Bible
            trivia experience!
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
              Join thousands of players exploring biblical knowledge in a fun,
              engaging way.
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
            <p className="text-gray-600 text-sm mt-2">Test your knowledge!</p>
          </div>

          <h2 className="text-xl font-bold text-blue-600 mb-6">
            Create Your Account
          </h2>

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User size={20} className="text-gray-400" />
              </div>
              <input
                className="border border-gray-300 rounded-lg p-4 pl-10 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail size={20} className="text-gray-400" />
              </div>
              <input
                className="border border-gray-300 rounded-lg p-4 pl-10 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock size={20} className="text-gray-400" />
              </div>
              <input
                className="border border-gray-300 rounded-lg p-4 pl-10 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {accountExists && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                Account already exists.{" "}
                <Link
                  href="/pages/login"
                  className="font-medium text-red-700 hover:text-red-800 underline"
                >
                  Login instead
                </Link>
              </div>
            )}

            <button
              onClick={handleSignup}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-lg font-medium transition-colors duration-300 shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </button>

            <div className="text-center mt-6">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/pages/login"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>

          {/* <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-500 text-sm">
              By signing up, you agree to our{" "}
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
