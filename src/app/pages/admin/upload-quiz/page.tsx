"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  text: string;
}

interface Quiz {
  id?: string;
  quizTitle: string;
  questions: Question[];
}

const AdminQuizSelection: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);

  // Fetch quiz titles on component mount
  useEffect(() => {
    const fetchQuizTitles = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "quizzes"));
        const fetchedQuizzes: Quiz[] = [];

        snapshot.docs.forEach((doc) => {
          const quizData = doc.data();

          if (quizData.quizTitle) {
            fetchedQuizzes.push({
              quizTitle: quizData.quizTitle,
              id: doc.id,
              questions: [], // Empty array initially
            });
          }
        });

        setQuizzes(fetchedQuizzes);
      } catch (err) {
        console.error("Failed to fetch quiz titles:", err);
        toast.error("Error fetching quiz titles.");
        setError("Failed to fetch quiz titles.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizTitles();
  }, []);

  const handleQuizChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const quizTitle = event.target.value;
    setSelectedQuizId(quizTitle);

    if (!quizTitle) {
      setSelectedQuiz(null);
      return;
    }

    // Fetch questions for the selected quiz
    setIsLoadingQuestions(true);
    try {
      // Find the quiz with matching title
      const quizToFetch = quizzes.find((q) => q.quizTitle === quizTitle);

      if (!quizToFetch || !quizToFetch.id) {
        throw new Error("Quiz not found");
      }

      // Fetch the full quiz document
      const quizDoc = await getDoc(doc(db, "quizzes", quizToFetch.id));

      if (!quizDoc.exists()) {
        throw new Error("Quiz document not found");
      }

      const quizData = quizDoc.data();

      if (!quizData.questions || !Array.isArray(quizData.questions)) {
        // Set empty questions array if no questions exist
        setSelectedQuiz({
          ...quizToFetch,
          questions: [],
        });
        return;
      }

      // Process questions to ensure they have IDs
      const questionsWithIds = quizData.questions.map(
        (q: any, index: number) => ({
          ...q,
          id: q.id || `${quizToFetch.id}-q${index}`,
        })
      );

      setSelectedQuiz({
        ...quizToFetch,
        questions: questionsWithIds,
      });
    } catch (err) {
      console.error(`Failed to fetch questions for quiz "${quizTitle}":`, err);
      toast.error(`Error fetching questions for quiz "${quizTitle}"`);
      setError(`Failed to fetch questions for quiz "${quizTitle}"`);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedQuiz || !selectedQuiz.id) {
      toast.error("No quiz selected");
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Get all quiz docs
      const quizSnapshot = await getDocs(collection(db, "quizzes"));

      const batchUpdates: Promise<any>[] = [];

      quizSnapshot.forEach((quizDoc) => {
        const isSelected = quizDoc.id === selectedQuiz.id;
        const quizRef = doc(db, "quizzes", quizDoc.id);

        // Set activeQuiz to 1 for the selected quiz, 0 for all others
        batchUpdates.push(
          updateDoc(quizRef, {
            activeQuiz: isSelected ? 1 : 0,
          })
        );
      });

      // Step 2: Perform all updates
      await Promise.all(batchUpdates);

      // Save the uploaded quiz title to the `uploads` collection
      await addDoc(collection(db, "uploads"), {
        quizTitle: selectedQuiz.quizTitle,
        uploadedAt: new Date(),
      });

      toast.success(`Quiz "${selectedQuiz.quizTitle}" is now active!`);
      console.log("Active quiz updated successfully");
    } catch (err) {
      console.error("Failed to update active quiz:", err);
      toast.error("Failed to upload quiz. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <div className="p-6">
      <button
        onClick={() => router.back()}
        className="mb-6 text-blue-600 hover:underline flex items-center"
      >
        ← Back
      </button>
      <h1 className="text-2xl font-bold mb-6">Upload Active Quiz</h1>

      {loading && <div className="text-gray-600">Loading quiz titles...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}

      {!loading && quizzes.length > 0 && (
        <>
          {/* Dropdown for quiz selection */}
          <div className="mb-6">
            <label className="block mb-2 font-medium">Quiz Title:</label>
            <select
              value={selectedQuizId}
              onChange={handleQuizChange}
              className="w-full px-4 py-2 border rounded-md"
              disabled={isUploading || isLoadingQuestions}
            >
              <option value="">-- Select a Quiz --</option>
              {quizzes.map((quiz) => (
                <option key={quiz.id || quiz.quizTitle} value={quiz.quizTitle}>
                  {quiz.quizTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Upload button with loading state */}
          <button
            onClick={handleUpload}
            disabled={!selectedQuiz || isUploading || isLoadingQuestions}
            className={`px-4 py-2 rounded-md flex items-center justify-center min-w-[100px] ${
              selectedQuiz && !isUploading && !isLoadingQuestions
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isUploading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                uploading...
              </>
            ) : (
              "Upload Quiz"
            )}
          </button>

          {/* Display questions loading state */}
          {isLoadingQuestions && (
            <div className="mt-4 flex items-center text-gray-600">
              <svg
                className="animate-spin mr-2 h-4 w-4 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading questions...
            </div>
          )}

          {/* Display the questions for the selected quiz */}
          {selectedQuiz && !isLoadingQuestions && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">
                Questions for {selectedQuiz.quizTitle}
              </h2>
              {selectedQuiz.questions && selectedQuiz.questions.length > 0 ? (
                <div className="space-y-4">
                  {selectedQuiz.questions.map((question, index) => (
                    <div
                      key={question.id || `question-${index}`}
                      className="p-4 border rounded-md"
                    >
                      <p className="font-medium">
                        Question {index + 1}:{" "}
                        {question.text || "No question text"}
                      </p>
                      {/* You can add more question details here */}
                    </div>
                  ))}
                </div>
              ) : (
                <p>This quiz doesnt have any questions yet.</p>
              )}
            </div>
          )}
        </>
      )}

      {!loading && quizzes.length === 0 && (
        <div className="text-gray-600">No quizzes found in the database.</div>
      )}
    </div>
  );
};

export default AdminQuizSelection;
