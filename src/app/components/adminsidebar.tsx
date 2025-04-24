"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { FaTrash, FaEdit, FaBars, FaTimes, FaEye } from "react-icons/fa";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import CircularProgress from "@mui/material/CircularProgress";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

interface Answer {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  explanation: string;
  answers: Answer[];
  correctAnswerId: string;
}

const AdminSidebar = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [viewedQuestion, setViewedQuestion] = useState<Question | null>(null);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "questions"),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const loadedQuestions: Question[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Question, "id">),
        }));
        setQuestions(loadedQuestions);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching questions:", error);
        toast.error("Failed to load questions.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedId) {
      try {
        await deleteDoc(doc(db, "questions", selectedId));
        toast.success("Question deleted successfully!");
        setOpenDialog(false);
        setSelectedId(null);
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Error deleting question.");
      }
    }
  };

  const handleCancel = () => {
    setOpenDialog(false);
    setSelectedId(null);
  };

  const handleEdit = (id: string) => {
    router.push(`/pages/admin/edit/${id}`);
  };

  const handleView = (question: Question) => {
    setViewedQuestion(question);
  };

  const handleCloseViewModal = () => {
    setViewedQuestion(null);
  };

  return (
    <>
      {/* Hamburger Icon */}
      <div className="md:hidden p-4">
        <button
          onClick={() => setShowSidebar(true)}
          className="text-white bg-gray-800 p-2 rounded"
        >
          <FaBars size={14} />
        </button>
      </div>

      {/* Sidebar Drawer */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white w-64 z-50 p-4 transform transition-transform duration-300 ease-in-out ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:block`}
      >
        {/* Close button (mobile only) */}
        <div className="md:hidden flex justify-end mb-4">
          <button onClick={() => setShowSidebar(false)} className="text-white">
            <FaTimes size={20} />
          </button>
        </div>

        <h2 className="text-2xl font-bold mt-16 mb-4">Question Bank</h2>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <CircularProgress color="primary" />
          </div>
        ) : (
          <ul className="space-y-4">
            {questions.map((question) => (
              <li
                key={question.id}
                className="flex justify-between items-center"
              >
                <p className="truncate max-w-xs">{question.text}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleView(question)}
                    className="text-green-400 hover:text-green-600"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => handleEdit(question.id)}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => confirmDelete(question.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <FaTrash />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleCancel}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this question? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Question Modal */}
      <Dialog
        open={!!viewedQuestion}
        onClose={handleCloseViewModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Question Details</DialogTitle>
        <DialogContent>
          {viewedQuestion && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Question:</strong> {viewedQuestion.text}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Explanation:</strong> {viewedQuestion.explanation}
              </Typography>
              <List>
                {viewedQuestion.answers.map((answer) => (
                  <ListItem
                    key={answer.id}
                    sx={{
                      backgroundColor:
                        answer.id === viewedQuestion.correctAnswerId
                          ? "rgba(0, 255, 0, 0.1)"
                          : "transparent",
                    }}
                  >
                    <ListItemText
                      primary={
                        <>
                          {answer.text}
                          {answer.id === viewedQuestion.correctAnswerId && (
                            <strong className="ml-2 text-green-600">
                              (Correct)
                            </strong>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewModal} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminSidebar;
