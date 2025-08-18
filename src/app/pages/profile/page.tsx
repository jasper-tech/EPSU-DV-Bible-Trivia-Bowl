"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Dashboard from "@/app/components/dashboard";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import GitHubIcon from "@mui/icons-material/GitHub";
import { FaBell, FaExclamationTriangle } from "react-icons/fa";

export default function ProfilePage() {
  const [username, setUsername] = useState<string>("Loading...");
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [dashboardKey, setDashboardKey] = useState(0);

  const previousQuizState = useRef<any>(null);

  const router = useRouter();

  // Monitor active quizzes in real-time with enhanced debugging and force refresh
  useEffect(() => {
    console.log("Setting up quiz monitoring...");

    const q = query(collection(db, "quizzes"), where("activeQuiz", "==", 1));

    const unsubscribeQuiz = onSnapshot(
      q,
      (querySnapshot) => {
        console.log("Quiz snapshot received:", {
          empty: querySnapshot.empty,
          size: querySnapshot.size,
          docs: querySnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
          })),
        });

        const wasQuizActive = previousQuizState.current !== null;

        if (!querySnapshot.empty) {
          // Get the first active quiz
          const activeQuizDoc = querySnapshot.docs[0];
          const newActiveQuiz = {
            id: activeQuizDoc.id,
            ...activeQuizDoc.data(),
          };

          console.log("Setting active quiz:", newActiveQuiz);
          setActiveQuiz(newActiveQuiz);
          previousQuizState.current = newActiveQuiz;

          // Force Dashboard component reload if quiz just became available
          if (!wasQuizActive) {
            console.log(
              "Quiz just became available - reloading Dashboard component"
            );
            setTimeout(() => {
              console.log("Executing Dashboard component reload for new quiz");
              setDashboardKey((prev) => prev + 1);
            }, 500);
          }
        } else {
          console.log("No active quiz found, setting to null");
          setActiveQuiz(null);
          previousQuizState.current = null;
        }
        setQuizLoading(false);
      },
      (error) => {
        console.error("Error monitoring active quiz:", error);
        setActiveQuiz(null);
        previousQuizState.current = null;
        setQuizLoading(false);
      }
    );

    // Cleanup function
    return () => {
      console.log("Cleaning up quiz monitoring...");
      unsubscribeQuiz();
    };
  }, []); // Removed activeQuiz dependency since we're using ref

  // Add effect to log state changes
  // useEffect(() => {
  //   console.log("Quiz state changed:", { activeQuiz, quizLoading });
  // }, [activeQuiz, quizLoading]);

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

  // Memoize QuizPrompt
  const QuizPrompt = useCallback(() => {
    if (quizLoading) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-center">
          <CircularProgress size={20} className="mr-2" />
          <span className="text-blue-700">Checking for active quizzes...</span>
        </div>
      );
    }

    if (activeQuiz) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-pulse">
          <div className="flex items-center">
            <FaBell className="text-green-600 text-xl mr-3" />
            <div>
              <h3 className="text-green-800 font-semibold text-lg">
                🎉 Quiz Available Now!
              </h3>
              <p className="text-green-700">
                {activeQuiz.quizTitle || "Bible Trivia Quiz"} is now live! Click
                the Quiz tile below to participate.
              </p>
              {activeQuiz.description && (
                <p className="text-green-600 text-sm mt-1">
                  {activeQuiz.description}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <FaExclamationTriangle className="text-yellow-600 text-xl mr-3" />
          <div>
            <h3 className="text-yellow-800 font-semibold">No Active Quiz</h3>
            <p className="text-yellow-700">
              There&apos;s no quiz available at the moment. Check back later or
              wait for an announcement!
            </p>
          </div>
        </div>
      </div>
    );
  }, [quizLoading, activeQuiz]);

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
          <main className="max-w-4xl mx-auto">
            <QuizPrompt />
            <Dashboard
              key={dashboardKey}
              activeQuiz={activeQuiz}
              quizLoading={quizLoading}
            />
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
