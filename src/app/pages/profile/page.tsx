"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Dashboard from "@/app/components/dashboard";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>("Loading...");
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUsername("Loading...");

        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUsername(userData.name || currentUser.email || "User");
          } else {
            setUsername(currentUser.email || "User");
          }
        } catch (error) {
          console.error("Error fetching user name:", error);
          setUsername(currentUser.email || "User");
        }

        setLoading(false);
      } else {
        router.push("/pages/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Header username={username} />

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="60vh"
        >
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <main>
          <Dashboard />
        </main>
      )}
    </div>
  );
}
