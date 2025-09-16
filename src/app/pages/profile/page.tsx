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
import { FaBell, FaExclamationTriangle, FaCrown, FaBook, FaFire } from "react-icons/fa";

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
        <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 border-l-4 border-blue-500 rounded-xl p-6 mb-8 flex items-center shadow-md hover:shadow-lg transition-all duration-500 animate-pulse">
          <div className="mr-5">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full flex items-center justify-center shadow-inner">
              <CircularProgress size={24} className="text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-blue-800 font-bold text-lg">Scanning for Quizzes</h3>
            <p className="text-blue-600 text-sm mt-1">Searching for active Bible challenges...</p>
          </div>
          <div className="ml-auto">
            <div className="w-6 h-6 bg-blue-300 rounded-full animate-bounce"></div>
          </div>
        </div>
      );
    }

    if (activeQuiz) {
      return (
        <div className="relative bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 border-l-4 border-green-500 rounded-xl p-6 mb-8 shadow-md hover:shadow-lg transition-all duration-500 transform hover:-translate-y-1 group">
          <div className="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-green-300 rounded-full opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 -mb-6 -ml-6 bg-green-400 rounded-full opacity-30"></div>
          
          <div className="flex items-start relative z-10">
            <div className="bg-gradient-to-r from-green-300 to-teal-300 p-4 rounded-full mr-5 flex-shrink-0 shadow-md">
              <FaBell className="text-white text-2xl" />
            </div>
            <div className="flex-grow">
              <h3 className="text-green-900 font-extrabold text-2xl mb-2 flex items-center">
                <span className="mr-3">🎉 Quiz Available Now!</span>
                <span className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                  LIVE NOW
                </span>
              </h3>
              <p className="text-green-800 mb-3 text-lg">
                <span className="font-black bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {activeQuiz.quizTitle || "Bible Trivia Challenge"}
                </span> is now active! Test your knowledge of scripture.
              </p>
              {activeQuiz.description && (
                <div className="bg-white bg-opacity-70 p-4 rounded-xl border border-green-200 shadow-sm mb-4">
                  <p className="text-green-700 text-sm">{activeQuiz.description}</p>
                </div>
              )}
              <button className="mt-4 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 group-hover:shadow-2xl flex items-center">
                <FaFire className="mr-2" />
                Join Quiz Now
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-r from-amber-100 via-orange-100 to-yellow-100 border-l-4 border-amber-500 rounded-xl p-6 mb-8 shadow-md hover:shadow-lg transition-all duration-500 group">
        <div className="flex items-start">
          <div className="bg-gradient-to-r from-amber-300 to-orange-300 p-4 rounded-full mr-5 flex-shrink-0 shadow-md">
            <FaExclamationTriangle className="text-white text-2xl" />
          </div>
          <div>
            <h3 className="text-amber-900 font-extrabold text-2xl mb-2">No Active Quiz</h3>
            <p className="text-amber-800 mb-3 text-lg">
              There&apos;s no quiz available at the moment. Check back later for new challenges!
            </p>
            <div className="bg-white bg-opacity-70 p-4 rounded-xl border border-amber-200 shadow-sm mt-4">
              <p className="text-amber-700 text-sm flex items-center">
                <FaCrown className="mr-3 text-amber-500 text-lg" />
                <span>While you wait, why not review the Leaderboard?</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }, [quizLoading, activeQuiz]);


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Header username={username} />

      <div className="flex-grow p-4 md:p-6 lg:p-8">
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="60vh"
          >
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FaBook className="text-blue-600 text-3xl" />
                </div>
              </div>
              <p className="text-gray-600 font-medium mt-6 text-lg">Loading your spiritual journey...</p>
              <p className="text-gray-400 mt-2">Preparing Bible wisdom for you</p>
            </div>
          </Box>
        ) : (
          <main className="max-w-6xl mx-auto">
            {/* Removed the showWelcome block here */}

            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black text-gray-800 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Bible Trivia Dashboard
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Test your knowledge, climb the leaderboard, and deepen your understanding of Scripture
              </p>
            </div>
            
            <QuizPrompt />
            
            <Dashboard
              key={dashboardKey}
              activeQuiz={activeQuiz}
              quizLoading={quizLoading}
            />
          </main>
        )}
      </div>

      <footer className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200 py-8 w-full mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between text-gray-600">
            <div className="flex items-center mb-4 md:mb-0">
              <a
                href="https://github.com/Jasper-tech"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:text-blue-600 transition-colors font-semibold group"
                title="Jasper-tech on GitHub"
              >
                <div className="bg-gray-100 p-3 rounded-xl mr-3 group-hover:bg-blue-100 transition-colors shadow-sm">
                  <GitHubIcon className="text-gray-600 group-hover:text-blue-600" />
                </div>
                <span className="font-bold">Jasper-tech</span>
              </a>
            </div>
            <div className="font-black text-gray-700 mb-4 md:mb-0 flex items-center text-lg">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg mr-2">
                <FaBook className="text-white" />
              </div>
              Bible Trivia App
            </div>
            <div className="text-sm font-medium">© {new Date().getFullYear()} All rights reserved</div>
          </div>
        </div>
      </footer>
    </div>
  );
}