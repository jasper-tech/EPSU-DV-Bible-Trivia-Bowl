"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Question, Quiz } from "../types/quiz";
import toast from "react-hot-toast";

export function useFetchQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeQuizTitle, setActiveQuizTitle] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveQuiz = async () => {
      try {
        const quizSnapshot = await getDocs(
          query(collection(db, "quizzes"), where("activeQuiz", "==", 1))
        );

        if (quizSnapshot.empty) {
          setError("No quiz has been uploaded yet.");
          setLoading(false);
          return;
        }

        const activeQuizDoc = quizSnapshot.docs[0];
        const data = activeQuizDoc.data() as Quiz;
        const quizTitle = data.quizTitle || "Untitled Quiz";
        const quizQuestions = data.questions || [];

        setActiveQuizTitle(quizTitle);

        const processedQuestions = quizQuestions.map((q: any) => {
          let processedAnswers = Array.isArray(q.answers) ? q.answers : [];

          // Ensure each answer has required properties
          processedAnswers = processedAnswers.map(
            (answer: any, index: number) => ({
              id: answer.id || `answer_${index}`,
              text: answer.text || "",
            })
          );

          // Explicitly type questionType as "text" | "multiple-choice"
          const questionType: "text" | "multiple-choice" =
            processedAnswers.length > 1 ? "multiple-choice" : "text";

          if (questionType === "multiple-choice" && !q.correctAnswerId) {
            console.warn(
              `Question ${q.questionId} is multiple-choice but has no correctAnswerId`
            );
          }

          return {
            id: q.questionId,
            text: q.text || "",
            questionType, // Now properly typed
            answers: processedAnswers,
            correctAnswerId: q.correctAnswerId || "",
            explanation: q.explanation,
            image: q.image,
            context: q.context,
          };
        });

        // Cast to Question[] to ensure TypeScript recognizes the correct type
        setQuestions(processedQuestions as Question[]);
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
