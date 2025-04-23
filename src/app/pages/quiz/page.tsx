"use client";

import React, { useState, useEffect } from "react";
import { Answer, QuizState } from "../../types/quiz";
import { sampleQuestions } from "../../Data/samplequestions";
import ScoreBanner from "../../components/scorebanner";
import AnswerBox from "../../components/answerbox";
import Timer from "../../components/timer";
import QuestionCard from "../../components/questioncard";

const Quiz: React.FC = () => {
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    score: 0,
    isAnswerCorrect: null,
    isQuizCompleted: false,
    userAnswers: [],
  });

  const [timeRemaining, setTimeRemaining] = useState<number>(45);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(true);
  const [showScore, setShowScore] = useState<boolean>(false);

  const currentQuestion =
    sampleQuestions.length > 0
      ? sampleQuestions[quizState.currentQuestionIndex]
      : undefined;

  // Effect when the quiz is completed, we display the score
  useEffect(() => {
    if (quizState.isQuizCompleted) {
      setShowScore(true);
    }
  }, [quizState.isQuizCompleted]);

  useEffect(() => {
    setTimeRemaining(45); // Reset timer every time a new question appears
    setIsTimerActive(true);
  }, [quizState.currentQuestionIndex]);

  const handleSubmitAnswer = (answer: Answer) => {
    if (!currentQuestion) return;
    setIsTimerActive(false);
    const isCorrect = answer.id === currentQuestion.correctAnswerId;

    setQuizState((prev) => ({
      ...prev,
      isAnswerCorrect: isCorrect,
      score: isCorrect ? prev.score + 1 : prev.score,
      userAnswers: [
        ...prev.userAnswers,
        {
          questionId: currentQuestion.id,
          answerId: answer.id,
          isCorrect,
        },
      ],
    }));
  };

  const handleNextQuestion = () => {
    const nextIndex = quizState.currentQuestionIndex + 1;
    if (nextIndex >= sampleQuestions.length) {
      setQuizState((prev) => ({ ...prev, isQuizCompleted: true }));
    } else {
      setQuizState((prev) => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        isAnswerCorrect: null,
      }));
    }
  };

  const handleTimeUp = () => {
    if (!currentQuestion) return;
    setQuizState((prev) => ({
      ...prev,
      isAnswerCorrect: false,
      userAnswers: [
        ...prev.userAnswers,
        {
          questionId: currentQuestion.id,
          answerId: "",
          isCorrect: false,
        },
      ],
    }));
  };

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="text-xl font-semibold">Loading quiz questions...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-6">
      {!showScore ? (
        <>
          <ScoreBanner
            score={quizState.score}
            totalQuestions={sampleQuestions.length}
            currentQuestionIndex={quizState.currentQuestionIndex}
          />

          <div className="w-full flex justify-end mb-2">
            <Timer
              timeRemaining={timeRemaining}
              setTimeRemaining={setTimeRemaining}
              isActive={isTimerActive}
              onTimeUp={handleTimeUp}
            />
          </div>

          <QuestionCard
            question={currentQuestion}
            questionNumber={quizState.currentQuestionIndex + 1}
            totalQuestions={sampleQuestions.length}
          />

          <AnswerBox
            answers={currentQuestion.answers}
            onSubmit={handleSubmitAnswer}
            isAnswerCorrect={quizState.isAnswerCorrect}
            correctAnswerId={currentQuestion.correctAnswerId}
            disabled={quizState.isAnswerCorrect !== null || !isTimerActive}
          />

          {quizState.isAnswerCorrect !== null && (
            <button
              onClick={handleNextQuestion}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-md transition duration-200 mt-4"
            >
              {quizState.currentQuestionIndex === sampleQuestions.length - 1
                ? "Finish Quiz"
                : "Next Question"}
            </button>
          )}
        </>
      ) : (
        <div className="mt-4 text-xl font-semibold">
          You scored {quizState.score} out of {sampleQuestions.length}!
        </div>
      )}
    </div>
  );
};

export default Quiz;
