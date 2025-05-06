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
import { useRouter } from "next/navigation";
import ViewQuizDialog from "@/app/components/viewquizdialog";

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

interface Quiz {
  id: string;
  quizTitle: string;
  questions: {
    questionId: string;
    text: string;
    answers: {
      id: string;
      text: string;
    }[];
    correctAnswerId: string;
  }[];
  createdAt: any;
  [key: string]: any;
}

interface CategorizedQuizzes {
  [category: string]: Quiz[];
}

const QuizzesDashboard: FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [categorizedQuizzes, setCategorizedQuizzes] =
    useState<CategorizedQuizzes>({});
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const router = useRouter();

  // State for the delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteItemType, setDeleteItemType] = useState<string>("");
  const [pendingDeleteAction, setPendingDeleteAction] = useState<
    () => Promise<void>
  >(() => async () => {});

  // State for the view quiz dialog
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    const fetchQuizzes = async (): Promise<void> => {
      try {
        // Get quizzes from Firestore
        const quizzesCollection = collection(db, "quizzes");
        const quizzesSnapshot = await getDocs(quizzesCollection);

        const results: Quiz[] = [];
        quizzesSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          results.push({
            id: doc.id,
            quizTitle: data.quizTitle || "Untitled Quiz",
            questions: data.questions || [],
            createdAt: data.createdAt,
            ...data,
          });
        });

        // Sort quizzes by creation timestamp (newest first)
        results.sort((a: Quiz, b: Quiz) => {
          if (!a.createdAt || !b.createdAt) return 0;

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

          return getTime(b.createdAt) - getTime(a.createdAt);
        });

        setQuizzes(results);

        // Categorize quizzes by creation month
        const categorized: CategorizedQuizzes = {
          All: results,
        };

        // Group by month
        results.forEach((quiz: Quiz) => {
          let dateStr = "Unknown Date";

          if (quiz.createdAt) {
            const date = quiz.createdAt.toDate
              ? quiz.createdAt.toDate()
              : new Date(
                  typeof quiz.createdAt === "number"
                    ? quiz.createdAt < 10000000000
                      ? quiz.createdAt * 1000
                      : quiz.createdAt
                    : quiz.createdAt
                );

            dateStr = date.toLocaleString("default", {
              month: "long",
              year: "numeric",
            });
          }

          if (!categorized[dateStr]) {
            categorized[dateStr] = [];
          }
          categorized[dateStr].push(quiz);
        });

        setCategorizedQuizzes(categorized);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
        setError("Failed to load quizzes. Please try again later.");
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const deleteQuiz = async (quizId: string): Promise<void> => {
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, "quizzes", quizId));

      // Update local state
      const updatedQuizzes = quizzes.filter((quiz) => quiz.id !== quizId);
      setQuizzes(updatedQuizzes);

      // Recategorize
      const updatedCategorized: CategorizedQuizzes = {
        All: updatedQuizzes,
      };

      // Group by month again
      updatedQuizzes.forEach((quiz: Quiz) => {
        let dateStr = "Unknown Date";

        if (quiz.createdAt) {
          const date = quiz.createdAt.toDate
            ? quiz.createdAt.toDate()
            : new Date(
                typeof quiz.createdAt === "number"
                  ? quiz.createdAt < 10000000000
                    ? quiz.createdAt * 1000
                    : quiz.createdAt
                  : quiz.createdAt
              );

          dateStr = date.toLocaleString("default", {
            month: "long",
            year: "numeric",
          });
        }

        if (!updatedCategorized[dateStr]) {
          updatedCategorized[dateStr] = [];
        }
        updatedCategorized[dateStr].push(quiz);
      });

      setCategorizedQuizzes(updatedCategorized);
      setIsDeleting(false);
      toast.success("Quiz deleted successfully");
    } catch (err) {
      console.error("Error deleting quiz:", err);
      toast.error("Failed to delete quiz. Please try again.");
      setIsDeleting(false);
    }
  };

  const deleteAllQuizzes = async (): Promise<void> => {
    try {
      setIsDeleting(true);

      // Get all quizzes
      const quizzesCollection = collection(db, "quizzes");
      const quizzesSnapshot = await getDocs(quizzesCollection);

      // Delete each document
      const deletePromises: Promise<void>[] = [];
      quizzesSnapshot.forEach(
        (document: QueryDocumentSnapshot<DocumentData>) => {
          deletePromises.push(deleteDoc(doc(db, "quizzes", document.id)));
        }
      );

      await Promise.all(deletePromises);

      setQuizzes([]);
      setCategorizedQuizzes({ All: [] });
      setActiveCategory("All");
      setIsDeleting(false);
      toast.success("All quizzes have been deleted");
    } catch (err) {
      console.error("Error deleting quizzes:", err);
      setError("Failed to delete quizzes. Please try again later.");
      toast.error("Could not delete quizzes. Please try again.");
      setIsDeleting(false);
    }
  };

  const deleteCategoryQuizzes = async (category: string): Promise<void> => {
    if (category === "All") {
      return deleteAllQuizzes();
    }

    try {
      setIsDeleting(true);

      // Get document IDs for the specific category
      const docIds = categorizedQuizzes[category].map((quiz) => quiz.id);

      // Delete each document
      const deletePromises: Promise<void>[] = [];
      docIds.forEach((id: string) => {
        deletePromises.push(deleteDoc(doc(db, "quizzes", id)));
      });

      await Promise.all(deletePromises);

      // Update local state
      const updatedQuizzes = quizzes.filter((quiz) => {
        // Get quiz date category
        if (!quiz.createdAt) return true; // Keep quizzes with unknown date

        const date = quiz.createdAt.toDate
          ? quiz.createdAt.toDate()
          : new Date(
              typeof quiz.createdAt === "number"
                ? quiz.createdAt < 10000000000
                  ? quiz.createdAt * 1000
                  : quiz.createdAt
                : quiz.createdAt
            );

        const dateStr = date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
        return dateStr !== category;
      });

      setQuizzes(updatedQuizzes);

      // Recategorize
      const updatedCategorized: CategorizedQuizzes = {
        All: updatedQuizzes,
      };

      updatedQuizzes.forEach((quiz: Quiz) => {
        let dateStr = "Unknown Date";

        if (quiz.createdAt) {
          const date = quiz.createdAt.toDate
            ? quiz.createdAt.toDate()
            : new Date(
                typeof quiz.createdAt === "number"
                  ? quiz.createdAt < 10000000000
                    ? quiz.createdAt * 1000
                    : quiz.createdAt
                  : quiz.createdAt
              );

          dateStr = date.toLocaleString("default", {
            month: "long",
            year: "numeric",
          });
        }

        if (!updatedCategorized[dateStr]) {
          updatedCategorized[dateStr] = [];
        }
        updatedCategorized[dateStr].push(quiz);
      });

      setCategorizedQuizzes(updatedCategorized);

      if (category === activeCategory) {
        setActiveCategory("All");
      }

      setIsDeleting(false);
      toast.success(`All quizzes from "${category}" have been deleted`);
    } catch (err) {
      console.error(`Error deleting quizzes for category ${category}:`, err);
      setError("Failed to delete quizzes. Please try again later.");
      toast.error(
        `Could not delete quizzes from "${category}". Please try again.`
      );

      setIsDeleting(false);
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
      if (timestamp < 10000000000) {
        return new Date(timestamp * 1000).toLocaleString();
      }
      return new Date(timestamp).toLocaleString();
    }

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
        <div className="text-lg font-medium">Loading quizzes...</div>
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
  const categories = Object.keys(categorizedQuizzes).sort((a, b) => {
    // Keep "All" at the beginning
    if (a === "All") return -1;
    if (b === "All") return 1;
    return a.localeCompare(b);
  });

  // Get current quizzes to display based on active category
  const displayQuizzes = categorizedQuizzes[activeCategory] || [];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <button
        onClick={() => router.back()}
        className="mb-6 text-blue-600 hover:underline flex items-center"
      >
        ← Back
      </button>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Quiz Dashboard</h1>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
          onClick={() => {
            // Set up the delete dialog properties
            setDeleteItemType(
              activeCategory === "All"
                ? "all quizzes"
                : `all quizzes from "${activeCategory}"`
            );

            // Store the function to call when confirmed
            setPendingDeleteAction(() =>
              activeCategory === "All"
                ? deleteAllQuizzes
                : () => deleteCategoryQuizzes(activeCategory)
            );

            // Open the dialog
            setDeleteDialogOpen(true);
          }}
          disabled={isDeleting || displayQuizzes.length === 0}
        >
          {isDeleting
            ? "Deleting..."
            : `Delete ${
                activeCategory === "All" ? "All" : activeCategory
              } Quizzes`}
        </button>
      </div>

      {/* Category tabs - Horizontally scrollable on mobile */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex border-b border-gray-200 min-w-max">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-3 py-2 text-sm sm:text-base sm:px-4 font-medium whitespace-nowrap ${
                activeCategory === category
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category} ({categorizedQuizzes[category]?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {displayQuizzes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No quizzes found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayQuizzes.map((quiz: Quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-4">
                <h2
                  className="text-lg font-semibold mb-2 truncate"
                  title={quiz.quizTitle}
                >
                  {quiz.quizTitle || "Untitled Quiz"}
                </h2>
                <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                  <span>{formatDate(quiz.createdAt)}</span>
                  <span>{quiz.questions?.length || 0} questions</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {quiz.questions?.slice(0, 3).map((q: any, index: number) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full truncate max-w-full"
                      title={q.question}
                    >
                      {q.question?.substring(0, 25)}
                      {q.question?.length > 25 ? "..." : ""}
                    </span>
                  ))}
                  {quiz.questions?.length > 3 && (
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                      +{quiz.questions.length - 3} more
                    </span>
                  )}
                </div>
                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => setSelectedQuiz(quiz)}
                    className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm flex-1"
                  >
                    View
                  </button>
                  {/* <button
                    onClick={() => router.push(`/quizzes/${quiz.id}/edit`)}
                    className="bg-green-500 hover:bg-green-700 text-white py-1 px-3 rounded text-sm flex-1"
                  >
                    Edit
                  </button> */}
                  <button
                    onClick={() => {
                      setDeleteItemType("quiz");
                      setPendingDeleteAction(() => () => deleteQuiz(quiz.id));
                      setDeleteDialogOpen(true);
                    }}
                    className="bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
                    disabled={isDeleting}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {displayQuizzes.length > 0 && (
        <div className="mt-6">
          <p className="text-gray-500 text-sm">
            {activeCategory === "All"
              ? `Total quizzes: ${displayQuizzes.length}`
              : `Total quizzes from "${activeCategory}": ${displayQuizzes.length}`}
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

      {/* View Quiz Dialog */}
      <ViewQuizDialog
        quiz={selectedQuiz}
        onClose={() => setSelectedQuiz(null)}
      />
    </div>
  );
};

export default QuizzesDashboard;
