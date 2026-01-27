import {
  ComponentCard,
  PageBreadCrumb,
  PageMeta,
  ResponsiveImage,
  ThreeColumnImageGrid,
  TwoColumnImageGrid,
} from "../../components";

export default function Images() {
  return (
    <>
      <PageMeta
        title="React.js Images Dashboard | Marco Nina Nuñez Author - React.js Admin Dashboard Template"
        description="This is React.js Images page for Marco Nina Nuñez Author - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadCrumb pageTitle="Images" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Responsive image">
          <ResponsiveImage />
        </ComponentCard>
        <ComponentCard title="Image in 2 Grid">
          <TwoColumnImageGrid />
        </ComponentCard>
        <ComponentCard title="Image in 3 Grid">
          <ThreeColumnImageGrid />
        </ComponentCard>
      </div>
    </>
  );
}
