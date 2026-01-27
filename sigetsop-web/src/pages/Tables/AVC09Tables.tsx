import {
  AVC09Table,
  ComponentCard,
  PageBreadCrumb,
  PageMeta,
} from "../../components";

export default function AVC09Tables() {
  return (
    <>
      <PageMeta
        title="Sigetsop - Table"
        description="This is Tables Dashboard AVC09 page"
      />
      <PageBreadCrumb pageTitle="AVC09" />
      <div className="space-y-6">
        <ComponentCard title="Tabla Bajas">
          <AVC09Table />
        </ComponentCard>
      </div>
    </>
  );
}
