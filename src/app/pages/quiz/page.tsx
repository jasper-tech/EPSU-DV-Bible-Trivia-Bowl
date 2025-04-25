"use client";

import React, { useState, useEffect } from "react";
import { Answer, QuizState } from "../../types/quiz";
import { useFetchQuestions } from "../../Data/samplequestions";
import ScoreBanner from "../../components/scorebanner";
import AnswerBox from "../../components/answerbox";
import Timer from "../../components/timer";
import QuestionCard from "../../components/questioncard";

const Quiz: React.FC = () => {
  const { questions, loading, error, activeQuizTitle } = useFetchQuestions();

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
    questions.length > 0
      ? questions[quizState.currentQuestionIndex]
      : undefined;

  useEffect(() => {
    if (quizState.isQuizCompleted) {
      setShowScore(true);
    }
  }, [quizState.isQuizCompleted]);

  useEffect(() => {
    setTimeRemaining(45);
    setIsTimerActive(true);
  }, [quizState.currentQuestionIndex]);

  const handleSubmitAnswer = (userAnswer: Answer) => {
    if (!currentQuestion) return;
    setIsTimerActive(false);

    const correctAnswer = currentQuestion.answers.find(
      (a) => a.id === currentQuestion.correctAnswerId
    );

    const normalizedCorrect = correctAnswer?.text.trim().toLowerCase();
    const normalizedUserInput = userAnswer.text.trim().toLowerCase();
    const isCorrect = normalizedUserInput === normalizedCorrect;

    setQuizState((prev) => ({
      ...prev,
      isAnswerCorrect: isCorrect,
      score: isCorrect ? prev.score + 1 : prev.score,
      userAnswers: [
        ...prev.userAnswers,
        {
          questionId: currentQuestion.id,
          answerId: userAnswer.text,
          isCorrect,
        },
      ],
    }));
  };

  const handleNextQuestion = () => {
    const nextIndex = quizState.currentQuestionIndex + 1;
    if (nextIndex >= questions.length) {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="text-xl font-semibold">Loading quiz questions...</div>
      </div>
    );
  }

  if (error || !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="text-xl text-red-600 font-semibold">
          {error || "No active quiz found or no questions available."}
        </div>
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
        <div className="flex flex-col items-center space-y-4">
          <div className="text-2xl font-semibold">Quiz Completed!</div>
          <div className="text-xl">
            You scored {quizState.score} out of {questions.length}!
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
