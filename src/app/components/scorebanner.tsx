// src/components/ScoreBanner.tsx
import React from "react";
import { ScoreBannerProps } from "../types/quiz";

const ScoreBanner: React.FC<ScoreBannerProps> = ({
  score,
  totalQuestions,
  currentQuestionIndex,
}) => {
  // Calculate percentage for progress bar
  const progressPercentage = (currentQuestionIndex / totalQuestions) * 100;

  return (
    <div className="w-full bg-gray-400 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="text-lg font-semibold">
          Question {currentQuestionIndex + 1}/{totalQuestions}
        </div>
        <div className="text-lg font-bold text-blue-600">
          Score: {score}/{totalQuestions}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-600 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>

      {/* Optional: Score as percentage */}
      <div className="text-right text-sm text-gray-600 mt-1">
        {score > 0 ? ((score / totalQuestions) * 100).toFixed(0) : 0}% correct
      </div>
    </div>
  );
};

export default ScoreBanner;
