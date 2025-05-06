"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { getQuizLeaderboard } from "@/app/lib/quizservice";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import toast from "react-hot-toast";
import {
  FaTrashAlt,
  FaDownload,
  FaFilter,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

interface LeaderboardEntry {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail?: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timestamp: any;
  averageResponseTime?: number;
}

interface AdminLeaderboardProps {
  backToAdmin?: () => void;
}

const AdminLeaderboard: React.FC<AdminLeaderboardProps> = ({ backToAdmin }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quizTitles, setQuizTitles] = useState<string[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string>("");
  const { user } = useAuth();
  const [isSpeedRace, setIsSpeedRace] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [minScore, setMinScore] = useState<string>("");
  const [maxScore, setMaxScore] = useState<string>("");
  const [sortField, setSortField] = useState<string>("score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const router = useRouter();

  // Fetch all available quizzes
  useEffect(() => {
    const fetchQuizTitles = async () => {
      try {
        const quizQuery = query(
          collection(db, "quizzes"),
          orderBy("quizTitle", "asc")
        );

        const quizSnapshot = await getDocs(quizQuery);
        const titles = quizSnapshot.docs.map((doc) => doc.data().quizTitle);

        // Get unique titles
        const uniqueTitles = Array.from(new Set(titles));
        setQuizTitles(uniqueTitles);

        // Select the first quiz by default if available
        if (uniqueTitles.length > 0 && !selectedQuiz) {
          setSelectedQuiz(uniqueTitles[0]);
        }
      } catch (err) {
        console.error("Error fetching quiz titles:", err);
        setError("Failed to fetch quiz titles.");
      }
    };

    fetchQuizTitles();
  }, [selectedQuiz]);

  // Update isSpeedRace when selectedQuiz changes
  useEffect(() => {
    setIsSpeedRace(selectedQuiz.includes("- SpeedRace"));
  }, [selectedQuiz]);

  // Fetch leaderboard data whenever the selected quiz changes
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!selectedQuiz) return;

      try {
        setLoading(true);
        setError(null);

        const data = await getQuizLeaderboard(selectedQuiz, 100);
        setLeaderboardData(data);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError("Failed to load leaderboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [selectedQuiz]);

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

  // Function to delete an entry
  const deleteEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, "quiz_results", id));
      setLeaderboardData((prevData) =>
        prevData.filter((entry) => entry.id !== id)
      );
      toast.success("Entry deleted successfully");
      setDeleteModalOpen(false);
      setEntryToDelete(null);
    } catch (err) {
      console.error("Error deleting entry:", err);
      toast.error("Failed to delete entry");
    }
  };

  // Function to export leaderboard data as CSV
  const exportToCSV = () => {
    if (leaderboardData.length === 0) return;

    const headers = [
      "Rank",
      "User",
      "Email",
      "Score",
      "Percentage",
      ...(isSpeedRace ? ["Response Time"] : []),
      "Date",
    ].join(",");

    const csvData = leaderboardData
      .map((entry, index) => {
        return [
          index + 1,
          `"${entry.userDisplayName || "Anonymous User"}"`,
          `"${entry.userEmail || "N/A"}"`,
          `${entry.score}/${entry.totalQuestions}`,
          `${entry.percentage.toFixed(1)}%`,
          ...(isSpeedRace
            ? [formatAverageResponseTime(entry.averageResponseTime)]
            : []),
          `"${formatDate(entry.timestamp)}"`,
        ].join(",");
      })
      .join("\n");

    const csv = `${headers}\n${csvData}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedQuiz}_leaderboard.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort data
  const filteredAndSortedData = React.useMemo(() => {
    let filtered = [...leaderboardData];

    // Apply score filters if provided
    if (minScore) {
      filtered = filtered.filter((entry) => entry.score >= parseInt(minScore));
    }

    if (maxScore) {
      filtered = filtered.filter((entry) => entry.score <= parseInt(maxScore));
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "score":
          comparison = b.score - a.score; // Higher scores first
          break;
        case "percentage":
          comparison = b.percentage - a.percentage;
          break;
        case "responseTime":
          if (
            a.averageResponseTime !== undefined &&
            b.averageResponseTime !== undefined
          ) {
            comparison = a.averageResponseTime - b.averageResponseTime; // Faster times first
          }
          break;
        case "date":
          comparison = a.timestamp.seconds - b.timestamp.seconds;
          break;
        default:
          comparison = b.score - a.score;
      }

      return sortDirection === "asc" ? -comparison : comparison;
    });
  }, [leaderboardData, minScore, maxScore, sortField, sortDirection]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <FaChevronUp className="inline ml-1" />
    ) : (
      <FaChevronDown className="inline ml-1" />
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">
        Admin Leaderboard Management
      </h1>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-start">
        {/* Quiz selector */}
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Quiz:
          </label>
          <select
            value={selectedQuiz}
            onChange={(e) => setSelectedQuiz(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {quizTitles.map((title, index) => (
              <option key={index} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 ml-auto mt-4 md:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded transition duration-200"
          >
            {showFilters ? <FaTimes /> : <FaFilter />}
            <span className="ml-2">
              {showFilters ? "Hide Filters" : "Filters"}
            </span>
          </button>

          <button
            onClick={exportToCSV}
            disabled={leaderboardData.length === 0}
            className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaDownload />
            <span className="ml-2">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-gray-100 p-4 rounded-md mb-6">
          <h3 className="font-medium mb-3">Filter Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Score:
              </label>
              <input
                type="number"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Score:
              </label>
              <input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By:
              </label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="score">Score</option>
                <option value="percentage">Percentage</option>
                {isSpeedRace && (
                  <option value="responseTime">Response Time</option>
                )}
                <option value="date">Date</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {isSpeedRace && (
        <div className="mb-4 bg-yellow-100 p-3 rounded-md border border-yellow-300">
          <p className="text-yellow-800 font-medium">
            Speed Race Quiz: Rankings are determined first by correct answers,
            then by average response time.
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
      ) : filteredAndSortedData.length === 0 ? (
        <div className="text-center py-8 bg-white shadow-lg rounded-lg p-6">
          <p className="text-gray-600">No data available for this quiz yet.</p>
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
                <th
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort("score")}
                >
                  Score {getSortIcon("score")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort("percentage")}
                >
                  Percentage {getSortIcon("percentage")}
                </th>
                {isSpeedRace && (
                  <th
                    className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort("responseTime")}
                  >
                    Response Time {getSortIcon("responseTime")}
                  </th>
                )}
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort("date")}
                >
                  Date {getSortIcon("date")}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedData.map((entry, index) => {
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
                      <div>
                        <span
                          className={
                            isCurrentUser ? "font-semibold text-blue-700" : ""
                          }
                        >
                          {entry.userDisplayName || "Anonymous User"}
                          {isCurrentUser && " (You)"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.userEmail || "No email"}
                      </div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setEntryToDelete(entry.id);
                          setDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900 ml-2"
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-center">
        <div className="mt-6 text-center">
          <button
            onClick={backToAdmin || (() => router.push("/pages/admin"))}
            className="bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded transition duration-200"
          >
            Back to Admin Panel
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete this leaderboard entry? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => entryToDelete && deleteEntry(entryToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaderboard;
