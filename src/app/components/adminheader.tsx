"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaSignOutAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

interface UserData {
  name: string;
  role: string;
  image: string;
}

const AdminHeader = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const data = userSnap.data() as UserData;

          if (data.role === "admin") {
            setUserData(data);
          } else {
            toast.error("Access denied. Admins only.");
            router.push("/unauthorized");
          }
        } else {
          toast.error("User data not found.");
        }
      } else {
        toast.error("You must be logged in.");
        router.push("/pages/login");
      }

      setLoading(false);
    };

    fetchUserData();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully.");
      router.push("/pages/login");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out.");
    }
  };

  return (
    <header className="w-full bg-gray-900 text-white px-4 py-3 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
      {/* User Info Section (Left) */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
          <Image
            src={userData?.image || "/default-profile.png"}
            alt="Profile"
            width={40}
            height={40}
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-base">
            {loading ? "Loading..." : userData?.name}
          </span>
        </div>
      </div>

      {/* Role + Sign Out Section (Right) */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-4">
        <p className="text-sm text-gray-400">
          {loading ? "Loading role..." : `Quizmaster | ${userData?.role}`}
        </p>
        <button
          onClick={handleSignOut}
          className="flex items-center text-red-400 hover:text-red-600 text-sm"
        >
          <FaSignOutAlt className="mr-1" />
          Sign Out
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
