import {
  ComponentCard,
  HospitalTable,
  PageBreadCrumb,
  PageMeta,
} from "../../components";

export default function HospitalTables() {
  return (
    <>
      <PageMeta
        title="Sigetsop - Table"
        description="This is Tables Dashboard Hospital page"
      />
      <PageBreadCrumb pageTitle="Hospital" />
      <div className="space-y-6">
        <ComponentCard title="Tabla Hospital">
          <HospitalTable />
        </ComponentCard>
      </div>
    </>
  );
}
