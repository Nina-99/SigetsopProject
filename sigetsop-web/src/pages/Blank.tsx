import { PageBreadCrumb, PageMeta } from "../components";

export default function Blank() {
  return (
    <div>
      <PageMeta
        title="Sigetsop"
        description="This is Blank Dashboard page for sigetsop"
      />
      <PageBreadCrumb pageTitle="Que es?" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[630px] text-center">
          <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            QUE ES SIGETSOP?
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Es una pagina para la administracion de bajas medicas, control de
            file (archivos), para ver si cuenta con uno o no, permite a los
            Auxiliares de cada unidad hacer control de bajas que tengan su
            personal.
          </p>
        </div>
      </div>
    </div>
  );
}
