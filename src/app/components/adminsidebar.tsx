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
import { FaTrash, FaEdit } from "react-icons/fa";
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

  return (
    <div className="w-full max-w-xs bg-gray-800 text-white p-4">
      <h2 className="text-2xl font-bold mb-4">Question Bank</h2>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <CircularProgress color="primary" />
        </div>
      ) : (
        <ul className="space-y-4">
          {questions.map((question) => (
            <li key={question.id} className="flex justify-between items-center">
              <p className="truncate max-w-xs">{question.text}</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(question.id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => confirmDelete(question.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Confirmation Dialog */}
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
    </div>
  );
};

export default AdminSidebar;
