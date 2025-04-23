"use client";

// import { useRouter } from "next/router";
import { useState } from "react";
// import { useAuth } from "@context/AuthContext";

export default function HomePage() {
  //   const router = useRouter();
  //   const { login } = useAuth();
  const [username, setUsername] = useState("");

  //   const handleJoin = () => {
  //     if (username.trim()) {
  //       login({ name: username }); // store user in AuthContext
  //       router.push("/quiz"); // redirect to quiz interface
  //     }
  //   };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-400 px-4">
      <h1 className="text-4xl font-bold mb-4">📖 Bible Trivia Bowl</h1>
      <p className="text-lg mb-6 text-center">Answer quickly and accurately.</p>

      <input
        className="border p-2 rounded mb-4 w-full max-w-sm"
        placeholder="Enter your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button
        // onClick={handleJoin}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Join Quiz
      </button>
    </div>
  );
}
