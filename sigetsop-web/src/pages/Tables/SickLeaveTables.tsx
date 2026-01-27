import {
  ComponentCard,
  PageBreadCrumb,
  PageMeta,
  SickLeaveTable,
} from "../../components";

export default function SickLeaveTables() {
  return (
    <>
      <PageMeta
        title="Sigetsop - Table"
        description="This is Tables Dashboard Sick Leave page"
      />
      <PageBreadCrumb pageTitle="Bajas Medicas" />
      <div className="space-y-6">
        <ComponentCard title="Tabla Bajas">
          <SickLeaveTable />
        </ComponentCard>
      </div>
    </>
  );
}
