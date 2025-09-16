"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { getQuizLeaderboard } from "@/app/lib/quizservice";
import { useAuth } from "@/app/context/AuthContext";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { FaCrown, FaTrophy, FaMedal, FaClock, FaUser } from "react-icons/fa";

interface LeaderboardEntry {
  id: string;
  userId: string;
  DisplayName: string;
  userDisplayName: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timestamp: any;
  averageResponseTime?: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState<string>("");
  const { user } = useAuth();
  const [isSpeedRace, setIsSpeedRace] = useState<boolean>(false);

  useEffect(() => {
    const fetchLatestCompletedQuiz = async () => {
      try {
        const resultsQuery = query(
          collection(db, "quizResults"),
          orderBy("timestamp", "desc"),
          limit(1)
        );

        const snapshot = await getDocs(resultsQuery);

        if (!snapshot.empty) {
          const latestResult = snapshot.docs[0].data();
          setQuizTitle(latestResult.quizTitle);
        } else {
          // Fallback to latest uploaded quiz if no results exist
          const uploadsQuery = query(
            collection(db, "uploads"),
            orderBy("uploadedAt", "desc"),
            limit(1)
          );

          const uploadSnapshot = await getDocs(uploadsQuery);
          if (!uploadSnapshot.empty) {
            const latestUpload = uploadSnapshot.docs[0].data();
            setQuizTitle(latestUpload.quizTitle);
          } else {
            setQuizTitle("No quiz available");
          }
        }
      } catch (err) {
        console.error("Error fetching latest completed quiz:", err);
        setError("Failed to fetch the latest completed quiz.");
      }
    };

    fetchLatestCompletedQuiz();
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
        const sortedData = [...data] as LeaderboardEntry[];

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
  const formatDate = (timestamp: any, timeOnly: boolean = false) => {
    if (!timestamp) return "";

    // Firestore timestamp conversion
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    if (timeOnly) {
      return date.toLocaleTimeString();
    }

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

  // Get medal icon based on rank
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <FaCrown className="text-yellow-500 text-lg" />;
    if (rank === 2) return <FaTrophy className="text-gray-400 text-lg" />;
    if (rank === 3) return <FaMedal className="text-amber-600 text-lg" />;
    return <span className="text-sm font-bold text-gray-600">#{rank}</span>;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2">
          Quiz Leaderboard
        </h1>
        <p className="text-center text-blue-100 opacity-90">
          Compete with other Bible trivia enthusiasts
        </p>
      </div>

      {/* Quiz selector */}
      <div className="mb-6 bg-white rounded-xl p-4 shadow-md border border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <FaTrophy className="mr-2 text-yellow-500" />
          Current Quiz:
        </label>
        <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 font-medium text-gray-800">
          {quizTitle || "No quiz selected"}
        </div>
      </div>

      {isSpeedRace && (
        <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-200 shadow-sm">
          <p className="text-yellow-800 font-medium flex items-center">
            <FaClock className="mr-2 text-yellow-600" />
            This is a Speed Race Quiz! Rankings are determined first by correct
            answers, then by average response time.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-md">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading leaderboard data...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-md">
          <div className="text-red-500 text-lg font-medium mb-2">⚠️</div>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : leaderboardData.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-md">
          <div className="text-gray-400 text-4xl mb-4">🏆</div>
          <p className="text-gray-600 font-medium mb-4">
            No data available for this quiz yet.
          </p>
          {user && (
            <p className="text-blue-600 font-medium">
              Be the first to take this quiz and set a high score!
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto bg-white rounded-2xl shadow-md border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  {isSpeedRace && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Response Time
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaderboardData.map((entry, index) => {
                  const isCurrentUser = user && entry.userId === user.uid;
                  const rank = index + 1;

                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${
                        isCurrentUser
                          ? "bg-blue-50 hover:bg-blue-100"
                          : "hover:bg-gray-50"
                      } ${rank <= 3 ? "bg-gradient-to-r from-gray-50 to-white" : ""}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                            {getMedalIcon(rank)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <FaUser className="text-blue-600" />
                          </div>
                          <div>
                            <div className={`font-medium ${isCurrentUser ? "text-blue-700" : "text-gray-900"}`}>
                              {isCurrentUser ? (
                                <span className="font-semibold">
                                  {entry.DisplayName || user.email || "You"} (You)
                                </span>
                              ) : (
                                entry.DisplayName || "Anonymous User"
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-700">
                          {entry.score} / {entry.totalQuestions}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-gray-700 font-medium">
                            {entry.percentage.toFixed(1)}%
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full" 
                              style={{ width: `${entry.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      {isSpeedRace && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                            <FaClock className="mr-1 text-gray-500" />
                            {formatAverageResponseTime(entry.averageResponseTime)}
                          </span>
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

          {/* Tablet Table View */}
          <div className="hidden sm:block lg:hidden overflow-x-auto bg-white rounded-xl shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    %
                  </th>
                  {isSpeedRace && (
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaderboardData.map((entry, index) => {
                  const isCurrentUser = user && entry.userId === user.uid;
                  const rank = index + 1;

                  return (
                    <tr
                      key={entry.id}
                      className={isCurrentUser ? "bg-blue-50" : ""}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          {getMedalIcon(rank)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-32 truncate">
                          <div className={`font-medium ${isCurrentUser ? "text-blue-700" : "text-gray-900"}`}>
                            {isCurrentUser ? (
                              <span className="font-semibold">
                                {entry.DisplayName || user.email || "You"} (You)
                              </span>
                            ) : (
                              entry.DisplayName || "Anonymous User"
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDate(entry.timestamp, true)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                          {entry.score}/{entry.totalQuestions}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-700 font-medium">
                          {entry.percentage.toFixed(1)}%
                        </span>
                      </td>
                      {isSpeedRace && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs font-medium text-gray-600">
                            {formatAverageResponseTime(entry.averageResponseTime)}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-4">
            {leaderboardData.map((entry, index) => {
              const isCurrentUser = user && entry.userId === user.uid;
              const rank = index + 1;

              return (
                <div
                  key={entry.id}
                  className={`rounded-xl p-4 shadow-md border ${
                    isCurrentUser
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200"
                  } ${rank <= 3 ? "border-yellow-300 bg-gradient-to-r from-white to-amber-50" : ""}`}
                >
                  {/* Header with rank and user */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {getMedalIcon(rank)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isCurrentUser ? "text-blue-700" : "text-gray-900"
                          }`}
                        >
                          {isCurrentUser
                            ? `${
                                entry.DisplayName || user.email || "You"
                              } (You)`
                            : entry.DisplayName || "Anonymous User"}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(entry.timestamp, true)}
                    </div>
                  </div>

                  {/* Score and stats */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                        Score
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        {entry.score}/{entry.totalQuestions}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                        Percentage
                      </p>
                      <p className="text-lg font-bold text-gray-700">
                        {entry.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Speed race time */}
                  {isSpeedRace && (
                    <div className="bg-amber-50 rounded-lg p-2 mb-3">
                      <p className="text-xs text-amber-700 uppercase tracking-wider font-medium flex items-center justify-center">
                        <FaClock className="mr-1" />
                        Avg. Response Time
                      </p>
                      <p className="text-sm font-bold text-amber-700 text-center">
                        {formatAverageResponseTime(entry.averageResponseTime)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => (window.location.href = "/pages/profile")}
          className="inline-flex items-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Back to Profile
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;