import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Question } from "../types/quiz";

const createQuiz = async (
  quizNumber: string,
  questions: Question[],
  quizmasterId: string
): Promise<void> => {
  try {
    // Add quiz data to Firestore collection
    const quizRef = await addDoc(collection(db, "quizzes"), {
      quizNumber,
      createdBy: quizmasterId,
      createdAt: serverTimestamp(),
      questions,
      participants: [],
      winners: [],
    });

    console.log("Quiz created with ID:", quizRef.id);
  } catch (err) {
    console.error("Failed to create quiz:", err);
  }
};

export default createQuiz;
