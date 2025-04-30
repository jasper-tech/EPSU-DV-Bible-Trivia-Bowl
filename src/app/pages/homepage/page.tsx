"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

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
            {/* Replaced text heading with MUI Bible icon for smaller screens */}
            <div className="flex justify-center mb-3">
              <MenuBookIcon style={{ fontSize: 64, color: "#2563EB" }} />
            </div>
            <p className="text-gray-600 text-sm mt-2">Test your knowledge!</p>
          </div>

          <h2 className="text-xl font-bold text-blue-600 mb-6">
            Create Your Account
          </h2>

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <PersonIcon style={{ fontSize: 20, color: "#9CA3AF" }} />
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
                <EmailIcon style={{ fontSize: 20, color: "#9CA3AF" }} />
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
                <LockIcon style={{ fontSize: 20, color: "#9CA3AF" }} />
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
