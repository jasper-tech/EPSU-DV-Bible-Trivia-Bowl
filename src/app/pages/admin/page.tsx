"use client";

import AdminQuestions from "@/app/components/adminquestions";
import AdminSidebar from "@/app/components/adminsidebar";
import AdminHeader from "@/app/components/adminheader";

const AdminPage = () => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-800 text-white">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Admin Header */}
        <AdminHeader />

        {/* Page Content */}
        <div className="p-6 flex-1">
          <AdminQuestions />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
