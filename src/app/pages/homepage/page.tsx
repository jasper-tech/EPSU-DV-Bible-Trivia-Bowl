"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    try {
      const toastId = toast.loading("Creating account...");
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("Signup successful! 🎉", { id: toastId });
      router.push("/pages/quiz");
    } catch (err: any) {
      toast.error(err.message || "Signup failed.");
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-200 px-4">
      <h1 className="text-4xl font-bold mb-4">
        📖 Bible Trivia Bowl - Sign Up
      </h1>
      <p className="text-lg mb-6 text-center">Create your account to begin!</p>

      <input
        className="border p-2 rounded mb-4 w-full max-w-sm"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2 rounded mb-4 w-full max-w-sm"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-red-800 mb-4">{error}</p>}

      <button
        onClick={handleSignup}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Sign Up
      </button>
    </div>
  );
}
