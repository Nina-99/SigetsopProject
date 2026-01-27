import {

  ComponentCard,
  PageBreadCrumb,
  PageMeta,
  TopUnitsChart,
} from "../../components";

export default function BarChart() {
  return (
    <div>
      <PageMeta
        title="React.js Chart SIGETSOP Admin Dashboard Template"
        description="This is React.js Chart Dashboard page for SIGETSOP Dashboard Template"
      />
      <PageBreadCrumb pageTitle="Estadistica por unidades" />
      <div className="space-y-6">
        <ComponentCard title="Estadistica por unidades">
          <TopUnitsChart />
        </ComponentCard>
      </div>
    </div>
  );
}
