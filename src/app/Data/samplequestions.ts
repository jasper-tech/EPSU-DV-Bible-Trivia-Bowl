import { Question } from "../types/quiz";

export const sampleQuestions: Question[] = [
  {
    id: "q1",
    text: "What is the capital of France?",
    answers: [
      { id: "a1", text: "Berlin" },
      { id: "a2", text: "Madrid" },
      { id: "a3", text: "Paris" },
      { id: "a4", text: "Rome" },
    ],
    correctAnswerId: "a3",
    explanation: "Paris is the capital city of France.",
  },
  {
    id: "q2",
    text: "Which language is primarily used for web development?",
    answers: [
      { id: "a1", text: "Python" },
      { id: "a2", text: "JavaScript" },
      { id: "a3", text: "C++" },
      { id: "a4", text: "Java" },
    ],
    correctAnswerId: "a2",
    explanation:
      "JavaScript is the most commonly used language for client-side web development.",
  },
  {
    id: "q3",
    text: "What is the result of 2 + 2 × 2?",
    answers: [
      { id: "a1", text: "6" },
      { id: "a2", text: "8" },
      { id: "a3", text: "4" },
      { id: "a4", text: "12" },
    ],
    correctAnswerId: "a1",
    explanation:
      "According to BODMAS, multiplication comes before addition. So: 2 + (2 × 2) = 6.",
  },
];
