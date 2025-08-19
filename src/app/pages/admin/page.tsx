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
  Bookmark,
} from "@mui/icons-material";
import GitHubIcon from "@mui/icons-material/GitHub";
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
  {
    label: "Quiz Results",
    href: "/pages/admin/quiz-results",
    icon: Bookmark,
    color: "text-gray-500 hover:text-gray-600",
  },
];

const AdminPage = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex-grow p-4 md:p-6">
        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 justify-items-center">
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
      </div>

      <footer className="bg-white border-t border-gray-200 py-4 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between text-gray-600 text-sm">
            <div className="flex items-center mb-2 md:mb-0">
              <a
                href="https://github.com/Jasper-tech"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:text-blue-600 transition-colors"
                title="Jasper-tech on GitHub"
              >
                <GitHubIcon fontSize="small" />
                <span className="ml-2">Jasper-tech</span>
              </a>
            </div>
            <div className="font-semibold">Bible-Trivia-App</div>
            <div>© {new Date().getFullYear()} All rights reserved</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminPage;
