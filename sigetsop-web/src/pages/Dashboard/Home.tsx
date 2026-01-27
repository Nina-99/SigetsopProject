import {
  PageMeta,
  PersonnelMetrics,
  RecentSickLeaves,
  StatisticsChart,
  TopUnitsChart,
} from "../../components";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Personnel Dashboard"
        description="This is Personnel Dashboard"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <PersonnelMetrics />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <TopUnitsChart />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentSickLeaves />
        </div>
      </div>
    </>
  );
}
