"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Modal,
  Button,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { Answer, QuizState } from "../../types/quiz";
import { useFetchQuestions } from "../../Data/samplequestions";
import ScoreBanner from "../../components/scorebanner";
import AnswerBox from "../../components/answerbox";
import Timer from "../../components/timer";
import QuestionCard from "../../components/questioncard";
import QuizReview from "../../components/quizreview";
import { useAuth } from "@/app/context/AuthContext";
import { saveQuizScore } from "@/app/lib/quizservice";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

interface CompletedQuizResult {
  id: string;
  userId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timestamp: any;
}

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

  // State for quiz duration (will be fetched from database)
  const [totalQuizTime, setTotalQuizTime] = useState<number>(300);
  const [timeRemaining, setTimeRemaining] = useState<number>(300);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [showScore, setShowScore] = useState<boolean>(false);
  const [showReview, setShowReview] = useState<boolean>(false);
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // States for completion check
  const [isCheckingCompletion, setIsCheckingCompletion] =
    useState<boolean>(false);
  const [showCompletionModal, setShowCompletionModal] =
    useState<boolean>(false);
  const [completedQuizData, setCompletedQuizData] =
    useState<CompletedQuizResult | null>(null);
  const [canStartQuiz, setCanStartQuiz] = useState<boolean>(false);

  // Track question response times
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  // Track when the question was first shown to the user
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now()
  );

  const currentQuestion =
    questions.length > 0 ? questions[quizState.currentQuestionIndex] : null;

  // Check if user has already completed this quiz
  useEffect(() => {
    const checkQuizCompletion = async () => {
      if (!user || !activeQuizTitle) {
        setCanStartQuiz(true);
        return;
      }

      try {
        setIsCheckingCompletion(true);

        // Query quizResults collection for this user and quiz
        const completionQuery = query(
          collection(db, "quizResults"),
          where("userId", "==", user.uid),
          where("quizTitle", "==", activeQuizTitle)
        );

        const snapshot = await getDocs(completionQuery);

        if (!snapshot.empty) {
          // User has already completed this quiz
          const completedQuiz = snapshot.docs[0].data() as CompletedQuizResult;
          setCompletedQuizData(completedQuiz);
          setShowCompletionModal(true);
          setCanStartQuiz(false);
        } else {
          // User hasn't completed this quiz yet, can proceed
          setCanStartQuiz(true);
        }
      } catch (error) {
        console.error("Error checking quiz completion:", error);
        // On error, allow user to proceed (fail open)
        setCanStartQuiz(true);
      } finally {
        setIsCheckingCompletion(false);
      }
    };

    checkQuizCompletion();
  }, [user, activeQuizTitle]);

  // Start timer when questions are loaded and fetch quiz duration
  useEffect(() => {
    const fetchQuizDuration = async () => {
      if (questions.length > 0 && !isTimerActive && canStartQuiz) {
        try {
          // Get the active quiz to fetch its duration
          const quizzesSnapshot = await getDocs(collection(db, "quizzes"));
          const activeQuiz = quizzesSnapshot.docs.find(
            (doc) => doc.data().activeQuiz === 1
          );

          if (activeQuiz) {
            const quizData = activeQuiz.data();
            const duration = quizData.quizDuration || 300;
            setTotalQuizTime(duration);
            setTimeRemaining(duration);
          } else {
            // Fallback: calculate based on questions if no active quiz found
            const calculatedTime = questions.length * 45;
            setTotalQuizTime(calculatedTime);
            setTimeRemaining(calculatedTime);
          }

          setIsTimerActive(true);
        } catch (error) {
          console.error("Error fetching quiz duration:", error);
          // Fallback to calculated time
          const calculatedTime = questions.length * 45;
          setTotalQuizTime(calculatedTime);
          setTimeRemaining(calculatedTime);
          setIsTimerActive(true);
        }
      }
    };

    fetchQuizDuration();
  }, [questions.length, isTimerActive, canStartQuiz]);

  useEffect(() => {
    if (quizState.isQuizCompleted) {
      setIsTimerActive(false);
      setShowScore(true);
      saveScoreToFirestore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizState.isQuizCompleted]);

  useEffect(() => {
    if (canStartQuiz) {
      setQuestionStartTime(Date.now());
    }
  }, [quizState.currentQuestionIndex, canStartQuiz]);

  // Auto-advance to next question after answering
  useEffect(() => {
    if (quizState.isAnswerCorrect !== null) {
      handleNextQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizState.isAnswerCorrect]);

  const saveScoreToFirestore = async () => {
    if (!user || !activeQuizTitle) {
      setSaveError("User not logged in or quiz title missing");
      return;
    }

    try {
      setIsSavingScore(true);
      setSaveError(null);

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
          responseTime: responseTimes[index] || 0,
        })
      );

      await saveQuizScore(
        user.uid,
        userEmailOrName,
        activeQuizTitle,
        quizState.score,
        questions.length,
        enhancedUserAnswers,
        parseFloat(averageResponseTime.toString())
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

    // Calculate response time for this question (in seconds)
    const responseTime = (Date.now() - questionStartTime) / 1000;
    setResponseTimes((prev) => [...prev, responseTime]);

    // Determine if answer is correct based on question type
    const isCorrect =
      currentQuestion.questionType === "multiple-choice"
        ? userAnswer.id === currentQuestion.correctAnswerId
        : (() => {
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
          responseTime,
        },
      ],
    }));
  };

  const handleNextQuestion = () => {
    const nextIndex = quizState.currentQuestionIndex + 1;

    setQuizState((prev) => ({
      ...prev,
      ...(nextIndex >= questions.length
        ? { isQuizCompleted: true }
        : { currentQuestionIndex: nextIndex, isAnswerCorrect: null }),
    }));
  };

  // Handle when the overall timer runs out
  const handleTimeUp = () => {
    // Auto-submit current question as incorrect if not answered
    if (currentQuestion && quizState.isAnswerCorrect === null) {
      const responseTime = (Date.now() - questionStartTime) / 1000;
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
            responseTime,
          },
        ],
      }));
    }

    // Mark remaining questions as unanswered if any
    const remainingQuestions = questions.slice(
      quizState.currentQuestionIndex + 1
    );
    const unansweredEntries = remainingQuestions.map((q) => ({
      questionId: q.id,
      answerId: "",
      isCorrect: false,
      responseTime: 0,
    }));

    setQuizState((prev) => ({
      ...prev,
      isQuizCompleted: true,
      userAnswers: [...prev.userAnswers, ...unansweredEntries],
    }));
  };

  // Handle closing the completion modal and redirecting
  const handleCompletionModalClose = () => {
    setShowCompletionModal(false);
    window.location.href = "/pages/leaderboard";
  };

  // Handle showing the review
  const handleShowReview = () => {
    setShowReview(true);
  };

  // Handle going back from review to results
  const handleBackToResults = () => {
    setShowReview(false);
  };

  // Show loading state while checking completion
  if (loading || isCheckingCompletion) {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-screen">
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {loading
            ? "Loading quiz questions..."
            : "Checking quiz completion..."}
        </Typography>
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

  // Show review if requested
  if (showReview && quizState.isQuizCompleted) {
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    return (
      <div>
        <div className="flex items-center justify-between mb-4 max-w-4xl mx-auto px-4">
          <button
            onClick={handleBackToResults}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
          >
            ← Back to Results
          </button>
        </div>

        <QuizReview
          questions={questions}
          userAnswers={quizState.userAnswers}
          score={quizState.score}
          totalQuestions={questions.length}
          quizTitle={activeQuizTitle ?? undefined}
          averageResponseTime={averageResponseTime}
        />
      </div>
    );
  }

  return (
    <>
      {/* Completion Modal */}
      <Modal
        open={showCompletionModal}
        onClose={() => {}} // Prevent closing by clicking outside
        aria-labelledby="completion-modal-title"
        aria-describedby="completion-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            textAlign: "center",
          }}
        >
          <Typography
            id="completion-modal-title"
            variant="h5"
            component="h2"
            gutterBottom
          >
            Quiz Already Completed
          </Typography>
          <Typography id="completion-modal-description" sx={{ mt: 2, mb: 3 }}>
            You have already completed this quiz.
            {completedQuizData && (
              <>
                <br />
                <strong>Your Score:</strong> {completedQuizData.score} /{" "}
                {completedQuizData.totalQuestions} (
                {completedQuizData.percentage.toFixed(1)}%)
              </>
            )}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCompletionModalClose}
            sx={{ mt: 2 }}
          >
            View Leaderboard
          </Button>
        </Box>
      </Modal>

      {canStartQuiz && (
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
                  totalTime={totalQuizTime}
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
            </>
          ) : (
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
                      ).toFixed(1)
                    : 0}
                  s
                </Typography>
                <Typography variant="h6" sx={{ mt: 2, color: "primary.main" }}>
                  {((quizState.score / questions.length) * 100).toFixed(1)}%
                </Typography>
              </Paper>

              {/* Save Status */}
              {isSavingScore && (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Saving your score...</Typography>
                </Box>
              )}

              {saveError && (
                <Alert severity="error" sx={{ width: "100%", maxWidth: 400 }}>
                  {saveError}
                </Alert>
              )}

              {!isSavingScore && !saveError && (
                <Alert severity="success" sx={{ width: "100%", maxWidth: 400 }}>
                  Your score has been saved successfully!
                </Alert>
              )}

              {/* Action Buttons */}
              <Box display="flex" gap={2} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleShowReview}
                  disabled={isSavingScore}
                >
                  Review Answers
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => (window.location.href = "/pages/leaderboard")}
                  disabled={isSavingScore}
                >
                  View Leaderboard
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => (window.location.href = "/pages/profile")}
                  disabled={isSavingScore}
                >
                  Back to Profile
                </Button>
              </Box>
            </Box>
          )}
        </div>
      )}
    </>
  );
};

export default Quiz;
