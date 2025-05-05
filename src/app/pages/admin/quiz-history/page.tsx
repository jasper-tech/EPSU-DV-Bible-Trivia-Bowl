"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, FC } from "react";
import {
  db,
  collection,
  getDocs,
  doc,
  deleteDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from "@/app/lib/firebase";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import toast from "react-hot-toast";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemType: string;
}

const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  itemType,
}: DeleteConfirmDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this {itemType}? This action cannot be
          undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" autoFocus>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface QuizResult {
  id: string;
  userId?: string;
  userDisplayName?: string;
  quizTitle?: string;
  timestamp?: any; // Firestore timestamp can be in different formats
  score?: number;
  totalQuestions?: number;
  percentage?: number;
  averageResponseTime?: number;
  [key: string]: any; // For any additional fields
}

interface CategorizedQuizResults {
  [category: string]: QuizResult[];
}

const QuizHistory: FC = () => {
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [categorizedResults, setCategorizedResults] =
    useState<CategorizedQuizResults>({});
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // State for the delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteItemType, setDeleteItemType] = useState<string>("");
  const [pendingDeleteAction, setPendingDeleteAction] = useState<
    () => Promise<void>
  >(() => async () => {});

  useEffect(() => {
    const fetchQuizResults = async (): Promise<void> => {
      try {
        // Get quiz results from Firestore
        const quizResultsCollection = collection(db, "quizResults");
        const quizResultsSnapshot = await getDocs(quizResultsCollection);

        const results: QuizResult[] = [];
        quizResultsSnapshot.forEach(
          (doc: QueryDocumentSnapshot<DocumentData>) => {
            results.push({
              id: doc.id,
              ...doc.data(),
            });
          }
        );

        // Sort results by timestamp (newest first)
        results.sort((a: QuizResult, b: QuizResult) => {
          if (!a.timestamp || !b.timestamp) return 0;

          // Handle Firestore Timestamp objects
          const getTime = (timestamp: any): number => {
            if (
              timestamp &&
              typeof timestamp === "object" &&
              timestamp.toDate
            ) {
              return timestamp.toDate().getTime();
            }

            // Handle timestamp as seconds
            if (typeof timestamp === "number") {
              // If timestamp is in seconds (Firestore sometimes stores as seconds)
              if (timestamp < 10000000000) {
                return timestamp * 1000;
              }
              return timestamp;
            }

            // Handle string timestamps
            if (typeof timestamp === "string") {
              const date = new Date(timestamp);
              if (!isNaN(date.getTime())) {
                return date.getTime();
              }
            }

            return 0;
          };

          return getTime(b.timestamp) - getTime(a.timestamp);
        });

        setQuizResults(results);

        // Categorize results by quiz title
        const categorized: CategorizedQuizResults = {
          All: results,
        };

        results.forEach((result: QuizResult) => {
          const category = result.quizTitle || "Untitled Quiz";
          if (!categorized[category]) {
            categorized[category] = [];
          }
          categorized[category].push(result);
        });

        setCategorizedResults(categorized);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching quiz results:", err);
        setError("Failed to load quiz results. Please try again later.");
        setLoading(false);
      }
    };

    fetchQuizResults();
  }, []);

  const clearAllQuizResults = async (): Promise<void> => {
    try {
      setIsClearing(true);

      // Get all quiz results
      const quizResultsCollection = collection(db, "quizResults");
      const quizResultsSnapshot = await getDocs(quizResultsCollection);

      // Delete each document
      const deletePromises: Promise<void>[] = [];
      quizResultsSnapshot.forEach(
        (document: QueryDocumentSnapshot<DocumentData>) => {
          deletePromises.push(deleteDoc(doc(db, "quizResults", document.id)));
        }
      );

      await Promise.all(deletePromises);

      setQuizResults([]);
      setCategorizedResults({ All: [] });
      setActiveCategory("All");
      setIsClearing(false);
      toast.success("All quiz results have been cleared");
    } catch (err) {
      console.error("Error clearing quiz results:", err);
      setError("Failed to clear quiz results. Please try again later.");
      toast.error("Could not clear quiz results. Please try again.");

      setIsClearing(false);
    }
  };

  const clearCategoryQuizResults = async (category: string): Promise<void> => {
    if (category === "All") {
      return clearAllQuizResults();
    }

    try {
      setIsClearing(true);

      // Get document IDs for the specific category
      const docIds = categorizedResults[category].map((result) => result.id);

      // Delete each document
      const deletePromises: Promise<void>[] = [];
      docIds.forEach((id: string) => {
        deletePromises.push(deleteDoc(doc(db, "quizResults", id)));
      });

      await Promise.all(deletePromises);

      // Update local state
      const updatedResults = quizResults.filter(
        (result) => (result.quizTitle || "Untitled Quiz") !== category
      );

      setQuizResults(updatedResults);

      // Recategorize
      const updatedCategorized: CategorizedQuizResults = {
        All: updatedResults,
      };

      updatedResults.forEach((result: QuizResult) => {
        const cat = result.quizTitle || "Untitled Quiz";
        if (!updatedCategorized[cat]) {
          updatedCategorized[cat] = [];
        }
        updatedCategorized[cat].push(result);
      });

      setCategorizedResults(updatedCategorized);

      if (category === activeCategory) {
        setActiveCategory("All");
      }

      setIsClearing(false);
      toast.success(`All results for "${category}" have been cleared`);
    } catch (err) {
      console.error(
        `Error clearing quiz results for category ${category}:`,
        err
      );
      setError("Failed to clear quiz results. Please try again later.");
      toast.error(
        `Could not clear results for "${category}". Please try again.`
      );

      setIsClearing(false);
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "Unknown date";

    // Handle Firestore Timestamp objects
    if (timestamp && typeof timestamp === "object" && timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }

    // Handle timestamp as seconds or milliseconds (number)
    if (typeof timestamp === "number") {
      // If timestamp is in seconds (Firestore sometimes stores as seconds)
      if (timestamp < 10000000000) {
        return new Date(timestamp * 1000).toLocaleString();
      }
      return new Date(timestamp).toLocaleString();
    }

    // Handle string timestamps
    if (typeof timestamp === "string") {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    }

    return "Invalid date format";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg font-medium">Loading quiz results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  // Get categories for the tab navigation
  const categories = Object.keys(categorizedResults).sort((a, b) => {
    // Keep "All" at the beginning
    if (a === "All") return -1;
    if (b === "All") return 1;
    return a.localeCompare(b);
  });

  // Get current results to display based on active category
  const displayResults = categorizedResults[activeCategory] || [];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quiz History</h1>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            // Set up the delete dialog properties
            setDeleteItemType(
              activeCategory === "All"
                ? "all quiz results"
                : `all results for "${activeCategory}"`
            );

            // Store the function to call when confirmed
            setPendingDeleteAction(() =>
              activeCategory === "All"
                ? clearAllQuizResults
                : () => clearCategoryQuizResults(activeCategory)
            );

            // Open the dialog
            setDeleteDialogOpen(true);
          }}
          disabled={isClearing || displayResults.length === 0}
        >
          {isClearing
            ? "Clearing..."
            : `Clear ${
                activeCategory === "All" ? "All" : activeCategory
              } Results`}
        </button>
      </div>

      {/* Category tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex border-b border-gray-200">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 font-medium ${
                activeCategory === category
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category} ({categorizedResults[category]?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {displayResults.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No quiz results found in this category.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">User</th>
                {activeCategory === "All" && (
                  <th className="py-2 px-4 border-b text-left">Quiz Title</th>
                )}
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Score</th>
                <th className="py-2 px-4 border-b text-left">Percentage</th>
                <th className="py-2 px-4 border-b text-left">
                  Avg Response Time
                </th>
                <th className="py-2 px-4 border-b text-left">
                  Total Questions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayResults.map((result: QuizResult) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">
                    {result.userDisplayName || result.userId || "Anonymous"}
                  </td>
                  {activeCategory === "All" && (
                    <td className="py-2 px-4 border-b">
                      {result.quizTitle || "Untitled Quiz"}
                    </td>
                  )}
                  <td className="py-2 px-4 border-b">
                    {formatDate(result.timestamp)}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {result.score || 0} / {result.totalQuestions || 0}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {result.percentage || 0}%
                  </td>
                  <td className="py-2 px-4 border-b">
                    {result.averageResponseTime?.toFixed(2) || 0} sec
                  </td>
                  <td className="py-2 px-4 border-b">
                    {result.totalQuestions || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {displayResults.length > 0 && (
        <div className="mt-4">
          <p className="text-gray-500 text-sm">
            {activeCategory === "All"
              ? `Total results: ${displayResults.length}`
              : `Total results for "${activeCategory}": ${displayResults.length}`}
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          pendingDeleteAction();
          setDeleteDialogOpen(false);
        }}
        itemType={deleteItemType}
      />
    </div>
  );
};

export default QuizHistory;
