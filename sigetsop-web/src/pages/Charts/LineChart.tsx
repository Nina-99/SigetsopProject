import {
  ComponentCard,
  PageBreadCrumb,
  PageMeta,
  StatisticsChart,
} from "../../components";

export default function LineChart() {
  return (
    <>
      <PageMeta
        title="React.js Chart SIGETSOP Admin Dashboard Template"
        description="This is React.js Chart Dashboard page for SIGETSOP Dashboard Template"
      />
      <PageBreadCrumb pageTitle="Estadistica Lineal" />
      <div className="space-y-6">
        <ComponentCard title="Estadistica Lineal">
          <StatisticsChart />
        </ComponentCard>
      </div>
    </>
  );
}
