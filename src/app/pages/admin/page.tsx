"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import {
  AddCircle,
  People,
  Quiz,
  UploadFileOutlined,
  History,
  EmojiEvents,
} from "@mui/icons-material";
import clsx from "clsx";

const tiles = [
  {
    label: "Add Question",
    href: "/pages/admin/add-question",
    icon: AddCircle,
    color: "text-blue-500 hover:text-blue-700",
  },
  {
    label: "Manage Users",
    href: "/pages/admin/manage-users",
    icon: People,
    color: "text-purple-500 hover:text-purple-700",
  },
  {
    label: "Create Quiz",
    href: "/pages/admin/create-quiz",
    icon: Quiz,
    color: "text-gray-500 hover:text-gray-700",
  },
  {
    label: "Upload Quiz",
    href: "/pages/admin/upload-quiz",
    icon: UploadFileOutlined,
    color: "text-amber-500 hover:text-amber-700",
  },
  {
    label: "Quiz History",
    href: "/pages/admin/quiz-history",
    icon: History,
    color: "text-red-500 hover:text-red-700",
  },
  {
    label: "Quiz Leaderboard",
    href: "/pages/admin/quiz-leaderboard",
    icon: EmojiEvents,
    color: "text-green-500 hover:text-green-600",
  },
];

const AdminPage = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 p-4 md:p-10 justify-items-center">
      {tiles.map((tile) => {
        const IconComponent = tile.icon;

        return (
          <Box
            key={tile.href}
            onClick={() => router.push(tile.href)}
            className={clsx(
              "relative w-full max-w-xs h-40 rounded-xl shadow-md flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105",
              pathname === tile.href
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-800"
            )}
          >
            <Typography variant="h6" className="font-semibold">
              {tile.label}
            </Typography>

            <IconComponent
              onClick={(e) => {
                e.stopPropagation();
                router.push(tile.href);
              }}
              className={clsx(
                "absolute bottom-3 right-3",
                pathname === tile.href ? "text-white" : tile.color
              )}
              fontSize="large"
            />
          </Box>
        );
      })}
    </Box>
  );
};

export default AdminPage;
