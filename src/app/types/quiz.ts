// Represents a single answer option
export interface Answer {
  id: string;
  text: string;
}

// Represents a single question with its answers
export interface Question {
  id: string;
  text: string;
  questionType: "multiple-choice" | "text";
  answers: Answer[];
  correctAnswerId: string;
  explanation?: string;
  image?: string;
  context?: string;
}

// Tracks a user's answer to a specific question
export interface UserAnswer {
  questionId: string;
  answerId: string;
  isCorrect: boolean;
}

// The overall state of the quiz
export interface QuizState {
  currentQuestionIndex: number;
  score: number;
  isAnswerCorrect: boolean | null;
  isQuizCompleted: boolean;
  userAnswers: UserAnswer[];
}

// Props for the QuestionCard component
export interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

// Props for the AnswerBox component
export interface AnswerBoxProps {
  answers: Answer[];
  onSubmit: (answer: Answer) => void;
  isAnswerCorrect: boolean | null;
  correctAnswerId: string;
  disabled: boolean;
  questionType: "multiple-choice" | "text";
}

// Props for the Timer component
export interface TimerProps {
  timeRemaining: number;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  isActive: boolean;
  onTimeUp: () => void;
}

// Props for the ScoreBanner component
export interface ScoreBannerProps {
  score: number;
  totalQuestions: number;
  currentQuestionIndex: number;
}

// Quiz configuration settings
export interface QuizConfig {
  timePerQuestion: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  passingScore: number;
}
