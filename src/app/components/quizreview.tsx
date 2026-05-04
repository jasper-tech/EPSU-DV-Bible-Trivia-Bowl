import React, { useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  ExpandMore,
  CheckCircle,
  Cancel,
  AccessTime,
  Download,
  ExpandMore as ExpandAllIcon,
} from "@mui/icons-material";
import { Question } from "../types/quiz";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface UserAnswer {
  questionId: string;
  answerId: string;
  isCorrect: boolean;
  responseTime: number;
}

interface QuizReviewProps {
  questions: Question[];
  userAnswers: UserAnswer[];
  score: number;
  totalQuestions: number;
  quizTitle?: string;
  averageResponseTime: number;
}

const QuizReview: React.FC<QuizReviewProps> = ({
  questions,
  userAnswers,
  score,
  totalQuestions,
  quizTitle,
  averageResponseTime,
}) => {
  const reviewRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [allExpanded, setAllExpanded] = useState(false);

  // Helper function to get user's answer text
  const getUserAnswerText = (question: Question, userAnswer: UserAnswer) => {
    if (question.questionType === "multiple-choice") {
      const selectedAnswer = question.answers.find(
        (answer) => answer.id === userAnswer.answerId
      );
      return selectedAnswer ? selectedAnswer.text : "No answer selected";
    } else {
      return userAnswer.answerId || "No answer provided";
    }
  };

  // Helper function to get correct answer text
  const getCorrectAnswerText = (question: Question) => {
    const correctAnswer = question.answers.find(
      (answer) => answer.id === question.correctAnswerId
    );
    return correctAnswer ? correctAnswer.text : "No correct answer found";
  };

  // Calculate performance stats
  const correctAnswers = userAnswers.filter(
    (answer) => answer.isCorrect
  ).length;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const percentage = Math.round((score / totalQuestions) * 100);

  const handleDownloadPDF = async () => {
    if (!reviewRef.current) return;

    setIsDownloading(true);

    // Expand all accordions first
    setAllExpanded(true);

    // Wait for accordion animations to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const element = reviewRef.current;
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;

      // Capture the full element — html2canvas handles long content
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        // Capture the full scrollable height, not just the visible viewport
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        // Override height to capture all content
        height: element.scrollHeight,
        width: element.scrollWidth,
      });

      // Calculate dimensions to fit into PDF pages
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const usablePageHeight = pageHeight - margin * 2;
      const totalPages = Math.ceil(imgHeight / usablePageHeight);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        // Calculate which vertical slice of the image goes on this page
        const sourceY = page * usablePageHeight * (canvas.height / imgHeight);
        const sourceHeight = Math.min(
          usablePageHeight * (canvas.height / imgHeight),
          canvas.height - sourceY
        );

        // Create a temporary canvas for this page's slice
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;

        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sourceHeight,
            0,
            0,
            canvas.width,
            sourceHeight
          );
        }

        const pageImgData = pageCanvas.toDataURL("image/png");
        const sliceHeight = (sourceHeight * imgWidth) / canvas.width;

        pdf.addImage(pageImgData, "PNG", margin, margin, imgWidth, sliceHeight);
      }

      pdf.save(`${quizTitle ?? "quiz"}-review.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setAllExpanded(false);
      setIsDownloading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: "800px", margin: "0 auto", p: 2 }}>
      {/* Download Controls — outside reviewRef so they don't appear in PDF */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          startIcon={<ExpandAllIcon />}
          onClick={() => setAllExpanded((prev) => !prev)}
        >
          {allExpanded ? "Collapse All" : "Expand All"}
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={
            isDownloading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Download />
            )
          }
          onClick={handleDownloadPDF}
          disabled={isDownloading}
        >
          {isDownloading ? "Generating PDF..." : "Download PDF"}
        </Button>
      </Box>

      {/* Everything inside reviewRef is captured in the PDF */}
      <Box ref={reviewRef} sx={{ p: 1, backgroundColor: "#ffffff" }}>
        {/* Header */}
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Quiz Review
        </Typography>

        {quizTitle && (
          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            align="center"
            color="textSecondary"
          >
            {quizTitle}
          </Typography>
        )}

        {/* Summary Statistics */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, backgroundColor: "#f8f9fa" }}>
          <Typography variant="h6" gutterBottom>
            Performance Summary
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
            <Chip
              icon={<CheckCircle />}
              label={`Score: ${score}/${totalQuestions} (${percentage}%)`}
              color={
                percentage >= 70
                  ? "success"
                  : percentage >= 50
                  ? "warning"
                  : "error"
              }
              variant="filled"
            />

            <Chip
              icon={<CheckCircle />}
              label={`Correct: ${correctAnswers}`}
              color="success"
              variant="outlined"
            />

            <Chip
              icon={<Cancel />}
              label={`Incorrect: ${incorrectAnswers}`}
              color="error"
              variant="outlined"
            />

            <Chip
              icon={<AccessTime />}
              label={`Avg Time: ${averageResponseTime.toFixed(1)}s`}
              color="info"
              variant="outlined"
            />
          </Box>

          <Typography variant="body2" color="textSecondary">
            {percentage >= 90
              ? "Excellent work! You have a strong understanding of the bible."
              : percentage >= 70
              ? "Good job! You have a solid grasp of biblical stories."
              : percentage >= 50
              ? "Fair performance. Consider reading your bible more often."
              : "Keep studying! Focus on the word of God."}
          </Typography>
        </Paper>

        {/* Question Review */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
          Detailed Review
        </Typography>

        {questions.map((question, index) => {
          const userAnswer = userAnswers.find(
            (ua) => ua.questionId === question.id
          );
          const isCorrect = userAnswer?.isCorrect || false;
          const responseTime = userAnswer?.responseTime || 0;

          return (
            <Accordion
              key={question.id}
              expanded={allExpanded || undefined}
              sx={{
                mb: 1,
                "&:before": { display: "none" },
                boxShadow: 1,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  backgroundColor: isCorrect ? "#e8f5e8" : "#ffeaea",
                  "&:hover": {
                    backgroundColor: isCorrect ? "#d4edda" : "#f8d7da",
                  },
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", width: "100%" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
                    {isCorrect ? (
                      <CheckCircle sx={{ color: "success.main", mr: 1 }} />
                    ) : (
                      <Cancel sx={{ color: "error.main", mr: 1 }} />
                    )}
                  </Box>

                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "medium" }}
                    >
                      Question {index + 1}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mt: 0.5 }}
                    >
                      {question.text.length > 100
                        ? `${question.text.substring(0, 100)}...`
                        : question.text}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: "right", minWidth: "80px" }}>
                    <Chip
                      size="small"
                      label={isCorrect ? "Correct" : "Wrong"}
                      color={isCorrect ? "success" : "error"}
                      variant="filled"
                    />
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ mt: 0.5 }}
                    >
                      {responseTime.toFixed(1)}s
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Box>
                  {/* Full Question */}
                  <Typography variant="h6" gutterBottom>
                    {question.text}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* User's Answer */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, display: "flex", alignItems: "center" }}
                    >
                      <Box
                        component="span"
                        sx={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: isCorrect
                            ? "success.main"
                            : "error.main",
                          mr: 1,
                        }}
                      />
                      Your Answer:
                    </Typography>
                    <Paper
                      sx={{
                        p: 2,
                        backgroundColor: isCorrect ? "#f0f8f0" : "#fff5f5",
                        border: `1px solid ${
                          isCorrect ? "#c8e6c9" : "#ffcdd2"
                        }`,
                      }}
                    >
                      <Typography variant="body1">
                        {userAnswer
                          ? getUserAnswerText(question, userAnswer)
                          : "No answer provided"}
                      </Typography>
                    </Paper>
                  </Box>

                  {/* Correct Answer (only show if user was wrong) */}
                  {!isCorrect && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, display: "flex", alignItems: "center" }}
                      >
                        <Box
                          component="span"
                          sx={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: "success.main",
                            mr: 1,
                          }}
                        />
                        Correct Answer:
                      </Typography>
                      <Paper
                        sx={{
                          p: 2,
                          backgroundColor: "#f0f8f0",
                          border: "1px solid #c8e6c9",
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: "medium" }}
                        >
                          {getCorrectAnswerText(question)}
                        </Typography>
                      </Paper>
                    </Box>
                  )}

                  {/* All Options (for multiple choice) */}
                  {question.questionType === "multiple-choice" && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        All Options:
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        {question.answers.map((answer) => {
                          const isUserSelected =
                            userAnswer?.answerId === answer.id;
                          const isCorrectOption =
                            answer.id === question.correctAnswerId;

                          return (
                            <Paper
                              key={answer.id}
                              sx={{
                                p: 1.5,
                                backgroundColor: isCorrectOption
                                  ? "#e8f5e8"
                                  : isUserSelected && !isCorrectOption
                                  ? "#ffeaea"
                                  : "#f5f5f5",
                                border: `1px solid ${
                                  isCorrectOption
                                    ? "#4caf50"
                                    : isUserSelected && !isCorrectOption
                                    ? "#f44336"
                                    : "#e0e0e0"
                                }`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography variant="body2">
                                {answer.text}
                              </Typography>
                              <Box sx={{ display: "flex", gap: 1 }}>
                                {isCorrectOption && (
                                  <Chip
                                    size="small"
                                    label="Correct"
                                    color="success"
                                    variant="filled"
                                  />
                                )}
                                {isUserSelected && !isCorrectOption && (
                                  <Chip
                                    size="small"
                                    label="Your Choice"
                                    color="error"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </Paper>
                          );
                        })}
                      </Box>
                    </Box>
                  )}

                  {/* Response Time */}
                  <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                    <Typography variant="caption" color="textSecondary">
                      Response Time: {responseTime.toFixed(2)} seconds
                      {responseTime > averageResponseTime + 5 &&
                        " (Slower than average)"}
                      {responseTime < averageResponseTime - 5 &&
                        " (Faster than average)"}
                    </Typography>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}

        {/* Study Tips */}
        {incorrectAnswers > 0 && (
          <Paper elevation={2} sx={{ p: 3, mt: 3, backgroundColor: "#fff3e0" }}>
            <Typography variant="h6" gutterBottom>
              Results From QuizMaster
            </Typography>
            <Typography variant="body2">
              You got {incorrectAnswers} question
              {incorrectAnswers > 1 ? "s" : ""} wrong.
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default QuizReview;
