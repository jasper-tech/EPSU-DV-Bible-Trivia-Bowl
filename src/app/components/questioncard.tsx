"use client";

import React from "react";
import Image from "next/image";
import { QuestionCardProps } from "../types/quiz";

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
}) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
      {/* Question Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="text-sm font-medium">
          Question {questionNumber} of {totalQuestions}
        </div>
        <h2 className="text-xl font-bold mt-1">{question.text}</h2>
      </div>

      {/* Question Image (Optimized with next/image) */}
      {question.image && (
        <div className="p-4 bg-gray-50 border-b">
          <div className="relative w-full h-64">
            <Image
              src={question.image}
              alt="Question illustration"
              layout="fill"
              objectFit="contain"
              className="rounded"
              priority
            />
          </div>
        </div>
      )}

      {/* Context or Additional Info */}
      {question.context && (
        <div className="p-4 bg-gray-50 border-b text-gray-700">
          <p>{question.context}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-gray-50 text-gray-600 text-sm">
        Select the best answer from the options below.
      </div>
    </div>
  );
};

export default QuestionCard;
