import React, { useRef, useState, useEffect } from "react";
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
  const [expandedItems, setExpandedItems] = useState<boolean[]>([]);

  // Initialise one controlled boolean per question
  useEffect(() => {
    setExpandedItems(new Array(questions.length).fill(false));
  }, [questions.length]);

  const allExpanded = expandedItems.length > 0 && expandedItems.every(Boolean);

  const handleToggleAll = () => {
    const next = !allExpanded;
    setExpandedItems(new Array(questions.length).fill(next));
  };

  const handleToggleItem = (index: number) => {
    setExpandedItems((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

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
    setIsDownloading(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      const wrapText = (
        text: string,
        maxWidth: number,
        fontSize: number
      ): string[] => {
        pdf.setFontSize(fontSize);
        return pdf.splitTextToSize(text, maxWidth);
      };

      // ── Header ──────────────────────────────────────────────────────────────
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(quizTitle ?? "Quiz Review", pageWidth / 2, y, {
        align: "center",
      });
      y += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const dateStr = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      pdf.text(`Date: ${dateStr}`, pageWidth / 2, y, { align: "center" });
      y += 5;

      // ── Summary bar ──
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 5;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(
        `Score: ${score} / ${totalQuestions}  (${percentage}%)   |   Avg Response Time: ${averageResponseTime.toFixed(
          1
        )}s   |   Correct: ${correctAnswers}   Incorrect: ${incorrectAnswers}`,
        pageWidth / 2,
        y,
        { align: "center" }
      );
      y += 5;

      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;

      // ── Questions ──
      questions.forEach((question, index) => {
        const userAnswer = userAnswers.find(
          (ua) => ua.questionId === question.id
        );
        const isCorrect = userAnswer?.isCorrect ?? false;

        // Question number + text
        const questionLabel = `${index + 1}. ${question.text}`;
        const questionLines = wrapText(questionLabel, contentWidth, 11);
        checkPageBreak(questionLines.length * 5 + 30);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text(questionLines, margin, y);
        y += questionLines.length * 5 + 2;

        // Answers
        if (question.questionType === "multiple-choice") {
          const optionLabels = ["A", "B", "C", "D", "E"];
          question.answers.forEach((answer, ansIdx) => {
            const isCorrectOption = answer.id === question.correctAnswerId;
            const isUserSelected = userAnswer?.answerId === answer.id;

            const prefix = `${optionLabels[ansIdx] ?? ansIdx + 1}.`;
            const answerLines = wrapText(
              `${prefix}  ${answer.text}`,
              contentWidth - 8,
              10
            );
            checkPageBreak(answerLines.length * 5 + 4);

            if (isCorrectOption) {
              // Bold + underline correct answer
              pdf.setFont("helvetica", "bold");
              pdf.setFontSize(10);
              pdf.text(answerLines, margin + 6, y);
              // underline first line
              const lineW = pdf.getTextWidth(answerLines[0]);
              pdf.setLineWidth(0.2);
              pdf.line(margin + 6, y + 0.8, margin + 6 + lineW, y + 0.8);
            } else {
              pdf.setFont("helvetica", "normal");
              pdf.setFontSize(10);
              pdf.text(answerLines, margin + 6, y);
            }

            // Mark user's wrong choice
            if (isUserSelected && !isCorrectOption) {
              pdf.setFont("helvetica", "italic");
              pdf.setFontSize(8);
              const tag = "(Your answer — incorrect)";
              pdf.text(tag, pageWidth - margin, y, { align: "right" });
            }

            y += answerLines.length * 5 + 1;
          });
        } else {
          // Short-answer / fill-in
          const correctAnswer = question.answers.find(
            (a) => a.id === question.correctAnswerId
          );
          const userText = userAnswer?.answerId || "No answer provided";

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          const yourLines = wrapText(
            `Your answer: ${userText}`,
            contentWidth - 6,
            10
          );
          checkPageBreak(yourLines.length * 5 + 8);
          pdf.text(yourLines, margin + 6, y);
          y += yourLines.length * 5 + 1;

          if (!isCorrect && correctAnswer) {
            pdf.setFont("helvetica", "bold");
            const corrLines = wrapText(
              `Correct answer: ${correctAnswer.text}`,
              contentWidth - 6,
              10
            );
            checkPageBreak(corrLines.length * 5 + 4);
            pdf.text(corrLines, margin + 6, y);
            y += corrLines.length * 5 + 1;
          }
        }

        // Result + response time footer for each question
        // pdf.setFont("helvetica", "italic");
        // pdf.setFontSize(8);
        // pdf.text(
        //   `${
        //     isCorrect ? "✓ Correct" : "✗ Incorrect"
        //   }   |   Response time: ${responseTime.toFixed(1)}s`,
        //   margin + 6,
        //   y
        // );
        // y += 4;
        // Add this just before the divider line at the bottom of each question block
        if (question.explanation) {
          const explanationLines = wrapText(
            `Explanation: ${question.explanation}`,
            contentWidth - 6,
            10
          );
          checkPageBreak(explanationLines.length * 5 + 6);

          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(10);
          pdf.text(explanationLines, margin + 6, y);
          y += explanationLines.length * 5 + 2;
        }

        // Divider between questions
        pdf.setDrawColor(180);
        pdf.setLineWidth(0.2);
        pdf.line(margin, y, pageWidth - margin, y);
        pdf.setDrawColor(0);
        y += 6;
      });

      pdf.save(`${quizTitle ?? "quiz"}-review.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
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
          onClick={handleToggleAll}
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
              ? "Excellent work!"
              : percentage >= 70
              ? "Good job!"
              : percentage >= 50
              ? "Fair performance."
              : "Keep studying!."}
          </Typography>
        </Paper>

        {/* Question Review */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
          Detailed Review
        </Typography>

        {questions.map((question, index) => {
          console.log(
            "Explanation for question",
            index + 1,
            ":",
            question.explanation
          );

          const userAnswer = userAnswers.find(
            (ua) => ua.questionId === question.id
          );
          const isCorrect = userAnswer?.isCorrect || false;
          const responseTime = userAnswer?.responseTime || 0;

          return (
            <Accordion
              key={question.id}
              expanded={!!expandedItems[index]}
              onChange={() => handleToggleItem(index)}
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

                  {question.explanation && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        backgroundColor: "#fffde7",
                        border: "1px solid #fff176",
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 0.5, fontWeight: "bold" }}
                      >
                        Explanation:
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {question.explanation}
                      </Typography>
                    </Box>
                  )}

                  {/* Response Time */}
                  {/* <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                    <Typography variant="caption" color="textSecondary">
                      Response Time: {responseTime.toFixed(2)} seconds
                      {responseTime > averageResponseTime + 5 &&
                        " (Slower than average)"}
                      {responseTime < averageResponseTime - 5 &&
                        " (Faster than average)"}
                    </Typography>
                  </Box> */}
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
