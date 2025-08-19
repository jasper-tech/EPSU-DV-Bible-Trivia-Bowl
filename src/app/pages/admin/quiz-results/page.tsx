"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";

interface QuizTitleInfo {
  title: string;
  totalResults: number;
  latestDate: string;
}

const ClearQuizResults: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [quizTitles, setQuizTitles] = useState<QuizTitleInfo[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [deleteAllMode, setDeleteAllMode] = useState(false);
  const { user } = useAuth();

  // Fetch quiz titles and their info on component mount
  useEffect(() => {
    const fetchQuizInfo = async () => {
      setInitialLoading(true);
      try {
        const resultsQuery = query(
          collection(db, "quizResults"),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(resultsQuery);

        const titleMap = new Map<
          string,
          { count: number; latestTimestamp: any }
        >();

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.quizTitle) {
            const existing = titleMap.get(data.quizTitle);
            if (
              !existing ||
              data.timestamp.seconds > existing.latestTimestamp.seconds
            ) {
              titleMap.set(data.quizTitle, {
                count: (existing?.count || 0) + 1,
                latestTimestamp: data.timestamp,
              });
            } else {
              titleMap.set(data.quizTitle, {
                ...existing,
                count: existing.count + 1,
              });
            }
          }
        });

        const titleInfo: QuizTitleInfo[] = Array.from(titleMap.entries())
          .map(([title, info]) => ({
            title,
            totalResults: info.count,
            latestDate: info.latestTimestamp.toDate().toLocaleDateString(),
          }))
          .sort((a, b) => a.title.localeCompare(b.title));

        setQuizTitles(titleInfo);
      } catch (error) {
        console.error("Error fetching quiz info:", error);
        setMessage({ type: "error", text: "Failed to load quiz information" });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchQuizInfo();
  }, []);

  const handleTitleSelection = (title: string) => {
    const newSelected = new Set(selectedTitles);
    if (newSelected.has(title)) {
      newSelected.delete(title);
    } else {
      newSelected.add(title);
    }
    setSelectedTitles(newSelected);
    setConfirmationText(""); // Reset confirmation when selection changes
  };

  const selectAll = () => {
    if (selectedTitles.size === quizTitles.length) {
      setSelectedTitles(new Set());
    } else {
      setSelectedTitles(new Set(quizTitles.map((qt) => qt.title)));
    }
    setConfirmationText("");
  };

  const getPreviewText = () => {
    if (deleteAllMode) {
      const totalResults = quizTitles.reduce(
        (sum, qt) => sum + qt.totalResults,
        0
      );
      return `Delete ALL ${totalResults} quiz results from ALL quizzes`;
    }

    if (selectedTitles.size === 0) return "No quizzes selected";

    const selectedQuizzes = quizTitles.filter((qt) =>
      selectedTitles.has(qt.title)
    );
    const totalResults = selectedQuizzes.reduce(
      (sum, qt) => sum + qt.totalResults,
      0
    );

    let preview = `Delete ${totalResults} results from ${selectedTitles.size} quiz(es)`;

    if (dateFilter) {
      preview += ` on ${new Date(dateFilter).toLocaleDateString()}`;
    }

    return preview;
  };

  const handleClearResults = async () => {
    if (!user) {
      setMessage({
        type: "error",
        text: "You must be logged in to perform this action",
      });
      return;
    }

    if (confirmationText !== "DELETE") {
      setMessage({ type: "error", text: 'Please type "DELETE" to confirm' });
      return;
    }

    if (!deleteAllMode && selectedTitles.size === 0) {
      setMessage({
        type: "error",
        text: "Please select at least one quiz to delete",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const deletePromises: Promise<void>[] = [];

      if (deleteAllMode) {
        // Delete all results
        let resultsQuery = query(collection(db, "quizResults"));

        if (dateFilter) {
          const startOfDay = new Date(dateFilter);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(dateFilter);
          endOfDay.setHours(23, 59, 59, 999);

          resultsQuery = query(
            collection(db, "quizResults"),
            where("timestamp", ">=", Timestamp.fromDate(startOfDay)),
            where("timestamp", "<=", Timestamp.fromDate(endOfDay))
          );
        }

        const snapshot = await getDocs(resultsQuery);
        snapshot.docs.forEach((docSnapshot) => {
          deletePromises.push(
            deleteDoc(doc(db, "quizResults", docSnapshot.id))
          );
        });
      } else {
        // Delete selected titles
        for (const title of selectedTitles) {
          let resultsQuery = query(
            collection(db, "quizResults"),
            where("quizTitle", "==", title)
          );

          if (dateFilter) {
            const startOfDay = new Date(dateFilter);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(dateFilter);
            endOfDay.setHours(23, 59, 59, 999);

            resultsQuery = query(
              collection(db, "quizResults"),
              where("quizTitle", "==", title),
              where("timestamp", ">=", Timestamp.fromDate(startOfDay)),
              where("timestamp", "<=", Timestamp.fromDate(endOfDay))
            );
          }

          const snapshot = await getDocs(resultsQuery);
          snapshot.docs.forEach((docSnapshot) => {
            deletePromises.push(
              deleteDoc(doc(db, "quizResults", docSnapshot.id))
            );
          });
        }
      }

      await Promise.all(deletePromises);

      setMessage({
        type: "success",
        text: `Successfully deleted ${deletePromises.length} quiz result(s)`,
      });

      // Reset form and refresh data
      setSelectedTitles(new Set());
      setConfirmationText("");
      setDeleteAllMode(false);
      setDateFilter("");

      // Refresh quiz info
      setInitialLoading(true);
      const resultsQuery = query(
        collection(db, "quizResults"),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(resultsQuery);

      const titleMap = new Map<
        string,
        { count: number; latestTimestamp: any }
      >();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.quizTitle) {
          const existing = titleMap.get(data.quizTitle);
          if (
            !existing ||
            data.timestamp.seconds > existing.latestTimestamp.seconds
          ) {
            titleMap.set(data.quizTitle, {
              count: (existing?.count || 0) + 1,
              latestTimestamp: data.timestamp,
            });
          } else {
            titleMap.set(data.quizTitle, {
              ...existing,
              count: existing.count + 1,
            });
          }
        }
      });

      const titleInfo: QuizTitleInfo[] = Array.from(titleMap.entries())
        .map(([title, info]) => ({
          title,
          totalResults: info.count,
          latestDate: info.latestTimestamp.toDate().toLocaleDateString(),
        }))
        .sort((a, b) => a.title.localeCompare(b.title));

      setQuizTitles(titleInfo);
    } catch (error) {
      console.error("Error clearing quiz results:", error);
      setMessage({
        type: "error",
        text: "Failed to clear quiz results. Please try again.",
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg text-gray-600">Loading quiz information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-4 lg:p-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 mb-2">
            Manage Quiz Results
          </h1>
          <p className="text-red-700 text-sm sm:text-base">
            ⚠️ Select quizzes to delete their results. This action cannot be
            undone.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          {/* Quick Actions */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="deleteAll"
                checked={deleteAllMode}
                onChange={(e) => {
                  setDeleteAllMode(e.target.checked);
                  if (e.target.checked) {
                    setSelectedTitles(new Set());
                  }
                  setConfirmationText("");
                }}
                className="w-4 h-4 text-red-600"
              />
              <label
                htmlFor="deleteAll"
                className="text-sm sm:text-base font-medium text-red-600"
              >
                Delete ALL Quiz Results
              </label>
            </div>

            {!deleteAllMode && (
              <button
                onClick={selectAll}
                className="text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
              >
                {selectedTitles.size === quizTitles.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            )}
          </div>

          {/* Date Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optional: Filter by specific date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setConfirmationText("");
              }}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {dateFilter && (
              <p className="text-sm text-gray-600 mt-1">
                Only results from {new Date(dateFilter).toLocaleDateString()}{" "}
                will be affected
              </p>
            )}
          </div>

          {/* Quiz Titles List */}
          {!deleteAllMode && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Available Quizzes ({quizTitles.length})
              </h3>

              {quizTitles.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">
                    No quiz results found in the database.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {quizTitles.map((quizInfo) => (
                    <div
                      key={quizInfo.title}
                      className={`flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        selectedTitles.has(quizInfo.title) ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <input
                          type="checkbox"
                          id={`quiz-${quizInfo.title}`}
                          checked={selectedTitles.has(quizInfo.title)}
                          onChange={() => handleTitleSelection(quizInfo.title)}
                          className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <label
                            htmlFor={`quiz-${quizInfo.title}`}
                            className="text-sm sm:text-base font-medium text-gray-900 cursor-pointer block truncate"
                          >
                            {quizInfo.title}
                          </label>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {quizInfo.totalResults} result(s) • Latest:{" "}
                            {quizInfo.latestDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview and Confirmation */}
          {(selectedTitles.size > 0 || deleteAllMode) && (
            <div className="mb-6 space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  ⚠️ Confirmation Required
                </h4>
                <p className="text-yellow-700 text-sm sm:text-base mb-3">
                  {getPreviewText()}
                </p>
                <div>
                  <label className="block text-sm font-medium text-yellow-800 mb-2">
                    Type &quot;DELETE&quot; to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) =>
                      setConfirmationText(e.target.value.toUpperCase())
                    }
                    placeholder="Type DELETE"
                    className="w-full sm:w-64 px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={handleClearResults}
              disabled={
                loading ||
                (!deleteAllMode && selectedTitles.size === 0) ||
                confirmationText !== "DELETE"
              }
              className={`px-6 py-3 rounded-lg font-medium transition duration-200 ${
                loading ||
                (!deleteAllMode && selectedTitles.size === 0) ||
                confirmationText !== "DELETE"
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {loading ? "Deleting..." : "Delete Selected Results"}
            </button>

            <button
              onClick={() => {
                setSelectedTitles(new Set());
                setConfirmationText("");
                setDeleteAllMode(false);
                setDateFilter("");
                setMessage(null);
              }}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition duration-200"
            >
              Reset
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div
              className={`p-4 rounded-lg mb-6 ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : message.type === "error"
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Back Button */}
          <div className="text-center pt-6 border-t">
            <button
              onClick={() => (window.location.href = "/pages/admin")}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-lg transition duration-200"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClearQuizResults;
