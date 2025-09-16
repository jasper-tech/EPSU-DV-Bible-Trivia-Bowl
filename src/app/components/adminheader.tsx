"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// import Image from "next/image";
import {
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaQuestion,
  FaClipboardList,
  FaCloudUploadAlt,
  FaHome,
  FaCrown,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { CircularProgress, Tabs, Tab, Box, Badge, Modal } from "@mui/material";

import { auth, db } from "../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  deleteDoc,
  onSnapshot,
  updateDoc,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";

import QuestionsTab from "./admin_comp/questiontab";
import QuizzesTab from "./admin_comp/quizzestab";
import DeleteConfirmDialog from "./deleteconfirmdialog";
import ViewQuestionDialog from "./viewquestiondialog";
import ViewQuizDialog from "./viewquizdialog";

import { UserData, Question, Quiz } from "../types/quiz";

const AdminHeader = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewedQuestion, setViewedQuestion] = useState<Question | null>(null);
  const [viewedQuiz, setViewedQuiz] = useState<Quiz | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();
  const { logout } = useAuth();

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

  // Fetch questions
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

  // Fetch quizzes and determine active quiz
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "quizzes"),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const loadedQuizzes: Quiz[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Quiz, "id">),
        }));

        setQuizzes(loadedQuizzes);

        // Find the currently active quiz
        const currentActiveQuiz = loadedQuizzes.find(
          (quiz) => quiz.activeQuiz === 1
        );
        setActiveQuiz(currentActiveQuiz || null);

        setQuizzesLoading(false);
      },
      (error) => {
        console.error("Error fetching quizzes:", error);
        toast.error("Failed to load quizzes.");
        setQuizzesLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUploadsClick = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedId) {
      const collection = activeTab === 0 ? "questions" : "quizzes";
      const successMessage =
        activeTab === 0
          ? "Question deleted successfully!"
          : "Quiz deleted successfully!";
      const errorMessage =
        activeTab === 0 ? "Error deleting question." : "Error deleting quiz.";

      try {
        await deleteDoc(doc(db, collection, selectedId));
        toast.success(successMessage);
      } catch (error) {
        console.error("Delete error:", error);
        toast.error(errorMessage);
      }

      setOpenDialog(false);
      setSelectedId(null);
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

  const handleViewQuiz = (quiz: Quiz) => {
    setViewedQuiz(quiz);
  };

  const handleCloseViewModal = () => {
    setViewedQuestion(null);
    setViewedQuiz(null);
  };

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleUnupload = async () => {
    if (!activeQuiz) return;

    try {
      // Update the quiz document to set activeQuiz to 0
      await updateDoc(doc(db, "quizzes", activeQuiz.id), {
        activeQuiz: 0,
      });

      toast.success("Quiz unuploaded successfully");
    } catch (error) {
      console.error("Error unuploading quiz:", error);
      toast.error("Failed to unupload quiz");
    }
  };

  return (
    <>
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 relative">
        {/* Left: Hamburger + User */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white bg-white/20 p-2.5 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-all duration-200"
          >
            <FaBars className="text-lg" />
          </button>
          {/* <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 bg-white/20 backdrop-blur-sm">
            <Image
              src={userData?.image || "/default-profile.png"}
              alt="Profile"
              width={40}
              height={40}
              className="object-cover"
            />
          </div> */}
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <FaCrown className="text-yellow-300 text-lg" />
            </div>
            <div>
              <span className="font-semibold text-base">
                {loading ? "Loading..." : userData?.name}
              </span>
              <p className="text-sm text-white/80">
                {loading ? "Loading role..." : `Quizmaster | ${userData?.role}`}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Navigation + Signout */}
        <div className="flex items-center justify-end sm:justify-between w-full sm:w-auto gap-4">
          <button
            onClick={() => router.push("/pages/admin")}
            className="flex items-center text-white/90 hover:text-white bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
          >
            <FaHome className="mr-2" />
            <span className="text-sm">Home</span>
          </button>
          <button
            onClick={handleUploadsClick}
            className="relative flex items-center text-white/90 hover:text-white bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
          >
            <Badge badgeContent={activeQuiz ? 1 : 0} color="primary">
              <FaCloudUploadAlt className="mr-2" />
            </Badge>
            <span className="text-sm">Active Quiz</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-sm"
          >
            <FaSignOutAlt className="mr-2" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-gray-800 to-gray-900 text-white w-80 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } shadow-2xl`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-800">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <Box sx={{ width: "100%", bgcolor: "rgba(31, 41, 55, 0.8)", backdropFilter: "blur(10px)" }}>
          <Tabs
            value={activeTab}
            onChange={handleChangeTab}
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: "rgba(255, 255, 255, 0.1)",
              "& .MuiTab-root": {
                color: "rgba(255, 255, 255, 0.7)",
                opacity: 0.7,
                py: 2,
                "&.Mui-selected": {
                  color: "white",
                  opacity: 1,
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "white",
                height: 3,
              },
            }}
          >
            <Tab icon={<FaQuestion />} label="Questions" />
            <Tab icon={<FaClipboardList />} label="Quizzes" />
          </Tabs>
        </Box>

        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-800/90 to-gray-900/90 backdrop-blur-sm">
          {/* Questions Tab */}
          <div role="tabpanel" hidden={activeTab !== 0}>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <CircularProgress sx={{ color: "white" }} />
              </div>
            ) : (
              <QuestionsTab
                questions={questions}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={confirmDelete}
                router={router}
              />
            )}
          </div>

          {/* Quizzes Tab */}
          <div role="tabpanel" hidden={activeTab !== 1}>
            {quizzesLoading ? (
              <div className="flex justify-center items-center h-40">
                <CircularProgress sx={{ color: "white" }} />
              </div>
            ) : (
              <QuizzesTab
                quizzes={quizzes}
                onView={handleViewQuiz}
                onDelete={confirmDelete}
                router={router}
              />
            )}
          </div>
        </div>
      </div>

      {/* Updated Modal for Active Quiz */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box
          className="bg-white rounded-xl shadow-2xl p-6 border border-gray-200"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            maxHeight: "80vh",
            overflowY: "auto",
            outline: "none",
          }}
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-3">
            Currently Active Quiz
          </h2>
          {activeQuiz ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-xl bg-green-50 border-green-200">
                <div>
                  <span className="text-gray-800 font-semibold">
                    {activeQuiz.quizTitle}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Duration: {Math.floor((activeQuiz.quizDuration || 0) / 60)}:
                    {((activeQuiz.quizDuration || 0) % 60)
                      .toString()
                      .padStart(2, "0")}
                  </p>
                  <p className="text-sm text-green-600 font-medium mt-2">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    Currently Active
                  </p>
                </div>
                <button
                  onClick={handleUnupload}
                  className="ml-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg text-sm hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm"
                >
                  Unupload
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              No quiz is currently active.
            </p>
          )}
          <button
            onClick={handleCloseModal}
            className="mt-6 w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm"
          >
            Close
          </button>
        </Box>
      </Modal>

      {/* Dialogs */}
      <DeleteConfirmDialog
        open={openDialog}
        onClose={handleCancel}
        onConfirm={handleConfirmDelete}
        itemType={activeTab === 0 ? "question" : "quiz"}
      />

      <ViewQuestionDialog
        question={viewedQuestion}
        onClose={handleCloseViewModal}
      />

      <ViewQuizDialog quiz={viewedQuiz} onClose={handleCloseViewModal} />
    </>
  );
};

export default AdminHeader;