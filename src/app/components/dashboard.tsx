"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaBible, FaLock, FaCrown } from "react-icons/fa";
import LoadingScreen from "./loadingscreen";
import { useFetchQuestions } from "../Data/samplequestions";
import toast from "react-hot-toast";

interface DashboardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeQuiz: any;
  quizLoading: boolean;
}

export default function Dashboard({ activeQuiz, quizLoading }: DashboardProps) {
  const [loadingMessage, setLoadingMessage] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (manualLoading && loadingMessage && targetPath) {
      const timeout = setTimeout(() => {
        router.push(targetPath);
      }, 2000);

      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualLoading, loadingMessage, targetPath]);

  const { loading: questionsLoading, error } = useFetchQuestions();

  const handleQuizTileClick = () => {
    // Check if quiz monitoring is still loading
    if (quizLoading) {
      toast.loading("Checking quiz availability...");
      return;
    }

    // Check if there's an active quiz
    if (!activeQuiz) {
      toast.error(
        "No quiz is currently active. Please wait for an announcement!"
      );
      return;
    }

    // Check if questions are still loading
    if (questionsLoading) {
      toast.loading("Please wait, Bible quiz is still loading...");
      return;
    }

    // Check for errors
    if (error) {
      toast.error("Bible quiz not available at the moment.");
      return;
    }

    // All checks passed, proceed to quiz
    toast.success("Launching quiz...");
    setTargetPath("/pages/quiz");
    setLoadingMessage("Preparing Bible Quiz...");
    setManualLoading(true);
  };

  const handleLeaderboardTileClick = () => {
    toast("Loading leaderboard...");

    setTargetPath("/pages/leaderboard");
    setLoadingMessage("Loading Leaderboard...");
    setManualLoading(true);
  };

  const isQuizDisabled =
    quizLoading || !activeQuiz || questionsLoading || error;

  if (manualLoading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return (
    <section className="bg-gradient-to-br from-white to-blue-50 shadow-md p-8 rounded-2xl w-full max-w-4xl mx-auto border border-blue-100">
      <h2 className="text-3xl font-black mb-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Bible Challenge Hub
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {/* Quiz Tile */}
        <div
          onClick={handleQuizTileClick}
          onMouseEnter={() => setIsHovered("quiz")}
          onMouseLeave={() => setIsHovered(null)}
          className={`
            cursor-pointer transition-all duration-300 p-8 rounded-2xl flex flex-col items-center justify-center text-center relative
            overflow-hidden group
            ${
              isQuizDisabled
                ? "bg-gradient-to-br from-gray-100 to-gray-200 opacity-80"
                : "bg-gradient-to-br from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200"
            }
            ${isHovered === "quiz" && !isQuizDisabled ? "transform hover:-translate-y-2 shadow-lg" : "shadow-md"}
          `}
        >
          {/* Animated background elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-indigo-200 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"></div>
          
          {isQuizDisabled && (
            <div className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-sm">
              <FaLock className="text-gray-500 text-lg" />
            </div>
          )}

          <div className={`
            p-5 rounded-2xl mb-5 transition-all duration-300
            ${isQuizDisabled 
              ? "bg-gray-300" 
              : "bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:from-blue-600 group-hover:to-indigo-600"
            }
            ${isHovered === "quiz" && !isQuizDisabled ? "transform scale-110" : ""}
          `}>
            <FaBible
              className={`${isQuizDisabled ? "text-gray-600" : "text-white"} text-4xl`}
            />
          </div>
          
          <h3
            className={`text-2xl font-bold mb-3 ${
              isQuizDisabled ? "text-gray-600" : "text-blue-800"
            }`}
          >
            Bible Trivia Bowl
          </h3>
          
          <p className={`mb-4 ${isQuizDisabled ? "text-gray-600" : "text-blue-700"}`}>
            {quizLoading
              ? "Checking availability..."
              : !activeQuiz
              ? "No active quiz"
              : questionsLoading
              ? "Loading quiz..."
              : error
              ? "Quiz unavailable"
              : "Test your knowledge now!"}
          </p>

          {activeQuiz && !isQuizDisabled && (
            <div className="mt-2">
              <span className="inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-sm">
                <span className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></span>
                🔴 LIVE NOW
              </span>
            </div>
          )}
          
          {!isQuizDisabled && (
            <div className="mt-5 w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-1000 group-hover:w-full w-3/4"></div>
            </div>
          )}
        </div>

        {/* Leaderboard Tile */}
        <div
          onClick={handleLeaderboardTileClick}
          onMouseEnter={() => setIsHovered("leaderboard")}
          onMouseLeave={() => setIsHovered(null)}
          className="cursor-pointer bg-gradient-to-br from-amber-100 to-yellow-100 hover:from-amber-200 hover:to-yellow-200 transition-all duration-300 p-8 rounded-2xl flex flex-col items-center justify-center text-center shadow-md hover:shadow-lg group overflow-hidden relative hover:-translate-y-2"
        >
          {/* Animated background elements */}
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-200 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-amber-200 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"></div>

          <div className="p-5 rounded-2xl mb-5 bg-gradient-to-r from-yellow-400 to-amber-400 group-hover:from-yellow-500 group-hover:to-amber-500 transition-all duration-300">
            <FaCrown className="text-white text-4xl" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-yellow-800">Leaderboard</h3>
          <p className="mb-4 text-yellow-700">See the top scorers and your ranking!</p>
          <div className="mt-5 w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-yellow-400 to-amber-400 h-2.5 rounded-full transition-all duration-1000 group-hover:w-full w-2/3"></div>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="mt-10 text-center">
        <p className="text-gray-600 italic">&quot;Test your knowledge, strengthen your faith&quot;</p>
      </div>
    </section>
  );
}