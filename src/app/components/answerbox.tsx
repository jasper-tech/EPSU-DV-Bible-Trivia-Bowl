"use client";
import React, { useState, useEffect } from "react";
import { AnswerBoxProps } from "../types/quiz";

const AnswerBox: React.FC<AnswerBoxProps> = ({
  answers,
  onSubmit,
  isAnswerCorrect,
  correctAnswerId,
  disabled,
}) => {
  const [userInput, setUserInput] = useState("");

  const handleSubmit = () => {
    if (disabled || !userInput.trim()) return;

    const correctAnswer = answers.find((a) => a.id === correctAnswerId);
    const normalizedInput = userInput.trim().toLowerCase();
    const normalizedCorrect = correctAnswer?.text.trim().toLowerCase();

    const isCorrect = normalizedInput === normalizedCorrect;

    onSubmit({
      id: userInput, // not a real ID, just passing user input
      text: userInput,
    });

    // Optional: You can clear the input after submission
    setUserInput("");
  };

  useEffect(() => {
    setUserInput(""); // reset input when question changes
  }, [answers]);

  return (
    <div className="w-full max-w-xl">
      <input
        type="text"
        placeholder="Type your answer here..."
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2 border rounded-md text-black focus:outline-none mb-3"
        data-testid="text-answer-input"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !userInput.trim()}
        className={`w-full py-2 px-6 rounded-md font-medium text-white transition-colors
          ${
            disabled || !userInput.trim()
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        data-testid="submit-answer"
      >
        Submit{" "}
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
                  answers.find((a) => a.id === correctAnswerId)?.text || ""
                }`}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnswerBox;
