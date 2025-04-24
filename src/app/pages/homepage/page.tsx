"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { FirebaseError } from "firebase/app";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountExists, setAccountExists] = useState(false);
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
      toast.dismiss(toastId); // Dismiss loading toast
      if (isFirebaseError(err)) {
        if (err.code === "auth/email-already-in-use") {
          setAccountExists(true);
          toast.error("Your account already exists.");
          // You can redirect to login here as well if needed
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-200 px-4">
      <h1 className="text-4xl font-bold mb-4">Bible Trivia Bowl</h1>
      <p className="text-lg mb-6 text-center">Create your account to begin!</p>

      <input
        className="border p-2 rounded mb-4 w-full max-w-sm"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

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

      {accountExists && (
        <div className="text-red-600 mb-4">
          Your account already exists.{" "}
          <Link href="/pages/login" className="text-blue-600 underline">
            Login?
          </Link>
        </div>
      )}

      <button
        onClick={handleSignup}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Sign Up
      </button>
    </div>
  );
}
