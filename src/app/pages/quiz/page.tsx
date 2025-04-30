"use client";

import React, { useState, useEffect } from "react";
import { Answer, QuizState } from "../../types/quiz";
import { useFetchQuestions } from "../../Data/samplequestions";
import ScoreBanner from "../../components/scorebanner";
import AnswerBox from "../../components/answerbox";
import Timer from "../../components/timer";
import QuestionCard from "../../components/questioncard";
import { useAuth } from "@/app/context/AuthContext";
import { saveQuizScore } from "@/app/lib/quizservice";

const Quiz: React.FC = () => {
  const { questions, loading, error, activeQuizTitle } = useFetchQuestions();
  const { user } = useAuth();

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
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const currentQuestion =
    questions.length > 0 ? questions[quizState.currentQuestionIndex] : null;

  // Handle quiz completion
  useEffect(() => {
    if (quizState.isQuizCompleted) {
      setShowScore(true);
      saveScoreToFirestore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizState.isQuizCompleted]);

  useEffect(() => {
    setTimeRemaining(45);
    setIsTimerActive(true);
  }, [quizState.currentQuestionIndex]);

  // Save quiz results to Firestore database
  const saveScoreToFirestore = async () => {
    if (!user || !activeQuizTitle) {
      setSaveError("User not logged in or quiz title missing");
      return;
    }

    try {
      setIsSavingScore(true);
      setSaveError(null);

      const displayName = user.email || "Anonymous User";

      // Save score with all required information
      await saveQuizScore(
        user.uid,
        displayName,
        activeQuizTitle,
        quizState.score,
        questions.length,
        quizState.userAnswers
      );
    } catch (error) {
      console.error("Error saving score:", error);
      setSaveError("Failed to save your score. Please try again.");
    } finally {
      setIsSavingScore(false);
    }
  };

  const handleSubmitAnswer = (userAnswer: Answer) => {
    if (!currentQuestion) return;
    setIsTimerActive(false);

    // Determine if answer is correct based on question type
    const isCorrect =
      currentQuestion.questionType === "multiple-choice"
        ? // For multiple-choice, directly compare IDs
          userAnswer.id === currentQuestion.correctAnswerId
        : // For text input, normalize and compare text
          (() => {
            const correctAnswer = currentQuestion.answers.find(
              (a) => a.id === currentQuestion.correctAnswerId
            );
            const normalizedCorrect = correctAnswer?.text.trim().toLowerCase();
            const normalizedUserInput = userAnswer.text.trim().toLowerCase();
            return normalizedUserInput === normalizedCorrect;
          })();

    // Update quiz state with the user's answer and score
    setQuizState((prev) => ({
      ...prev,
      isAnswerCorrect: isCorrect,
      score: isCorrect ? prev.score + 1 : prev.score,
      userAnswers: [
        ...prev.userAnswers,
        {
          questionId: currentQuestion.id,
          answerId:
            currentQuestion.questionType === "multiple-choice"
              ? userAnswer.id
              : userAnswer.text,
          isCorrect,
        },
      ],
    }));
  };

  const handleNextQuestion = () => {
    const nextIndex = quizState.currentQuestionIndex + 1;

    setQuizState((prev) => ({
      ...prev,
      // If we've reached the end, mark quiz as completed
      ...(nextIndex >= questions.length
        ? { isQuizCompleted: true }
        : { currentQuestionIndex: nextIndex, isAnswerCorrect: null }),
    }));
  };

  // Handle when timer runs out for a question
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="text-xl font-semibold">Loading quiz questions...</div>
      </div>
    );
  }

  if (error || !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-screen">
        <div className="text-xl text-red-600 font-semibold mb-4">
          {error || "No active quiz found or no questions available."}
        </div>
        <a
          href="/pages/profile"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Go Back
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-6">
      {activeQuizTitle && (
        <h1 className="text-2xl font-bold text-center mb-4">
          {activeQuizTitle}
        </h1>
      )}

      {!showScore ? (
        // Quiz in progress view
        <>
          <ScoreBanner
            score={quizState.score}
            totalQuestions={questions.length}
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
            totalQuestions={questions.length}
          />

          <AnswerBox
            answers={currentQuestion.answers}
            onSubmit={handleSubmitAnswer}
            isAnswerCorrect={quizState.isAnswerCorrect}
            correctAnswerId={currentQuestion.correctAnswerId}
            disabled={quizState.isAnswerCorrect !== null}
            questionType={currentQuestion.questionType}
          />

          {quizState.isAnswerCorrect !== null && (
            <button
              onClick={handleNextQuestion}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-md transition duration-200 mt-4"
            >
              {quizState.currentQuestionIndex === questions.length - 1
                ? "Finish Quiz"
                : "Next Question"}
            </button>
          )}
        </>
      ) : (
        // Results view
        <div className="flex flex-col items-center space-y-4">
          <div className="text-2xl font-semibold">Quiz Completed!</div>
          <div className="text-xl">
            You scored {quizState.score} out of {questions.length}!
          </div>

          {/* Score saving status */}
          {isSavingScore && (
            <p className="text-gray-600">Saving your score...</p>
          )}
          {saveError && <p className="text-red-500">{saveError}</p>}

          {/* User feedback based on auth status */}
          {user ? (
            <p className="text-green-600">
              Your score has been recorded for the leaderboard!
            </p>
          ) : (
            <p className="text-yellow-600">
              Log in to save your scores and appear on the leaderboard!
            </p>
          )}

          <button
            onClick={() => (window.location.href = "/pages/leaderboard")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-md transition duration-200 mt-4"
          >
            View Leaderboard
          </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;
