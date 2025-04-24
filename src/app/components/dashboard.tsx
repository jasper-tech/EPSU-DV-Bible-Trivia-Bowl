"use client";

import { useRouter } from "next/navigation";
import { FaBible, FaTrophy } from "react-icons/fa";

export default function Dashboard() {
  const router = useRouter();

  return (
    <section className="bg-white shadow p-6 rounded-lg w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quiz Tile */}
        <div
          onClick={() => router.push("/pages/quiz")}
          className="cursor-pointer bg-blue-100 hover:bg-blue-200 transition-colors p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center hover:shadow-lg"
        >
          <FaBible className="text-blue-600 text-5xl mb-4" />
          <h3 className="text-xl font-semibold text-blue-700 mb-2">
            Bible Trivia Bowl
          </h3>
          <p className="text-blue-600">
            Test your Bible knowledge and earn rewards!
          </p>
        </div>

        {/* Achievements Tile */}
        <div className="bg-green-100 p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center hover:shadow-lg">
          <FaTrophy className="text-green-600 text-5xl mb-4" />
          <h3 className="text-xl font-semibold text-green-700 mb-2">
            Achievements
          </h3>
          <p className="text-green-600">
            🏆 Nothing yet... Take some quizzes to earn achievements!
          </p>
        </div>
      </div>
    </section>
  );
}
