"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Question } from "../types/quiz";
import toast from "react-hot-toast";

export function useFetchQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeQuizTitle, setActiveQuizTitle] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveQuiz = async () => {
      try {
        // Get the active quiz document (where activeQuiz === 1)
        const quizSnapshot = await getDocs(
          query(collection(db, "quizzes"), where("activeQuiz", "==", 1))
        );

        if (quizSnapshot.empty) {
          setError("No quiz has been uploaded yet.");
          setLoading(false);
          return;
        }

        const activeQuizDoc = quizSnapshot.docs[0];
        const data = activeQuizDoc.data();
        const quizTitle = data.quizTitle || "Untitled Quiz";
        const quizQuestions = data.questions || [];

        setActiveQuizTitle(quizTitle);
        setQuestions(
          quizQuestions.map((q: any) => ({
            id: q.questionId,
            ...q,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        toast.error("Error fetching quiz questions.");
        setError("Failed to fetch questions.");
      } finally {
        setLoading(false);
      }
    };

    fetchActiveQuiz();
  }, []);

  return { questions, loading, error, activeQuizTitle };
}
