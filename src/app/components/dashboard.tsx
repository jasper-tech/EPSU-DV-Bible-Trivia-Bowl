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

  // const handleAchievementsTileClick = () => {
  //   toast("Loading your achievements...");

  //   setTargetPath("/pages/achievements");
  //   setLoadingMessage("Loading Your Achievements...");
  //   setManualLoading(true);
  // };

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
    <section className="bg-white shadow p-6 rounded-lg w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quiz Tile */}
        <div
          onClick={handleQuizTileClick}
          className={`
            cursor-pointer transition-all duration-200 p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center relative
            ${
              isQuizDisabled
                ? "bg-gray-100 opacity-60 hover:bg-gray-200"
                : "bg-blue-100 hover:bg-blue-200 hover:shadow-lg"
            }
          `}
        >
          {isQuizDisabled && (
            <div className="absolute top-2 right-2">
              <FaLock className="text-gray-400 text-lg" />
            </div>
          )}

          <FaBible
            className={`${
              isQuizDisabled ? "text-gray-600" : "text-blue-600"
            } text-5xl mb-4`}
          />
          <h3
            className={`text-xl font-semibold mb-2 ${
              isQuizDisabled ? "text-gray-600" : "text-blue-700"
            }`}
          >
            Bible Trivia Bowl
          </h3>
          <p className={isQuizDisabled ? "text-gray-600" : "text-blue-600"}>
            {quizLoading
              ? "Checking availability..."
              : !activeQuiz
              ? "No active quiz"
              : questionsLoading
              ? "Loading quiz..."
              : error
              ? "Quiz unavailable"
              : "Take the quiz!"}
          </p>

          {activeQuiz && !isQuizDisabled && (
            <div className="mt-2">
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                🔴 LIVE
              </span>
            </div>
          )}
        </div>

        {/* Leaderboard Tile */}
        <div
          onClick={handleLeaderboardTileClick}
          className="cursor-pointer bg-yellow-100 hover:bg-yellow-200 transition-colors p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center hover:shadow-lg"
        >
          <FaCrown className="text-yellow-600 text-5xl mb-4" />
          <h3 className="text-xl font-semibold text-yellow-700 mb-2">
            Leaderboard
          </h3>
          <p className="text-yellow-600">See top performers!</p>
        </div>

        {/* Achievements Tile */}
        {/* <div
          onClick={handleAchievementsTileClick}
          className="cursor-pointer bg-green-100 hover:bg-green-200 transition-colors p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center hover:shadow-lg"
        >
          <FaTrophy className="text-green-600 text-5xl mb-4" />
          <h3 className="text-xl font-semibold text-green-700 mb-2">
            Achievements
          </h3>
          <p className="text-green-600">View your achievements!</p>
        </div> */}
      </div>
    </section>
  );
}
