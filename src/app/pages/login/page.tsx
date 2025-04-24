"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { doc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const toastId = toast.loading("Signing in...");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Get role from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;

        toast.success("Login successful!", { id: toastId });

        if (role === "admin") {
          router.push("/pages/admin");
        } else {
          router.push("/pages/profile");
        }
      } else {
        toast.error("User data not found.", { id: toastId });
      }
    } catch (err: unknown) {
      let errorMessage = "Login failed.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-100 px-4 py-6">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Login to Trivia Bowl
      </h1>
      <p className="text-lg mb-6 text-center">
        Welcome back! Let’s test your Bible knowledge.
      </p>

      {/* Email Input */}
      <div className="w-full max-w-sm mb-4">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email Address
        </label>
        <input
          id="email"
          className="border p-2 rounded w-full mt-2"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Password Input */}
      <div className="w-full max-w-sm mb-4">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password"
          className="border p-2 rounded w-full mt-2"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {/* Error Message */}
      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

      {/* Login Button */}
      <button
        onClick={handleLogin}
        className="bg-green-600 text-white px-4 py-2 rounded w-full max-w-sm hover:bg-green-700"
      >
        Log In
      </button>
    </div>
  );
}
