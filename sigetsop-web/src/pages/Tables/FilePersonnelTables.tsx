import {
  ComponentCard,
  FilePersonnelTable,
  PageBreadCrumb,
  PageMeta,
} from "../../components";

export default function FilePersonnelTables() {
  return (
    <>
      <PageMeta
        title="Sigetsop - Table"
        description="This is Tables Dashboard File Personnel page"
      />
      <PageBreadCrumb pageTitle="File Personnel" />
      <div className="space-y-6">
        <ComponentCard title="Tabla Archivos (file)">
          <FilePersonnelTable />
        </ComponentCard>
      </div>
    </>
  );
}
