"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import CircularProgress from "@mui/material/CircularProgress";

interface Answer {
  id: string;
  text: string;
}

interface Question {
  text: string;
  explanation: string;
  answers: Answer[];
  correctAnswerId: string;
}

const EditQuestionPage = () => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const docRef = doc(db, "questions", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setQuestion(docSnap.data() as Question);
        } else {
          toast.error("Question not found.");
          router.push("/pages/admin");
        }
      } catch (error) {
        console.error("fetch error:", error);
        toast.error("Error fetching question.");
      }
    };

    if (id) fetchQuestion();
  }, [id, router]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      text: question?.text || "",
      explanation: question?.explanation || "",
      answers: question?.answers.map((a) => a.text) || ["", "", "", ""],
      correctAnswerIndex:
        question?.answers.findIndex((a) => a.id === question.correctAnswerId) ??
        0,
    },
    onSubmit: async (values) => {
      try {
        setSubmitting(true);

        const updatedAnswers = values.answers.map((text, idx) => ({
          id: `a${idx + 1}`,
          text,
        }));

        const updatedQuestion = {
          text: values.text,
          explanation: values.explanation,
          answers: updatedAnswers,
          correctAnswerId: updatedAnswers[values.correctAnswerIndex].id,
        };

        const docRef = doc(db, "questions", id as string);
        await updateDoc(docRef, updatedQuestion);

        toast.success("Question updated successfully.");
        router.push("/pages/admin");
      } catch (error) {
        console.error("Update error:", error);
        toast.error("Error updating question.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (!question) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <CircularProgress color="primary" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-slate-200 p-6 rounded shadow mt-10">
      <h1 className="text-2xl font-semibold mb-6">Edit Question</h1>
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold">Question Text</label>
          <textarea
            name="text"
            value={formik.values.text}
            onChange={formik.handleChange}
            className="w-full p-3 border border-gray-300 rounded"
            rows={3}
          />
        </div>

        <div>
          <label className="block font-semibold">Answers</label>
          {formik.values.answers.map((answer, idx) => (
            <div key={idx} className="flex items-center space-x-2 mt-2">
              <input
                type="radio"
                name="correctAnswerIndex"
                value={idx}
                checked={formik.values.correctAnswerIndex === idx}
                onChange={() => formik.setFieldValue("correctAnswerIndex", idx)}
              />
              <input
                type="text"
                name={`answers[${idx}]`}
                value={answer}
                onChange={formik.handleChange}
                className="flex-1 p-2 border rounded"
                placeholder={`Answer ${idx + 1}`}
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block font-semibold">Explanation</label>
          <textarea
            name="explanation"
            value={formik.values.explanation}
            onChange={formik.handleChange}
            className="w-full p-3 border border-gray-300 rounded"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default EditQuestionPage;
