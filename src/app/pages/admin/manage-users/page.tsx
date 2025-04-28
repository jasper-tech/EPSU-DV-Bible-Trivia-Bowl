import { FetchUsers } from "@/app/Data/userdata";

const UsersPage = () => {
  return (
    <div className="p-8">
      <FetchUsers />
    </div>
  );
};

export default UsersPage;
