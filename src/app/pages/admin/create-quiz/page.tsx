"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const NormalQuiz = dynamic(() => import("../../../components/normalquiz"));
const Speedrace = dynamic(() => import("../../../components/speedrace"));

type QuizType = "normal" | "speedrace" | null;

export default function CreateQuiz() {
  const [quizType, setQuizType] = useState<QuizType>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 pt-16 px-6">
      <div className="w-full max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:underline flex items-center"
        >
          ← Back
        </button>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-8 text-center">
          Choose Quiz Type
        </h1>

        {/* Tiles */}
        {!quizType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              onClick={() => setQuizType("normal")}
              className="cursor-pointer bg-white rounded-lg shadow hover:shadow-lg transition p-8 text-center border border-gray-200 hover:border-blue-500"
            >
              <h2 className="text-2xl font-semibold text-blue-600 mb-2">
                Normal Quiz
              </h2>
              <p>Create a standard quiz with multiple questions.</p>
            </div>

            <div
              onClick={() => setQuizType("speedrace")}
              className="cursor-pointer bg-white rounded-lg shadow hover:shadow-lg transition p-8 text-center border border-gray-200 hover:border-red-500"
            >
              <h2 className="text-2xl font-semibold text-red-600 mb-2">
                Speedrace
              </h2>
              <p>Create a fast-paced quiz with time-based challenges.</p>
            </div>
          </div>
        )}

        {/* Mount selected quiz type */}
        <div className="mt-10">
          {quizType === "normal" && <NormalQuiz />}
          {quizType === "speedrace" && <Speedrace />}
        </div>
      </div>
    </div>
  );
}
