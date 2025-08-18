"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

export default function Header({ username }: { username: string }) {
  const { logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsSigningOut(false);
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
        disabled={isSigningOut}
        className="flex items-center justify-center bg-red-600 text-white px-5 py-2 rounded-full hover:bg-red-700 transition-all duration-200 ease-in-out transform hover:scale-105 text-sm sm:text-base disabled:opacity-70"
      >
        <ExitToAppIcon className="mr-2 text-base sm:text-lg" />
        {isSigningOut ? "Signing Out..." : "Sign Out"}
      </button>
    </header>
  );
}
