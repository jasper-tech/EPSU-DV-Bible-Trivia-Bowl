"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  CircularProgress,
  Typography,
  Box,
  TextField,
  Button,
  Checkbox,
  Paper,
} from "@mui/material";
import toast from "react-hot-toast";

// Interfaces
interface Answer {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  explanation: string;
  answers: Answer[];
  correctAnswerId: string;
}

const NormalQuiz = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch questions from Firestore
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, "questions"),
        (snapshot: QuerySnapshot<DocumentData>) => {
          const fetchedQuestions: Question[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Question, "id">),
          }));
          console.log("Questions fetched:", fetchedQuestions.length);
          setQuestions(fetchedQuestions);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching questions:", error);
          toast.error("Failed to load questions.");
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up listener:", error);
      toast.error("Failed to connect to database.");
      setLoading(false);
    }
  }, []);

  // Handle checkbox selection change
  const handleSelectionChange = (questionId: string) => {
    setSelectedRows((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  // Handle Quiz Submission (Save to Firestore)
  const handleSubmitQuiz = async () => {
    console.log("Submit function called");
    console.log("Title:", quizTitle);
    console.log("Selected rows:", selectedRows);

    if (selectedRows.length === 0 || !quizTitle.trim()) {
      console.log("Validation failed");
      toast.error("Please select questions and enter a quiz title.");
      return;
    }

    setSubmitting(true);
    console.log("Submitting Quiz...");

    try {
      const selectedQuestions = questions.filter((q) =>
        selectedRows.includes(q.id)
      );

      console.log("Selected questions:", selectedQuestions.length);

      if (selectedQuestions.length === 0) {
        toast.error("No questions selected.");
        setSubmitting(false);
        return;
      }

      const formattedQuestions = selectedQuestions.map((q) => ({
        questionId: q.id,
        text: q.text,
        answers: q.answers,
        correctAnswerId: q.correctAnswerId,
      }));

      const quizDoc = {
        quizTitle,
        createdAt: Timestamp.now(),
        questions: formattedQuestions,
        responses: [], // Empty initially
      };

      console.log("Sending to Firestore:", quizDoc);

      const docRef = await addDoc(collection(db, "quizzes"), quizDoc);
      toast.success("Quiz created successfully!");
      console.log("Quiz created with ID:", docRef.id);

      // Reset form
      setQuizTitle("");
      setSelectedRows([]);
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error("Failed to create quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loader while data is being fetched
  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <CircularProgress />
      </div>
    );
  }

  return (
    <Box className="p-4">
      <Typography variant="h5" gutterBottom>
        Create Quiz
      </Typography>

      {/* Input for quiz title */}
      <TextField
        label="Quiz Title"
        variant="outlined"
        fullWidth
        value={quizTitle}
        onChange={(e) => setQuizTitle(e.target.value)}
        sx={{ mb: 4 }}
      />

      {/* Custom Question Table */}
      {questions.length === 0 ? (
        <Typography>No questions available.</Typography>
      ) : (
        <Paper elevation={2} sx={{ overflowX: "auto", mb: 3 }}>
          <div className="min-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Answers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correct Answer ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.map((question) => (
                  <tr
                    key={question.id}
                    className={
                      selectedRows.includes(question.id) ? "bg-blue-50" : ""
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Checkbox
                        checked={selectedRows.includes(question.id)}
                        onChange={() => handleSelectionChange(question.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-normal break-words max-w-xs">
                      {question.text}
                    </td>
                    <td className="px-6 py-4 whitespace-normal break-words max-w-md">
                      <ul className="list-disc pl-5">
                        {question.answers.map((answer) => (
                          <li key={answer.id} className="mb-1">
                            {answer.text}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {question.correctAnswerId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Paper>
      )}

      {/* Debug info */}
      <div className="mt-2 mb-2 text-gray-600 text-sm">
        <p>Selected questions: {selectedRows.length}</p>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmitQuiz}
        variant="contained"
        color="primary"
        disabled={
          loading || !quizTitle || selectedRows.length === 0 || submitting
        }
        sx={{ mt: 2 }}
      >
        {submitting ? "Creating..." : "Create Quiz"}
      </Button>
    </Box>
  );
};

export default NormalQuiz;
