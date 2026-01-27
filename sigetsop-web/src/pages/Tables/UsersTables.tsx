import {
  ComponentCard,
  PageBreadCrumb,
  PageMeta,
  UsersTable,
} from "../../components";

export default function UsersTables() {
  return (
    <>
      <PageMeta
        title="Sigetsop - Table"
        description="This is Tables Dashboard Users page"
      />
      <PageBreadCrumb pageTitle="Personal del Sistema" />
      <div className="space-y-6">
        <ComponentCard title="Tabla Usuarios">
          <UsersTable />
        </ComponentCard>
      </div>
    </>
  );
}
