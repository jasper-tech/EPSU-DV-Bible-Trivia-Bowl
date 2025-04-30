"use client";

import React from "react";
import CircularProgress from "@mui/material/CircularProgress";

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex flex-col justify-center items-center">
      <CircularProgress size={60} thickness={4} sx={{ color: "#2563EB" }} />
      <p className="mt-4 text-blue-600 font-medium text-lg">{message}</p>
    </div>
  );
};

export default LoadingScreen;
