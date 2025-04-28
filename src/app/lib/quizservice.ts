import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";

// Save quiz score to Firestore
export const saveQuizScore = async (
  userId: string,
  userDisplayName: string, // Add this parameter
  quizTitle: string,
  score: number,
  totalQuestions: number,
  userAnswers: any[]
) => {
  try {
    const quizResultsRef = collection(db, "quizResults");

    const result = await addDoc(quizResultsRef, {
      userId,
      userDisplayName,
      quizTitle,
      score,
      totalQuestions,
      percentage: (score / totalQuestions) * 100,
      timestamp: new Date(),
      userAnswers,
    });

    return result.id;
  } catch (error) {
    console.error("Error saving quiz score:", error);
    throw error;
  }
};
// Get leaderboard data
export const getQuizLeaderboard = async (
  quizTitle: string,
  limitCount = 10
) => {
  try {
    const leaderboardQuery = query(
      collection(db, "quizResults"),
      where("quizTitle", "==", quizTitle),
      orderBy("score", "desc"),
      orderBy("timestamp", "asc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(leaderboardQuery);
    const leaderboard = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return leaderboard;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    throw error;
  }
};

// Get a specific user's quiz history
export const getUserQuizHistory = async (userId: string) => {
  try {
    const userHistoryQuery = query(
      collection(db, "quizResults"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(userHistoryQuery);
    const history = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return history;
  } catch (error) {
    console.error("Error fetching user history:", error);
    throw error;
  }
};

// Get available quiz titles from quizResults collection
export const getAvailableQuizzes = async () => {
  try {
    const quizResultsRef = collection(db, "quizResults");
    const querySnapshot = await getDocs(quizResultsRef);

    // Extract unique quiz titles
    const quizTitles = new Set<string>();
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.quizTitle) {
        quizTitles.add(data.quizTitle);
      }
    });

    return Array.from(quizTitles);
  } catch (error) {
    console.error("Error fetching available quizzes:", error);
    throw error;
  }
};

// Get user display name by user ID
export const getUserDisplayName = async (userId: string) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.displayName || userData.email || "Anonymous User";
    }

    return "Anonymous User";
  } catch (error) {
    console.error("Error fetching user display name:", error);
    return "Anonymous User";
  }
};
