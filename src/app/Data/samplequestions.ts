"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Question } from "../types/quiz";
import toast from "react-hot-toast";

export function useFetchQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "questions"));
        const fetchedQuestions: Question[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Question, "id">),
        }));

        setQuestions(fetchedQuestions);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        toast.error("Error fetching quiz questions.");
        setError("Failed to fetch questions.");
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  return { questions, loading, error };
}
