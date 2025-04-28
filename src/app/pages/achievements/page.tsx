"use client";

import React, { useState, useEffect } from "react";
import { getAvailableQuizzes, getQuizLeaderboard } from "@/app/lib/quizservice";
import { useAuth } from "@/app/context/AuthContext";

interface UserScoreEntry {
  id: string;
  userId: string;
  userDisplayName: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timestamp: any;
}

const UserAchievements: React.FC = () => {
  const [userScores, setUserScores] = useState<UserScoreEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [availableQuizzes, setAvailableQuizzes] = useState<string[]>([]);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  const { user } = useAuth();

  // Fetch all available quizzes
  useEffect(() => {
    const fetchAvailableQuizzes = async () => {
      try {
        const quizzes = await getAvailableQuizzes();
        setAvailableQuizzes(quizzes);
      } catch (err) {
        console.error("Error fetching available quizzes:", err);
      }
    };

    fetchAvailableQuizzes();
  }, []);

  useEffect(() => {
    const fetchUserQuizzes = async () => {
      if (!user || availableQuizzes.length === 0) return;

      try {
        setLoading(true);

        const userCompletedQuizzes = [];

        for (const quiz of availableQuizzes) {
          const leaderboardData = await getQuizLeaderboard(quiz);

          const hasUserEntries = leaderboardData.some(
            (entry: UserScoreEntry) => entry.userId === user.uid
          );

          if (hasUserEntries) {
            userCompletedQuizzes.push(quiz);
          }
        }

        setCompletedQuizzes(userCompletedQuizzes);

        // Set the first completed quiz as default if none selected
        if (
          userCompletedQuizzes.length > 0 &&
          (!quizTitle || !userCompletedQuizzes.includes(quizTitle))
        ) {
          setQuizTitle(userCompletedQuizzes[0]);
        }
      } catch (err) {
        console.error("Error fetching user quizzes:", err);
        setError("Failed to load your quiz data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserQuizzes();
  }, [user, availableQuizzes]);

  // Fetch user's scores for the selected quiz
  useEffect(() => {
    const fetchUserScores = async () => {
      if (!user || !quizTitle) return;

      try {
        setLoading(true);
        setError(null);

        // Get all scores for this quiz
        const allScores = await getQuizLeaderboard(quizTitle);

        const typedScores = allScores as UserScoreEntry[];

        const currentUserScores = typedScores.filter(
          (entry) => entry.userId === user.uid
        );

        setUserScores(currentUserScores);
      } catch (err) {
        console.error("Error fetching user scores:", err);
        setError("Failed to load your scores. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserScores();
  }, [user, quizTitle]);

  // Function to format the timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";

    // Firestore timestamp conversion
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Calculate best score
  const getBestScore = () => {
    if (userScores.length === 0) return null;
    return userScores.reduce(
      (max, score) => (score.percentage > max.percentage ? score : max),
      userScores[0]
    );
  };

  const bestScore = getBestScore();

  if (!user) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-6">Your Quiz Achievements</h1>
        <div className="bg-white shadow-lg rounded-lg p-6">
          <p className="text-gray-600">
            Please log in to view your achievements.
          </p>
          <button
            onClick={() => (window.location.href = "/pages/login")}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">
        Your Quiz Achievements
      </h1>

      {loading && completedQuizzes.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading your quizzes...</p>
        </div>
      ) : completedQuizzes.length === 0 ? (
        <div className="text-center py-8 bg-white shadow-lg rounded-lg p-6">
          <p className="text-gray-600">
            You haven&apos;t taken any quizzes yet.
          </p>{" "}
          <button
            onClick={() => (window.location.href = "/pages/quiz")}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200"
          >
            Take a Quiz Now
          </button>
        </div>
      ) : (
        <>
          {/* Quiz selector dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Quiz:
            </label>
            <select
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {completedQuizzes.map((quiz) => (
                <option key={quiz} value={quiz}>
                  {quiz}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2">Loading your scores...</p>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : (
            <>
              {/* Achievement Summary */}
              {bestScore && (
                <div className="mb-8 bg-gradient-to-r from-blue-100 to-indigo-100 shadow-lg rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 text-blue-800">
                    Achievement Summary
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow">
                      <p className="text-sm text-gray-500">Best Score</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {bestScore.score} / {bestScore.totalQuestions}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <p className="text-sm text-gray-500">Best Percentage</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {bestScore.percentage.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <p className="text-sm text-gray-500">Total Attempts</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {userScores.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Score History */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <h2 className="text-xl font-semibold p-4 bg-gray-50 border-b">
                  Your Score History
                </h2>
                {userScores.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-600">
                      No scores available for this quiz.
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attempt
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Percentage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {userScores
                        .sort((a, b) => {
                          // Sort by timestamp (newest first)
                          const dateA =
                            a.timestamp && a.timestamp.toDate
                              ? a.timestamp.toDate()
                              : new Date(a.timestamp);
                          const dateB =
                            b.timestamp && b.timestamp.toDate
                              ? b.timestamp.toDate()
                              : new Date(b.timestamp);
                          return dateB.getTime() - dateA.getTime();
                        })
                        .map((entry, index) => (
                          <tr
                            key={entry.id}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.score} / {entry.totalQuestions}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.percentage.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(entry.timestamp)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </>
      )}

      <div className="mt-6 text-center space-x-4">
        <button
          onClick={() => (window.location.href = "/pages/leaderboard")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200"
        >
          View Leaderboard
        </button>
        <button
          onClick={() => (window.location.href = "/pages/profile")}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded transition duration-200"
        >
          Back to Profile
        </button>
      </div>
    </div>
  );
};

export default UserAchievements;
