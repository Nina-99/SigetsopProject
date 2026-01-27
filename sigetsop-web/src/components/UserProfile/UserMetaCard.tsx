import { useState } from "react";
import { useAuth } from "../../@core";
import { PencilIcon } from "../../icons";
import ProfilePictureModal from "../ui/modal/ProfilePictureModal";

export default function UserMetaCard() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="relative w-20 h-20 border border-gray-200 rounded-full dark:border-gray-800">
              <img
                src={user?.profile_picture || "/images/user/nina.jpeg"}
                alt="user"
                className="w-full h-full object-cover rounded-full"
              />
              <button
                onClick={() => setIsModalOpen(true)}
                className="absolute bottom-[-8px] right-[-8px] p-1.5 bg-blue-500 rounded-full text-white hover:bg-blue-600 shadow-md z-10"
                aria-label="Editar foto de perfil"
              >
                <PencilIcon className="w-3 h-3" />
              </button>
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user?.last_name} {user?.maternal_name} {user?.first_name} (
                {user?.username})
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.role_data?.name}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Oruro, Bolivia
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ProfilePictureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
