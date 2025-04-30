"use client";

import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import MenuBookIcon from "@mui/icons-material/MenuBook";

export default function Header({ username }: { username: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      router.push("/pages/login");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Sign out failed.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  return (
    <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white shadow p-4 rounded-lg mb-6 space-y-3 sm:space-y-0 sm:space-x-4">
      <div className="flex items-center space-x-2">
        <MenuBookIcon className="text-gray-500" />
        <h1 className="text-lg sm:text-xl font-semibold text-center sm:text-left text-gray-500">
          Welcome, <span className="text-blue-500">{username}</span>!
        </h1>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center justify-center bg-red-600 text-white px-5 py-2 rounded-full hover:bg-red-700 transition-all duration-200 ease-in-out transform hover:scale-105 text-sm sm:text-base"
      >
        <ExitToAppIcon className="mr-2 text-base sm:text-lg" />
        Sign Out
      </button>
    </header>
  );
}
