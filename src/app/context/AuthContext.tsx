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

type UserData = {
  uid: string;
  email: string | null;
  role: string;
};

type AuthContextType = {
  user: UserData | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isNavigating: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  isAdmin: false,
  isNavigating: false,
});

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
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
    setIsNavigating(true);

    const toastId = toast.loading("Signing you in...");

    try {
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

        // Delay navigation slightly to ensure loading screen shows
        setTimeout(() => {
          // Redirect based on role
          if (role === "admin") {
            router.push("/pages/admin");
          } else {
            router.push("/pages/profile");
          }
        }, 100);
      } else {
        toast.error("User data not found.", { id: toastId });
        setError("User data not found");
        setIsNavigating(false);
      }
    } catch (err: unknown) {
      let errorMessage = "SignIn failed.";
      if (err instanceof Error) {
        if (err.message.includes("auth/invalid-credential")) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (err.message.includes("auth/user-not-found")) {
          errorMessage = "No account found with this email.";
        } else if (err.message.includes("auth/wrong-password")) {
          errorMessage = "Incorrect password. Please try again.";
        } else if (err.message.includes("auth/too-many-requests")) {
          errorMessage = "Too many failed attempts. Please try again later.";
        } else {
          errorMessage = err.message;
        }
      }

      toast.error(errorMessage, { id: toastId });
      setError(errorMessage);
      setIsNavigating(false);
      setLoading(false);
    } finally {
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsNavigating(true);
      const toastId = toast.loading("Signing out...");
      await firebaseSignOut(auth);
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      setIsNavigating(false);
      toast.success("Signed out successfully", { id: toastId });
      router.push("/pages/login");
    } catch (err: unknown) {
      let errorMessage = "Logout failed.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
      setError(errorMessage);
      setIsNavigating(false);
    }
  };

  useEffect(() => {
    return () => {
      setIsNavigating(false);
    };
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAdmin,
    isNavigating,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
