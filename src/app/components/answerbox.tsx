"use client";
import React, { useState, useEffect } from "react";
import { AnswerBoxProps } from "../types/quiz";

const AnswerBox: React.FC<AnswerBoxProps> = ({
  answers,
  onSubmit,
  isAnswerCorrect,
  correctAnswerId,
  disabled,
  questionType,
}) => {
  const [userInput, setUserInput] = useState("");
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);

  const handleSubmit = () => {
    if (disabled) return;

    if (questionType === "multiple-choice") {
      if (!selectedAnswerId) return;

      const selectedAnswer = answers.find((a) => a.id === selectedAnswerId);
      if (!selectedAnswer) return;

      onSubmit({
        id: selectedAnswerId,
        text: selectedAnswer.text,
      });
    } else {
      // Handle text input questions
      if (!userInput.trim()) return;

      onSubmit({
        id: userInput,
        text: userInput,
      });

      setUserInput("");
    }
  };

  useEffect(() => {
    // Reset state when question changes
    setUserInput("");
    setSelectedAnswerId(null);
  }, [answers]);

  // Determine if the submit button should be disabled
  const isSubmitDisabled =
    disabled ||
    (questionType === "text" && !userInput.trim()) ||
    (questionType === "multiple-choice" && !selectedAnswerId);

  // Check for valid multiple-choice setup
  const isMultipleChoice =
    questionType === "multiple-choice" &&
    Array.isArray(answers) &&
    answers.length > 0;

  return (
    <div className="w-full max-w-xl">
      {isMultipleChoice ? (
        // Multiple choice options
        <div className="space-y-3 mb-4">
          {answers.map((answer) => (
            <div
              key={answer.id}
              className={`p-3 border rounded-md cursor-pointer transition-colors
                ${
                  selectedAnswerId === answer.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-300"
                }
                ${
                  disabled && answer.id === correctAnswerId
                    ? "border-green-500 bg-green-50"
                    : ""
                }
                ${
                  disabled &&
                  selectedAnswerId === answer.id &&
                  answer.id !== correctAnswerId
                    ? "border-red-500 bg-red-50"
                    : ""
                }
              `}
              onClick={() => {
                if (!disabled) {
                  setSelectedAnswerId(answer.id);
                }
              }}
              data-testid={`multiple-choice-option-${answer.id}`}
            >
              {answer.text}
            </div>
          ))}
        </div>
      ) : (
        // Text input for regular questions
        <input
          type="text"
          placeholder="Type your answer here..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2 border rounded-md text-black focus:outline-none mb-3"
          data-testid="text-answer-input"
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        className={`w-full py-2 px-6 rounded-md font-medium text-white transition-colors
          ${
            isSubmitDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        data-testid="submit-answer"
      >
        Submit
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
                  answers?.find((a) => a.id === correctAnswerId)?.text || ""
                }`}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnswerBox;
