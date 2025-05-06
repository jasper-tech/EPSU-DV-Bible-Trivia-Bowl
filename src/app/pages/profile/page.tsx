"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Dashboard from "@/app/components/dashboard";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import GitHubIcon from "@mui/icons-material/GitHub";

export default function ProfilePage() {
  const [username, setUsername] = useState<string>("Loading...");
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
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
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header username={username} />

      <div className="flex-grow p-6">
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

      <footer className="bg-white border-t border-gray-200 py-4 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between text-gray-600 text-sm">
            <div className="flex items-center mb-2 md:mb-0">
              <a
                href="https://github.com/Jasper-tech"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:text-blue-600 transition-colors"
                title="Jasper-tech on GitHub"
              >
                <GitHubIcon fontSize="small" />
                <span className="ml-2">Jasper-tech</span>
              </a>
            </div>
            <div className="font-semibold">Bible-Trivia-App</div>
            <div>© {new Date().getFullYear()} All rights reserved</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
