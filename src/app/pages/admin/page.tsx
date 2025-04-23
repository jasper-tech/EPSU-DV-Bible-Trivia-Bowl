"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface Answer {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  answers: Answer[];
  correctAnswerId: string;
  explanation: string;
}

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Trivia Questions"));
        const loadedQuestions: Question[] = [];

        querySnapshot.forEach((doc) => {
          loadedQuestions.push({ id: doc.id, ...doc.data() } as Question);
        });

        setQuestions(loadedQuestions);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    fetchQuestions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">📋 Admin - Quiz Questions</h1>

      {loading ? (
        <p>Loading questions...</p>
      ) : (
        <ul className="space-y-6">
          {questions.map((q) => (
            <li key={q.id} className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold">{q.text}</h2>
              <ul className="mt-2 list-disc pl-5">
                {q.answers.map((a) => (
                  <li
                    key={`${q.id}-${a.id}`}
                    className={
                      a.id === q.correctAnswerId
                        ? "text-green-600 font-bold"
                        : ""
                    }
                  >
                    {a.text}
                  </li>
                ))}
              </ul>

              <p className="mt-2 text-sm text-gray-600">
                💡 Explanation: {q.explanation}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
