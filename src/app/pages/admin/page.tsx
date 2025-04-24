"use client";

import AdminQuestions from "@/app/components/adminquestions";
import AdminSidebar from "@/app/components/adminsidebar";

const AdminPage = () => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-800 text-white">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100">
        <AdminQuestions />
      </div>
    </div>
  );
};

export default AdminPage;
