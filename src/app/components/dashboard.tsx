"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"quiz" | "achievements">("quiz");
  const router = useRouter();

  const handleTabClick = (tab: "quiz" | "achievements") => {
    setActiveTab(tab);
    if (tab === "quiz") {
      router.push("/pages/quiz");
    }
  };

  return (
    <section className="bg-white shadow p-6 rounded w-full max-w-3xl mx-auto">
      <div className="flex border-b mb-4">
        <button
          onClick={() => handleTabClick("quiz")}
          className={`px-4 py-2 font-medium ${
            activeTab === "quiz"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600"
          }`}
        >
          Quiz
        </button>
        <button
          onClick={() => handleTabClick("achievements")}
          className={`ml-4 px-4 py-2 font-medium ${
            activeTab === "achievements"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-600"
          }`}
        >
          Achievements
        </button>
      </div>

      {activeTab === "achievements" && (
        <div>
          <h3 className="text-xl font-semibold mb-2">Your Achievements</h3>
          <p className="text-gray-700">
            🏆 Nothing yet... Take some quizzes to earn achievements!
          </p>
        </div>
      )}
    </section>
  );
}
