// src/components/AnswerBox.tsx
import React, { useState } from "react";
import { Answer, AnswerBoxProps } from "../types/quiz";

const AnswerBox: React.FC<AnswerBoxProps> = ({
  answers,
  onSubmit,
  isAnswerCorrect,
  correctAnswerId,
  disabled,
}) => {
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);

  const handleAnswerSelect = (answer: Answer) => {
    if (disabled) return;
    setSelectedAnswerId(answer.id);
  };

  const handleSubmit = () => {
    if (!selectedAnswerId || disabled) return;

    const selectedAnswer = answers.find(
      (answer) => answer.id === selectedAnswerId
    );
    if (selectedAnswer) {
      onSubmit(selectedAnswer);
    }
  };

  // Reset selected answer when getting new questions
  React.useEffect(() => {
    setSelectedAnswerId(null);
  }, [answers]);

  const getAnswerStyles = (answerId: string) => {
    const baseStyles =
      "p-4 border rounded-lg mb-3 cursor-pointer transition-all duration-200";
    const selectedStyles = "border-2";

    // If we've submitted an answer and received feedback
    if (isAnswerCorrect !== null) {
      if (answerId === correctAnswerId) {
        // Correct answer
        return `${baseStyles} ${selectedStyles} bg-green-100 border-green-500 text-green-800`;
      } else if (answerId === selectedAnswerId) {
        // User's incorrect answer
        return `${baseStyles} ${selectedStyles} bg-red-100 border-red-500 text-red-800`;
      } else {
        // Other answers
        return `${baseStyles} bg-gray-50 border-gray-300 text-gray-500`;
      }
    }

    // Before submission
    return selectedAnswerId === answerId
      ? `${baseStyles} ${selectedStyles} bg-blue-100 border-blue-500`
      : `${baseStyles} hover:bg-gray-100 hover:border-gray-400 border-gray-300`;
  };

  return (
    <div className="w-full">
      <div className="space-y-2">
        {answers.map((answer) => (
          <div
            key={answer.id}
            className={getAnswerStyles(answer.id)}
            onClick={() => handleAnswerSelect(answer)}
            data-testid={`answer-option-${answer.id}`}
          >
            {answer.text}
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedAnswerId || disabled}
        className={`mt-4 py-2 px-6 rounded-md font-medium text-white transition-colors 
        ${
          !selectedAnswerId || disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
        data-testid="submit-answer"
      >
        Submit Answer
      </button>

      {isAnswerCorrect !== null && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            isAnswerCorrect
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <p className="font-medium">
            {isAnswerCorrect
              ? "✓ Correct!"
              : `✗ Incorrect. The correct answer was: ${
                  answers.find((a) => a.id === correctAnswerId)?.text
                }`}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnswerBox;
