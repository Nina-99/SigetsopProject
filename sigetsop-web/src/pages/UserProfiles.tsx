import {
  PageBreadCrumb,
  PageMeta,
  UserInfoCard,
  UserMetaCard,
} from "../components";

export default function UserProfiles() {
  return (
    <>
      <PageMeta
        title="Admin Dashboard"
        description="This is Profile Dashboard page for Sigetsop"
      />
      <PageBreadCrumb pageTitle="Perfil" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Perfil
        </h3>
        <div className="space-y-6">
          <UserMetaCard />
          <UserInfoCard />
        </div>
      </div>
    </>
  );
}
