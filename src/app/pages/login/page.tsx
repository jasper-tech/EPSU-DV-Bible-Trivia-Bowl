"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const toastId = toast.loading("Signing in...");
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful!", { id: toastId });
      router.push("/pages/profile");
    } catch (err: any) {
      toast.error(err.message || "Login failed.");
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-100 px-4">
      <h1 className="text-4xl font-bold mb-4">🔐 Login to Trivia Bowl</h1>
      <p className="text-lg mb-6 text-center">
        Welcome back! Let’s test your Bible knowledge.
      </p>

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

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <button
        onClick={handleLogin}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Log In
      </button>
    </div>
  );
}
