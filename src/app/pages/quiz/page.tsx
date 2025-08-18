"use client";
import { Box, Typography, Paper, CircularProgress, Alert } from "@mui/material";
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
  // Track question response times
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  // Track when the question was first shown to the user
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now()
  );

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
    // Reset the start time when moving to a new question
    setQuestionStartTime(Date.now());
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

      // Use user.email as userDisplayName parameter (this might be an email address)
      const userEmailOrName = user.email || "Anonymous User";

      // Calculate average response time (in seconds)
      const totalResponseTime = responseTimes.reduce(
        (sum, time) => sum + time,
        0
      );
      const averageResponseTime =
        responseTimes.length > 0
          ? (totalResponseTime / responseTimes.length).toFixed(2)
          : 0;

      // Enhanced userAnswers with response times
      const enhancedUserAnswers = quizState.userAnswers.map(
        (answer, index) => ({
          ...answer,
          responseTime: responseTimes[index] || 0, // Individual response time per question
        })
      );

      // Save score with all required information
      await saveQuizScore(
        user.uid,
        userEmailOrName, //  userDisplayName and potentially matched with users collection
        activeQuizTitle,
        quizState.score,
        questions.length,
        enhancedUserAnswers,
        parseFloat(averageResponseTime.toString()) // average response time
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

    // Calculate response time for this question (in seconds)
    const responseTime = (Date.now() - questionStartTime) / 1000;
    // Add to the response times array
    setResponseTimes((prev) => [...prev, responseTime]);

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
          responseTime, // Add response time to user answer
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

    // Add the maximum time as the response time when timer runs out
    const responseTime = 45; // Maximum time allowed
    setResponseTimes((prev) => [...prev, responseTime]);

    setQuizState((prev) => ({
      ...prev,
      isAnswerCorrect: false,
      userAnswers: [
        ...prev.userAnswers,
        {
          questionId: currentQuestion.id,
          answerId: "",
          isCorrect: false,
          responseTime, // Add the max time as response time
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
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
          sx={{ mt: 4, p: 2 }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Quiz Completed!
          </Typography>

          <Paper
            elevation={3}
            sx={{ p: 3, textAlign: "center", width: "100%", maxWidth: 400 }}
          >
            <Typography variant="h5" gutterBottom>
              You scored {quizState.score} out of {questions.length}!
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Average response time:{" "}
              {responseTimes.length > 0
                ? (
                    responseTimes.reduce((sum, time) => sum + time, 0) /
                    responseTimes.length
                  ).toFixed(2)
                : 0}{" "}
              seconds
            </Typography>
          </Paper>

          {/* Score saving status */}
          {isSavingScore && (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} />
              <Typography variant="body1" color="textSecondary">
                Saving your score...
              </Typography>
            </Box>
          )}

          {saveError && (
            <Alert severity="error" sx={{ width: "100%", maxWidth: 400 }}>
              {saveError}
            </Alert>
          )}

          {/* User feedback based on auth status */}
          {user ? (
            <Alert severity="success" sx={{ width: "100%", maxWidth: 400 }}>
              Your score has been recorded for the leaderboard!
            </Alert>
          ) : (
            <Alert severity="info" sx={{ width: "100%", maxWidth: 400 }}>
              Log in to save your score and appear on the leaderboard.
            </Alert>
          )}

          <button
            onClick={() => (window.location.href = "/pages/leaderboard")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-md transition duration-200 mt-4"
          >
            View Leaderboard
          </button>
        </Box>
      )}
    </div>
  );
};

export default Quiz;
