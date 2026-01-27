import { useState } from "react";
import ComponentCard from "../../common/ComponentCard";
import { useDropzone } from "react-dropzone";

interface DropzoneProps {
  onUploadSuccess?: (data: {
    document_url: string;
    initial_points: Point[];
  }) => void;
}

const DropzoneComponent: React.FC<DropzoneProps> = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);

  const uploadFiles = async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload09/`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("Respuesta del servidor:", data);

      // 🔹 Llamar al callback del parent
      if (onUploadSuccess) {
        onUploadSuccess({
          document_url: data.document_url,
          initial_points: data.initial_points || [], // Asegurarse que sean 4 puntos
        });
      }
    } catch (err) {
      console.error("Error subiendo archivo:", err);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    uploadFiles(acceptedFiles);
    console.log("Files dropped:", acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
      "image/svg+xml": [],
      "application/pdf": [],
    },
  });
  return (
    <ComponentCard title="Zona de Carga">
      <div className="transition border border-gray-300 border-dashed cursor-pointer dark:hover:border-brand-500 dark:border-gray-700 rounded-xl hover:border-brand-500">
        <form
          {...getRootProps()}
          className={`dropzone rounded-xl   border-dashed border-gray-300 p-7 lg:p-10
        ${
          isDragActive
            ? "border-brand-500 bg-gray-100 dark:bg-lime-950"
            : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.1]"
        }
      `}
          id="demo-upload"
        >
          <input {...getInputProps()} />

          <div className="dz-message flex flex-col items-center m-0! dark:bg-amber-100">
            {/* Icon Container */}
            <div className="mb-[22px] flex justify-center">
              <div className="flex h-[68px] w-[68px]  items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-orange-300 dark:text-gray-950">
                <svg
                  className="fill-current"
                  width="29"
                  height="28"
                  viewBox="0 0 29 28"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z"
                  />
                </svg>
              </div>
            </div>

            {/* Mostrar los archivos seleccionados */}
            {files.length > 0 ? (
              <>
                <h4 className="font-semibold mb-2">Archivos seleccionados:</h4>
                <span className="text-gray-700">
                  {files.map((file) => (
                    <li key={file.name}>{file.name}</li>
                  ))}
                </span>
              </>
            ) : (
              <>
                <h4 className="mb-3 font-semibold text-gray-800 text-theme-xl dark:text-gray-dark">
                  {isDragActive
                    ? "Suelta los archivos aquí"
                    : "Arratre & Suelte el Archivo aquí"}
                </h4>
                <span className=" text-center mb-5 block w-full max-w-[290px] text-sm text-gray-700 dark:text-gray-800">
                  {isDragActive
                    ? "Suelta los archivos aquí..."
                    : "Arrastra y suelta tus archivos aquí o haz clic para seleccionarlos"}
                </span>
              </>
            )}

            <span className="font-bold underline text-theme-sm text-brand-600">
              Seleccionar Archivo
            </span>
          </div>
        </form>
      </div>
    </ComponentCard>
  );
};

export default DropzoneComponent;
