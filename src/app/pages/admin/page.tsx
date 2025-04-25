"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import { AddCircle, People, Quiz } from "@mui/icons-material";
import clsx from "clsx";

const tiles = [
  { label: "Add Question", href: "/pages/admin/add-question" },
  { label: "Manage Users", href: "/pages/admin/manage-users" },
  { label: "Create Quiz", href: "/pages/admin/create-quiz" },
];

const AdminPage = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Box className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-10 justify-items-center">
      {tiles.map((tile) => (
        <Box
          key={tile.href}
          onClick={() => router.push(tile.href)}
          className={clsx(
            "relative w-64 h-40 rounded-xl shadow-md flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105",
            pathname === tile.href
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-800"
          )}
        >
          <Typography variant="h6" className="font-semibold">
            {tile.label}
          </Typography>

          {/* Icon Mapping */}
          {tile.label === "Add Question" && (
            <AddCircle
              onClick={(e) => {
                e.stopPropagation();
                router.push(tile.href);
              }}
              className="absolute bottom-3 right-3 text-blue-500 hover:text-blue-700"
              fontSize="large"
            />
          )}

          {tile.label === "Manage Users" && (
            <People
              onClick={(e) => {
                e.stopPropagation();
                router.push(tile.href);
              }}
              className="absolute bottom-3 right-3 text-blue-500 hover:text-blue-700"
              fontSize="large"
            />
          )}

          {tile.label === "Create Quiz" && (
            <Quiz
              onClick={(e) => {
                e.stopPropagation();
                router.push(tile.href);
              }}
              className="absolute bottom-3 right-3 text-blue-500 hover:text-blue-700"
              fontSize="large"
            />
          )}
        </Box>
      ))}
    </Box>
  );
};

export default AdminPage;
