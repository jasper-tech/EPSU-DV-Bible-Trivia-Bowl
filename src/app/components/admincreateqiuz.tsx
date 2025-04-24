import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Quiz, Question } from "../types/quiz"; // Import types

// Function to create a quiz
const createQuiz = async (
  quizNumber: string,
  questions: Question[], // Use the defined Question type
  quizmasterId: string
): Promise<void> => {
  try {
    // Add quiz data to Firestore collection
    const quizRef = await addDoc(collection(db, "quizzes"), {
      quizNumber,
      createdBy: quizmasterId,
      createdAt: serverTimestamp(),
      questions,
      participants: [], // Initially empty
      winners: [], // Initially empty
    });

    console.log("Quiz created with ID:", quizRef.id);
  } catch (err) {
    console.error("Failed to create quiz:", err);
  }
};

export default createQuiz;
