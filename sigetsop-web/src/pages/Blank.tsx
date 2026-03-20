import {
  PageBreadCrumb,
  PageMeta,
  AspectRatioVideo,
  ComponentCard,
} from "../components";

export default function Blank() {
  const videos = [
    {
      title: "Auxiliar SIT",
      url: "https://drive.google.com/file/d/1D_hlD7-2fGGof2OZryLhvW7PWobv9AFB/preview",
    },
    {
      title: "Auxiliar Familiar",
      url: "https://drive.google.com/file/d/1MA32VIXzI4B435grjXNSQncCozlJcO6_/preview",
    },
    {
      title: "Auxiliar Archivos",
      url: "https://drive.google.com/file/d/1hLwao6axssp2yjzCZZ9nXH7oZH3GI6YB/preview",
    },
    {
      title: "Auxiliar de Unidades",
      url: "https://drive.google.com/file/d/1i4XLfotKb8wjB304kDPk4qJNOoNafw6A/preview",
    },
  ];

  return (
    <div>
      <PageMeta
        title="Sigetsop - Capacitación"
        description="Videos de capacitación para el personal"
      />
      <PageBreadCrumb pageTitle="Centro de Capacitación" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[1200px]">
          <h3 className="mb-8 text-center font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl uppercase">
            Guías de Usuario Sigetsop
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {videos.map((video, index) => (
              <div key={index}>
                <ComponentCard title={video.title}>
                  <AspectRatioVideo
                    videoUrl={video.url}
                    aspectRatio="video"
                    title={`Video Tutorial ${video.title}`}
                  />
                </ComponentCard>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              Seleccione el video correspondiente a su área para visualizar el
              manual interactivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
