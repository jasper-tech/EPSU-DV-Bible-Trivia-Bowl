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
    <header className="bg-white shadow-md rounded-xl p-5 mb-8 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-sm">
            <MenuBookIcon className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Bible Trivia App
            </h1>
            <p className="text-xl font-semibold text-gray-800">
              Welcome, <span className="text-blue-600">{username}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isSigningOut}
          className="flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl transition-all duration-200 ease-in-out shadow-sm hover:shadow-md disabled:opacity-70 group min-w-[120px]"
        >
          <ExitToAppIcon className="mr-2 text-white" />
          <span className="font-medium">
            {isSigningOut ? "Signing Out..." : "Sign Out"}
          </span>
        </button>
      </div>
    </header>
  );
}