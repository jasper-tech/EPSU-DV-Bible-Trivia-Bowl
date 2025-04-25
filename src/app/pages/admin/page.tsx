"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { AddCircle } from "@mui/icons-material";
import clsx from "clsx";
import { usePathname } from "next/navigation";

const tiles = [
  { label: "Add Question", href: "/pages/admin/add-question" },
  { label: "Manage Users", href: "/pages/admin/manage-users" },
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

          {tile.label === "Add Question" && (
            <AddCircle
              onClick={(e) => {
                e.stopPropagation();
                router.push("/pages/admin/add-question");
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
