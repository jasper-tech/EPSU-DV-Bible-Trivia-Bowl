"use client";

import { useState } from "react";
import { useFormik, FormikProvider, FieldArray } from "formik";
import * as Yup from "yup";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import toast from "react-hot-toast";

export default function AdminQuestions() {
  const [submitting, setSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      questionText: "",
      answers: [""],
      correctAnswerIndex: 0,
      explanation: "",
    },
    validationSchema: Yup.object({
      questionText: Yup.string().required("Question is required"),
      answers: Yup.array()
        .of(Yup.string().required("Answer cannot be empty"))
        .min(1, "At least one answer is required"),
      correctAnswerIndex: Yup.number()
        .min(0, "Invalid index")
        .required("Select the correct answer"),
      explanation: Yup.string(),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        setSubmitting(true);

        const formattedAnswers = values.answers.map((text, idx) => ({
          id: `a${idx + 1}`,
          text,
        }));

        const questionData = {
          text: values.questionText,
          answers: formattedAnswers,
          correctAnswerId: formattedAnswers[values.correctAnswerIndex]?.id,
          explanation: values.explanation,
        };

        await addDoc(collection(db, "questions"), questionData);

        toast.success("Question submitted successfully!");
        resetForm();
      } catch (error) {
        console.error(error);
        toast.error("Failed to submit question.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-purple-700">
          🧠 Quizmaster Panel – Bible Trivia Bowl
        </h1>

        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {/* Question Text */}
            <div>
              <label className="font-medium text-gray-700">Question</label>
              <textarea
                name="questionText"
                rows={3}
                className="mt-1 w-full p-2 border rounded"
                value={formik.values.questionText}
                onChange={formik.handleChange}
              />
              {formik.touched.questionText && formik.errors.questionText && (
                <p className="text-red-500 text-sm">
                  {formik.errors.questionText}
                </p>
              )}
            </div>

            {/* Dynamic Answers */}
            <FieldArray
              name="answers"
              render={(arrayHelpers) => (
                <div>
                  <label className="font-medium text-gray-700">Answers</label>
                  {formik.values.answers.map((answer, idx) => (
                    <div key={idx} className="flex items-center space-x-2 mt-2">
                      <input
                        type="radio"
                        name="correctAnswerIndex"
                        value={idx}
                        checked={formik.values.correctAnswerIndex === idx}
                        onChange={() =>
                          formik.setFieldValue("correctAnswerIndex", idx)
                        }
                      />
                      <input
                        type="text"
                        name={`answers.${idx}`}
                        value={answer}
                        onChange={formik.handleChange}
                        className="flex-1 p-2 border rounded"
                        placeholder={`Answer ${idx + 1}`}
                      />
                      {formik.values.answers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            arrayHelpers.remove(idx);
                            if (formik.values.correctAnswerIndex === idx) {
                              formik.setFieldValue("correctAnswerIndex", 0);
                            } else if (formik.values.correctAnswerIndex > idx) {
                              formik.setFieldValue(
                                "correctAnswerIndex",
                                formik.values.correctAnswerIndex - 1
                              );
                            }
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => arrayHelpers.push("")}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    + Add Another Answer
                  </button>
                  {typeof formik.errors.answers === "string" && (
                    <p className="text-red-500 text-sm">
                      {formik.errors.answers}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Explanation */}
            <div>
              <label className="font-medium text-gray-700">Explanation</label>
              <textarea
                name="explanation"
                rows={2}
                className="mt-1 w-full p-2 border rounded"
                value={formik.values.explanation}
                onChange={formik.handleChange}
              />
              {formik.touched.explanation && formik.errors.explanation && (
                <p className="text-red-500 text-sm">
                  {formik.errors.explanation}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={submitting}
                className="bg-purple-700 text-white px-6 py-2 rounded hover:bg-purple-800 transition"
              >
                {submitting ? "Submitting..." : "Submit Question"}
              </button>
            </div>
          </form>
        </FormikProvider>
      </div>
    </div>
  );
}
