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
} from "react-icons/fa";
import toast from "react-hot-toast";
import { CircularProgress, Tabs, Tab, Box, Badge, Modal } from "@mui/material";

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
  const [filteredUploads, setFilteredUploads] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewedQuestion, setViewedQuestion] = useState<Question | null>(null);
  const [viewedQuiz, setViewedQuiz] = useState<Quiz | null>(null);
  const [activeTab, setActiveTab] = useState(0);
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

  // Fetch quizzes
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "quizzes"),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const loadedQuizzes: Quiz[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Quiz, "id">),
        }));
        setQuizzes(loadedQuizzes);
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

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "uploads"),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const uploadedQuizzes = snapshot.docs.map(
          (doc) => doc.data().quizTitle
        );

        // Filter uploads based on activeQuiz in quizzes collection
        const filtered = uploadedQuizzes.filter((uploadTitle) =>
          quizzes.some(
            (quiz) => quiz.quizTitle === uploadTitle && quiz.activeQuiz === 1
          )
        );
        setFilteredUploads(filtered);
      },
      (error) => {
        console.error("Error fetching uploads:", error);
        toast.error("Failed to load uploads.");
      }
    );

    return () => unsubscribe();
  }, [quizzes]);

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

  return (
    <>
      {/* Header */}
      <header className="w-full bg-gray-900 text-white px-4 py-3 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 relative">
        {/* Left: Hamburger + User */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white bg-gray-700 p-2 rounded"
          >
            <FaBars />
          </button>
          {/* <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
            <Image
              src={userData?.image || "/default-profile.png"}
              alt="Profile"
              width={40}
              height={40}
              className="object-cover"
            />
          </div> */}
          <div>
            <span className="font-semibold text-base">
              {loading ? "Loading..." : userData?.name}
            </span>
          </div>
        </div>

        {/* Right: Role + Logout */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <p className="text-sm text-gray-400">
            {loading ? "Loading role..." : `Quizmaster | ${userData?.role}`}
          </p>
          <button
            onClick={() => router.push("/pages/admin")}
            className="flex items-center text-green-400 hover:text-green-600"
          >
            <FaHome size={20} />
            <span className="ml-2 text-sm">Home</span>
          </button>
          <button
            onClick={handleUploadsClick}
            className="relative flex items-center text-blue-400 hover:text-blue-600"
          >
            <Badge badgeContent={filteredUploads.length} color="primary">
              <FaCloudUploadAlt size={20} />
            </Badge>
            <span className="ml-2 text-sm">Uploads</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center text-red-400 hover:text-red-600 text-sm"
          >
            <FaSignOutAlt className="mr-1" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white w-72 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <button onClick={() => setSidebarOpen(false)} className="text-white">
            <FaTimes />
          </button>
        </div>

        <Box sx={{ width: "100%" }}>
          <Tabs
            value={activeTab}
            onChange={handleChangeTab}
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                color: "white",
                opacity: 0.7,
                "&.Mui-selected": {
                  color: "white",
                  opacity: 1,
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "white",
              },
            }}
          >
            <Tab icon={<FaQuestion />} label="Questions" />
            <Tab icon={<FaClipboardList />} label="Quizzes" />
          </Tabs>
        </Box>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Questions Tab */}
          <div role="tabpanel" hidden={activeTab !== 0}>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <CircularProgress color="inherit" />
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
                <CircularProgress color="inherit" />
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
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box
          className="bg-white rounded-lg shadow-lg p-6"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <h2 className="text-lg font-bold mb-4">Uploaded Quizzes</h2>
          {filteredUploads.length > 0 ? (
            <ul className="list-disc pl-5">
              {filteredUploads.map((quizTitle, index) => (
                <li key={index} className="text-gray-700 mb-2">
                  {quizTitle}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No active quizzes uploaded yet.</p>
          )}
          <button
            onClick={handleCloseModal}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all duration-200"
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
