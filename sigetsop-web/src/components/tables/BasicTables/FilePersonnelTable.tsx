import {
  FileModal,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui";
import { FilePersonnel, FilePersonnelService } from "../../../services";
import { useEffect, useMemo, useRef, useState } from "react";

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

type Column<T> = {
  key: string;
  label: string;
  bold?: boolean;
  getter?: (row: T) => string;
};

const columns: Column<FilePersonnel>[] = [
  { key: "personnel_data.identity_card", label: "C.I.", bold: true },
  { key: "personnel_data.grade_data.grade_abbr", label: "Grado" },
  { key: "personnel_data.last_name", label: "Apellido Paterno", bold: true },
  { key: "personnel_data.maternal_name", label: "Apellido Materno" },
  { key: "personnel_data.first_name", label: "Nombre" },
  { key: "personnel_data.middle_name", label: "Segundo Nombre" },
  { key: "personnel_data.insured_number", label: "Número Asegurado" },
  { key: "personnel_data.units_data.name", label: "Destino" },
  { key: "documents_has", label: "Documentos que tiene" },
  { key: "observation", label: "Observacion" },
  { key: "actions", label: "Acciones" },
];

type FilePersonnelListParams = {
  limit: number;
  offset: number;
  search?: string;
};

export default function FilePersonnelTable() {
  const [currentData, setCurrentData] = useState<FilePersonnel[]>([]);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [itemsPerPages, setItemsPerPages] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentOffset, setCurrentOffset] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileToEdit, setFileToEdit] = useState<FilePersonnel | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const fetchData = async (
    limit: number | "all",
    offset: number,
    search: string,
  ) => {
    setLoading(true);
    try {
      const limitParam = limit === "all" ? 10000 : limit;
      const offsetParam = limit === "all" ? 0 : offset;

      const params: FilePersonnelListParams = {
        limit: limitParam,
        offset: offsetParam,
        search: search,
      };

      const response = await FilePersonnelService.list(params);
      setCurrentData(response.data.results);
      setTotalItemsCount(response.data.count);
    } catch (error) {
      console.error("Error fetching personnel:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 debounce de 2000ms para la búsqueda
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData(itemsPerPages, currentOffset, searchTerm);
    }, 2000);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, itemsPerPages, currentOffset]);

  const totalPages = useMemo(
    () => Math.ceil(totalItemsCount / itemsPerPages),
    [totalItemsCount, itemsPerPages],
  );

  const paginate = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;

    setCurrentPage(pageNumber);
    setCurrentOffset((pageNumber - 1) * itemsPerPages);
  };

  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newItemsPerPage = Number(event.target.value);
    setItemsPerPages(newItemsPerPage);
    setCurrentOffset(0);
  };

  // --- Función auxiliar para obtener valor anidado ---
  const getValue = (
    file: FilePersonnel,
    col: { key: string; getter?: (file: FilePersonnel) => string },
  ) => {
    if (col.getter) return col.getter(file);
    const path = col.key;
    const parts = path.split(".");
    let acc: unknown = file;

    for (const part of parts) {
      if (acc === null || acc === undefined) return "";

      if (typeof acc !== "object") return "";

      const record = acc as Record<string, unknown>;

      const arrayMatch = part.match(/(.*)\[(\d+)\]$/);
      if (arrayMatch) {
        const key = arrayMatch[1];
        const index = parseInt(arrayMatch[2]);

        const value = record[key];
        if (Array.isArray(value) && value.length > index) {
          acc = value[index];
        } else {
          return "";
        }
      } else {
        acc = record[part];
      }
    }
    return acc ?? "";
  };

  const pageRange = useMemo(() => {
    const range: (number | "...")[] = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      range.push(1);
      if (startPage > 2) range.push("...");
      for (let i = startPage; i <= endPage; i++)
        if (i > 1 && i < totalPages) range.push(i);
      if (endPage < totalPages - 1) range.push("...");
      if (totalPages > 1) range.push(totalPages);
    }

    return Array.from(new Set(range));
  }, [totalPages, currentPage]);

  // --- Modales ---
  const handleEdit = (file: FilePersonnel) => {
    setFileToEdit(file);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setFileToEdit(null);
  };

  const handleSaveFile = (savedFile: FilePersonnel) => {
    if (fileToEdit)
      setCurrentData(
        currentData.map((u) => (u.id === savedFile.id ? savedFile : u)),
      );
    else setCurrentData([savedFile, ...currentData]);
  };

  // --- Atajo de teclado ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading)
    return (
      <div className="p-5 dark:text-gray-300">
        Cargando archivos de personal...
      </div>
    );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="lg:block">
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
            <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
              <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 dark:text-gray-400">
                    Mostrar
                  </span>
                  <div className="relative z-20 bg-transparent">
                    <select
                      className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      id="sel"
                      value={itemsPerPages}
                      onChange={handleItemsPerPageChange}
                    >
                      {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                        <option
                          key={option}
                          value={option}
                          className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                    <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
                      <svg
                        className="stroke-current"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          stroke="currentColor"
                        ></path>
                      </svg>
                    </span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400">
                    filas
                  </span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative">
                    <form>
                      <span className="absolute text-gray-500 -translate-y-1/2 left-4 top-1/2 dark:text-gray-400">
                        <svg
                          className="fill-current dark:fill-gray-400"
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                            fill=""
                          />
                        </svg>
                      </span>
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Buscar Apellidos, Nombre, CI o Unidad (ctrl k)"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          // setItemsPerPages(newItemsPerPage);
                          setCurrentPage(1);
                          setCurrentOffset(0);
                        }}
                        className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[360px]"
                      />
                    </form>
                  </div>
                </div>
              </div>

              {/* Tabla */}
              <div className="max-w-full overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableCell
                          key={col.key}
                          isHeader
                          className=" px-5 py-3 font-medium text-white dark:text-white text-center border border-b-5 border-gray-100 dark:border-white/[0.4] bg-lime-800"
                        >
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {currentData.map((file) => {
                      const documentsHasValue = getValue(
                        file,
                        columns.find((c) => c.key === "documents_has")!,
                      );
                      const observationValue = getValue(
                        file,
                        columns.find((c) => c.key === "observation")!,
                      );

                      const hasDocuments =
                        typeof documentsHasValue === "string" &&
                        documentsHasValue.trim() !== "";
                      const hasObservation =
                        typeof observationValue === "string" &&
                        observationValue.trim() !== "";

                      let rowClass =
                        "hover:bg-gray-50 dark:hover:bg-white/[0.03]";
                      if (hasObservation)
                        rowClass =
                          "bg-red-200 dark:bg-red-800 hover:bg-red-300 dark:hover:bg-red-900";
                      else if (!hasDocuments && !hasObservation)
                        rowClass =
                          "bg-yellow-200 dark:bg-yellow-800 hover:bg-yellow-300 dark:hover:bg-yellow-900";
                      else if (hasDocuments && !hasObservation)
                        rowClass =
                          "bg-green-200 dark:bg-green-800 hover:bg-green-300 dark:hover:bg-green-900";

                      return (
                        <TableRow key={file.id} className={rowClass}>
                          {columns.map((col) => {
                            const cellValue = getValue(file, col);
                            if (col.key === "actions") {
                              return (
                                <TableCell
                                  key={col.key}
                                  className="px-1 py-3 text-gray-500 text-theme-sm dark:text-gray-400 border border-lime-700"
                                >
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEdit(file)}
                                      title="Editar"
                                      className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
                                    >
                                      <svg
                                        className="size-5"
                                        width="1em"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          clipRule="evenodd"
                                          d="M17.0911 3.53206C16.2124 2.65338 14.7878 2.65338 13.9091 3.53206L5.6074 11.8337C5.29899 12.1421 5.08687 12.5335 4.99684 12.9603L4.26177 16.445C4.20943 16.6931 4.286 16.9508 4.46529 17.1301C4.64458 17.3094 4.90232 17.3859 5.15042 17.3336L8.63507 16.5985C9.06184 16.5085 9.45324 16.2964 9.76165 15.988L18.0633 7.68631C18.942 6.80763 18.942 5.38301 18.0633 4.50433L17.0911 3.53206ZM14.9697 4.59272C15.2626 4.29982 15.7375 4.29982 16.0304 4.59272L17.0027 5.56499C17.2956 5.85788 17.2956 6.33276 17.0027 6.62565L16.1043 7.52402L14.0714 5.49109L14.9697 4.59272ZM13.0107 6.55175L6.66806 12.8944C6.56526 12.9972 6.49455 13.1277 6.46454 13.2699L5.96704 15.6283L8.32547 15.1308C8.46772 15.1008 8.59819 15.0301 8.70099 14.9273L15.0436 8.58468L13.0107 6.55175Z"
                                          fill="currentColor"
                                        ></path>
                                      </svg>
                                    </button>
                                  </div>
                                </TableCell>
                              );
                            }
                            return (
                              <TableCell
                                key={col.key}
                                className={`border border-lime-700 px-1 py-3 text-theme-sm ${
                                  col.bold
                                    ? "font-bold text-gray-900 dark:text-white"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {cellValue}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              <div className="border border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                  <div className="pb-3 xl:pb-0">
                    <span className="dark:text-gray-200">
                      Página {currentPage} de {totalPages}
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`inline-flex items-center justify-center gap-2 rounded-l-lg transition px-4 py-3 text-sm bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300 ${currentPage === 1 ? "cursor-not-allowed opacity-50" : "hover:bg-gray-100"}`}
                    >
                      Anterior
                    </button>
                    <div className="flex items-center gap-2">
                      {pageRange.map((item, index) => {
                        if (item === "...") {
                          return (
                            <span
                              key={index}
                              className="w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400"
                            >
                              ...
                            </span>
                          );
                        }

                        const page = Number(item);
                        return (
                          <button
                            key={index}
                            onClick={() => paginate(page)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium flex items-center justify-center transition ${
                              page === currentPage
                                ? "bg-brand-500 text-white shadow-md shadow-brand-500/50"
                                : "text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-300"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`inline-flex items-center justify-center gap-2 rounded-r-lg transition px-4 py-3 text-sm bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300 ${currentPage === totalPages ? "cursor-not-allowed opacity-50" : "hover:bg-gray-100"} `}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FileModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        fileToEdit={fileToEdit}
        onSave={handleSaveFile}
      />
    </div>
  );
}
