"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FaSignOutAlt,
  FaBars,
  FaTrash,
  FaEdit,
  FaEye,
  FaTimes,
} from "react-icons/fa";
import toast from "react-hot-toast";
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
  CircularProgress,
} from "@mui/material";

import { auth, db } from "../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  deleteDoc,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

interface UserData {
  name: string;
  role: string;
  image: string;
}

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

const AdminHeader = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewedQuestion, setViewedQuestion] = useState<Question | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const data = userSnap.data() as UserData;

          if (data.role === "admin") {
            setUserData(data);
          } else {
            toast.error("Access denied. Admins only.");
            router.push("/unauthorized");
          }
        } else {
          toast.error("User data not found.");
        }
      } else {
        toast.error("You must be logged in.");
        router.push("/pages/login");
      }

      setLoading(false);
    };

    fetchUserData();
  }, [router]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "questions"),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const loadedQuestions: Question[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Question, "id">),
        }));
        setQuestions(loadedQuestions);
      },
      (error) => {
        console.error("Error fetching questions:", error);
        toast.error("Failed to load questions.");
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully.");
      router.push("/pages/login");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out.");
    }
  };

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
      <header className="w-full bg-gray-900 text-white px-4 py-3 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 relative">
        {/* Left: Hamburger + User */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className=" text-white bg-gray-700 p-2 rounded"
          >
            <FaBars />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
            <Image
              src={userData?.image || "/default-profile.png"}
              alt="Profile"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div>
            <span className="font-semibold text-base">
              {loading ? "Loading..." : userData?.name}
            </span>
          </div>
        </div>

        {/* Right: Role + Logout */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <p className="text-sm text-gray-400">
            {loading ? "Loading role..." : `Quizmaster | ${userData?.role}`}
          </p>
          <button
            onClick={handleSignOut}
            className="flex items-center text-red-400 hover:text-red-600 text-sm"
          >
            <FaSignOutAlt className="mr-1" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white w-64 z-50 p-4 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Question Bank</h2>
          <button onClick={() => setSidebarOpen(false)} className="text-white">
            <FaTimes />
          </button>
        </div>

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

      {/* Confirm Delete Dialog */}
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

export default AdminHeader;
