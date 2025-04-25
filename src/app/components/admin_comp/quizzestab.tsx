import { FaEye, FaTrash } from "react-icons/fa";
import { Typography, Button } from "@mui/material";
import { Quiz } from "../../types/quiz";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface QuizzesTabProps {
  quizzes: Quiz[];
  onView: (quiz: Quiz) => void;
  onDelete: (id: string) => void;
  router: AppRouterInstance;
}

const QuizzesTab = ({ quizzes, onView, onDelete, router }: QuizzesTabProps) => {
  return (
    <div>
      <div className="flex justify-between mb-4">
        <Typography variant="h6">Quizzes</Typography>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={() => router.push("/pages/admin/create-quiz")}
        >
          Create New
        </Button>
      </div>
      <ul className="space-y-4">
        {quizzes.length === 0 ? (
          <Typography variant="body2">No quizzes available</Typography>
        ) : (
          quizzes.map((quiz) => (
            <li key={quiz.id} className="p-3 bg-gray-700 rounded-md">
              <div className="mb-2">
                <p className="font-medium">{quiz.quizTitle}</p>
                <p className="text-xs text-gray-400">
                  {quiz.questions.length} questions
                </p>
              </div>
              <div className="flex space-x-2 justify-end">
                <button
                  onClick={() => onView(quiz)}
                  className="text-green-400 hover:text-green-600 p-1"
                  title="View"
                >
                  <FaEye />
                </button>
                <button
                  onClick={() => onDelete(quiz.id)}
                  className="text-red-400 hover:text-red-600 p-1"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default QuizzesTab;
