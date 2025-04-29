"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Define user type with role
type UserData = {
  uid: string;
  email: string | null;
  role: string;
};

// Define the shape of our auth context
type AuthContextType = {
  user: UserData | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  isAdmin: false,
});

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // Handle user authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userWithRole: UserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: userData.role,
            };

            setUser(userWithRole);
            setIsAdmin(userData.role === "admin");
          } else {
            // User exists in Firebase Auth but not in Firestore
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: "user",
            });
            setIsAdmin(false);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Failed to load user data");
        }
      } else {
        // User is signed out
        setUser(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const toastId = toast.loading("Signing you in...");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: role,
        });

        setIsAdmin(role === "admin");

        toast.success("Sign in successful!", { id: toastId });

        // Redirect based on role
        if (role === "admin") {
          router.push("/pages/admin");
        } else {
          router.push("/pages/profile");
        }
      } else {
        toast.error("User data not found.", { id: toastId });
        setError("User data not found");
      }
    } catch (err: unknown) {
      let errorMessage = "SignIn failed.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const toastId = toast.loading("Signing out...");
      await firebaseSignOut(auth);
      setUser(null);
      setIsAdmin(false);
      toast.success("Logged out successfully", { id: toastId });
      router.push("/");
    } catch (err: unknown) {
      let errorMessage = "Logout failed.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
