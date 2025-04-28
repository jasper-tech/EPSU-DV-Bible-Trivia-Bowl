"use client";

import React, { useState, useEffect } from "react";
import { getQuizLeaderboard, getAvailableQuizzes } from "@/app/lib/quizservice";
import { useAuth } from "@/app/context/AuthContext";

interface LeaderboardEntry {
  id: string;
  userId: string;
  userDisplayName: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timestamp: any;
}

const Leaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [availableQuizzes, setAvailableQuizzes] = useState<string[]>([]);
  const { user } = useAuth();

  // Fetch available quizzes
  useEffect(() => {
    const fetchAvailableQuizzes = async () => {
      try {
        const quizzes = await getAvailableQuizzes();
        setAvailableQuizzes(quizzes);

        // Set the first quiz as default if none selected
        if (quizzes.length > 0 && !quizTitle) {
          setQuizTitle(quizzes[0]);
        }
      } catch (err) {
        console.error("Error fetching available quizzes:", err);
      }
    };

    fetchAvailableQuizzes();
  }, []);

  // Fetch leaderboard data whenever the quiz title changes
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!quizTitle) return;

      try {
        setLoading(true);
        setError(null);

        const data = await getQuizLeaderboard(quizTitle, 20);

        setLeaderboardData(data as LeaderboardEntry[]);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError("Failed to load leaderboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [quizTitle]);

  // Function to format the timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";

    // Firestore timestamp conversion
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Quiz Leaderboard</h1>

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
          {availableQuizzes.length > 0 ? (
            availableQuizzes.map((quiz) => (
              <option key={quiz} value={quiz}>
                {quiz}
              </option>
            ))
          ) : (
            <option value="">No quizzes available</option>
          )}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading leaderboard data...</p>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : leaderboardData.length === 0 ? (
        <div className="text-center py-8 bg-white shadow-lg rounded-lg p-6">
          <p className="text-gray-600">No data available for this quiz yet.</p>
          {user && (
            <p className="mt-4 text-blue-600">
              Be the first to take this quiz and set a high score!
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
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
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboardData.map((entry, index) => {
                const isCurrentUser = user && entry.userId === user.uid;

                return (
                  <tr
                    key={entry.id}
                    className={
                      isCurrentUser
                        ? "bg-blue-100" // Highlight current user's row
                        : index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {isCurrentUser ? (
                        <span className="font-semibold text-blue-700">
                          {entry.userDisplayName || user.email || "You"} (You)
                        </span>
                      ) : (
                        entry.userDisplayName || "Anonymous User"
                      )}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-center">
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

export default Leaderboard;
