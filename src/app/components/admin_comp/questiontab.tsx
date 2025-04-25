import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { Typography, Button } from "@mui/material";
import { Question } from "../../types/quiz";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface QuestionsTabProps {
  questions: Question[];
  onView: (question: Question) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  router: AppRouterInstance;
}

const QuestionsTab = ({
  questions,
  onView,
  onEdit,
  onDelete,
  router,
}: QuestionsTabProps) => {
  return (
    <div>
      <div className="flex justify-between mb-4">
        <Typography variant="h6">Question Bank</Typography>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={() => router.push("/pages/admin/add-question")}
        >
          Add New
        </Button>
      </div>
      <ul className="space-y-4">
        {questions.length === 0 ? (
          <Typography variant="body2">No questions available</Typography>
        ) : (
          questions.map((question) => (
            <li key={question.id} className="p-3 bg-gray-700 rounded-md">
              <p className="truncate text-sm mb-2">{question.text}</p>
              <div className="flex space-x-2 justify-end">
                <button
                  onClick={() => onView(question)}
                  className="text-green-400 hover:text-green-600 p-1"
                  title="View"
                >
                  <FaEye />
                </button>
                <button
                  onClick={() => onEdit(question.id)}
                  className="text-blue-400 hover:text-blue-600 p-1"
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => onDelete(question.id)}
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

export default QuestionsTab;
