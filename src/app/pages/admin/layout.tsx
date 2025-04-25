"use client";

import AdminHeader from "@/app/components/adminheader";
import { Box } from "@mui/material";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box className="flex flex-col min-h-screen bg-gray-100">
      {/* Admin Header */}
      <AdminHeader />

      {/* Dynamic Content Area */}
      <Box className="flex-1 p-6">{children}</Box>
    </Box>
  );
};

export default AdminLayout;
