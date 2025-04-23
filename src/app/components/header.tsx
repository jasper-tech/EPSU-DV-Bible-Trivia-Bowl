"use client";

import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Header({ username }: { username: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully 👋");
      router.push("/pages/login");
    } catch (err: any) {
      toast.error(err.message || "Sign out failed.");
    }
  };

  return (
    <header className="flex justify-between items-center bg-white shadow p-4 rounded mb-6">
      <h1 className="text-xl font-semibold">Welcome, {username}!</h1>
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Sign Out
      </button>
    </header>
  );
}
