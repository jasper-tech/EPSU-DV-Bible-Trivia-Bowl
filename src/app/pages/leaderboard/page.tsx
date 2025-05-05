"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { getQuizLeaderboard } from "@/app/lib/quizservice";
import { useAuth } from "@/app/context/AuthContext";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

interface LeaderboardEntry {
  id: string;
  userId: string;
  userDisplayName: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timestamp: any;
  averageResponseTime?: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState<string>("");
  const { user } = useAuth();
  const [isSpeedRace, setIsSpeedRace] = useState<boolean>(false);

  useEffect(() => {
    const fetchLatestUploadedQuiz = async () => {
      try {
        const uploadsQuery = query(
          collection(db, "uploads"),
          orderBy("uploadedAt", "desc"),
          limit(1)
        );

        const snapshot = await getDocs(uploadsQuery);

        if (!snapshot.empty) {
          const latestUpload = snapshot.docs[0].data();
          setQuizTitle(latestUpload.quizTitle);
        } else {
          setQuizTitle("No quiz uploaded");
        }
      } catch (err) {
        console.error("Error fetching latest uploaded quiz:", err);
        setError("Failed to fetch the latest uploaded quiz.");
      }
    };

    fetchLatestUploadedQuiz();
  }, []);

  // Update isSpeedRace when quizTitle changes
  useEffect(() => {
    setIsSpeedRace(quizTitle.includes("- SpeedRace"));
  }, [quizTitle]);

  // Fetch leaderboard data whenever the quiz title changes
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!quizTitle) return;

      try {
        setLoading(true);
        setError(null);

        const data = await getQuizLeaderboard(quizTitle, 20);

        // Sort data based on quiz type
        let sortedData = [...data] as LeaderboardEntry[];

        if (isSpeedRace) {
          // For SpeedRace quizzes, prioritize sorting by score (descending)
          // then by response time (ascending, faster is better)
          sortedData.sort((a, b) => {
            // First compare by score (higher is better)
            if (b.score !== a.score) {
              return b.score - a.score;
            }

            // If scores are equal and both entries have response times
            if (
              a.averageResponseTime !== undefined &&
              b.averageResponseTime !== undefined
            ) {
              return a.averageResponseTime - b.averageResponseTime;
            }

            // If only one has a response time, prioritize the one with a time
            if (a.averageResponseTime !== undefined) return -1;
            if (b.averageResponseTime !== undefined) return 1;

            // Finally, fall back to timestamp if needed
            return a.timestamp.seconds - b.timestamp.seconds;
          });
        }

        setLeaderboardData(sortedData);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError("Failed to load leaderboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [quizTitle, isSpeedRace]);

  // Function to format the timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";

    // Firestore timestamp conversion
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Function to format average response time (in seconds)
  const formatAverageResponseTime = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return "N/A";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(1);

    return `${minutes}:${
      parseFloat(remainingSeconds) < 10 ? "0" : ""
    }${remainingSeconds}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Quiz Leaderboard</h1>

      {/* Quiz selector  */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quiz:
        </label>
        <div className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100">
          {quizTitle || "No quiz selected"}
        </div>
      </div>

      {isSpeedRace && (
        <div className="mb-4 bg-yellow-100 p-3 rounded-md border border-yellow-300">
          <p className="text-yellow-800 font-medium">
            This is a Speed Race Quiz! Rankings are determined first by correct
            answers, then by average response time.
          </p>
        </div>
      )}

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
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                {isSpeedRace && (
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                )}
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
                        ? "bg-blue-100"
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">
                      {entry.score} / {entry.totalQuestions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.percentage.toFixed(1)}%
                    </td>
                    {isSpeedRace && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">
                        {formatAverageResponseTime(entry.averageResponseTime)}
                      </td>
                    )}
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
