"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaBible, FaTrophy } from "react-icons/fa";
import LoadingScreen from "./loadingscreen";
import { useFetchQuestions } from "../Data/samplequestions";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [loadingMessage, setLoadingMessage] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (manualLoading && loadingMessage && targetPath) {
      const timeout = setTimeout(() => {
        router.push(targetPath);
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [manualLoading, loadingMessage, targetPath]);

  const { loading: questionsLoading, error } = useFetchQuestions();

  const handleTileClick = (path: string, message: string) => {
    if (questionsLoading) {
      toast("Please wait, quiz is still loading...");
      return;
    }
    if (error) {
      toast.error("Quiz not available at the moment.");
      return;
    }

    setTargetPath(path);
    setLoadingMessage(message);
    setManualLoading(true);
  };

  if (manualLoading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return (
    <section className="bg-white shadow p-6 rounded-lg w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quiz Tile */}
        <div
          onClick={() => handleTileClick("/pages/quiz", "Preparing Quiz...")}
          className="cursor-pointer bg-blue-100 hover:bg-blue-200 transition-colors p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center hover:shadow-lg"
        >
          <FaBible className="text-blue-600 text-5xl mb-4" />
          <h3 className="text-xl font-semibold text-blue-700 mb-2">
            Bible Trivia Bowl
          </h3>
          <p className="text-blue-600">
            Test your Bible knowledge and earn rewards!
          </p>
        </div>

        {/* Achievements Tile */}
        <div
          onClick={() =>
            handleTileClick("/pages/achievements", "Loading Achievements...")
          }
          className="cursor-pointer bg-green-100 hover:bg-green-200 transition-colors p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center hover:shadow-lg"
        >
          <FaTrophy className="text-green-600 text-5xl mb-4" />
          <h3 className="text-xl font-semibold text-green-700 mb-2">
            Achievements
          </h3>
          <p className="text-green-600">View your achievements!</p>
        </div>
      </div>
    </section>
  );
}
