import {
  ComponentCard,
  PageBreadCrumb,
  PageMeta,
  UnitsTable,
} from "../../components";

export default function UnitsTables() {
  return (
    <div>
      <PageMeta
        title="Sigetsop - Table"
        description="This is Tables Dashboard Units page"
      />
      <PageBreadCrumb pageTitle="Unidad Policial" />
      <div className="space-y-6">
        <ComponentCard title="Tabla Unidades">
          <UnitsTable />
        </ComponentCard>
      </div>
    </div>
  );
}
