import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  UnitModal,
} from "../../ui";
import { Units, UnitsService } from "../../../services";
import { useEffect, useMemo, useRef, useState } from "react";

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

const columns = [
  { key: "name", label: "Unidad", bold: true },
  { key: "assistant_data[0].grade_data.grade_abbr", label: "Grado" },
  {
    key: "full_assistant_name",
    label: "Auxiliar de la Unidad",
    getter: (unit: Units) => {
      const assist = unit.assistant_data?.[0];
      if (!assist) return "";

      return `${assist.last_name} ${assist.maternal_name} ${assist.first_name} ${assist.middle_name || ""}`.trim();
    },
  },
  { key: "assistant_data[0].phone", label: "Celular" },
  { key: "commander_data.grade_data.grade_abbr", label: "Grado" },
  {
    key: "full_commander_name",
    label: "Comandante",
    getter: (unit: Units) => {
      const cmdr = unit.commander_data;
      if (!cmdr) return "";

      return `${cmdr.last_name} ${cmdr.maternal_name} ${cmdr.first_name} ${cmdr.middle_name || ""}`.trim();
    },
  },
  { key: "commander_data.phone", label: "Celular" },
  { key: "actions", label: "Acciones" },
];

export default function UnitsTable() {
  const [data, setData] = useState<Units[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [itemsPerPages, setItemsPerPages] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState<Units | null>(null);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    const lowerCaseSearch = searchTerm.toLowerCase();

    const prioritizedData = data
      .map((person) => {
        let priority = Infinity;
        if (person.name?.toLowerCase().includes(lowerCaseSearch)) {
          priority = Math.min(priority, 4);
        }
        return { person, priority };
      })
      .filter((item) => item.priority !== Infinity);

    prioritizedData.sort((a, b) => a.priority - b.priority);
    return prioritizedData.map((item) => item.person);
  }, [data, searchTerm]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPages);

  const indexOfLastItem = currentPage * itemsPerPages;
  const indexOfFirstItem = indexOfLastItem - itemsPerPages;

  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newItemsPerPage = Number(event.target.value);
    setItemsPerPages(newItemsPerPage);
    setCurrentPage(1);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await UnitsService.list();
        setData(response.data.results);
      } catch (error) {
        console.error("Error fetching personnel:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getValue = (
    unit: Units,
    col: { key: string; getter?: (unit: Units) => string },
  ) => {
    if (col.getter) {
      return col.getter(unit);
    }

    const path = col.key;
    const parts = path.split(".");
    let acc: any = unit;

    for (const part of parts) {
      if (acc === null || acc === undefined) {
        return "";
      }

      // Manejar índice de array (ej: 'assistant_data[0]')
      const arrayMatch = part.match(/(.*)\[(\d+)\]$/);

      if (arrayMatch) {
        const key = arrayMatch[1];
        const index = parseInt(arrayMatch[2]);

        if (Array.isArray(acc[key]) && acc[key].length > index) {
          acc = acc[key][index];
        } else {
          return "";
        }
      } else {
        acc = acc[part];
      }
    }

    return acc ?? "";
  };

  const pageRange = useMemo(() => {
    const range = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      // Caso 1: Pocas páginas, mostrar todas.
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      // Siempre mostrar la página 1
      range.push(1);

      // Puntos suspensivos al inicio
      if (startPage > 2) {
        range.push("...");
      }

      // Mostrar el rango central (actual y vecinas)
      for (let i = startPage; i <= endPage; i++) {
        // Asegurarse de que el rango central no se superponga con la página 1 o la última
        if (i > 1 && i < totalPages) {
          range.push(i);
        }
      }

      // Puntos suspensivos al final
      if (endPage < totalPages - 1) {
        range.push("...");
      }

      // Siempre mostrar la última página (si no es la 1)
      if (totalPages > 1) {
        range.push(totalPages);
      }
    }

    return Array.from(new Set(range));
  }, [totalPages, currentPage]);

  const handleCreate = () => {
    setUnitToEdit(null);
    setIsModalOpen(true);
  };
  const handleEdit = (unit: Units) => {
    setUnitToEdit(unit);
    setIsModalOpen(true);
  };

  const handleDelete = async (unitId: number) => {
    if (
      window.confirm(
        `¿Estás seguro de que deseas eliminar la unidad con ID: ${unitId}?`,
      )
    ) {
      try {
        await UnitsService.delete(unitId);
        setData(data.filter((unit) => unit.id !== unitId));
        alert("Unidad eliminada con éxito.");
      } catch (error) {
        console.error("Error eliminando unidad:", error);
        alert("Error al eliminar la unidad.");
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setUnitToEdit(null); // Limpiar la unidad al cerrar
  };

  const handleSaveUnit = (savedUnit: Units) => {
    // Actualizar el estado 'data' de la tabla después de guardar/editar
    if (unitToEdit) {
      // Edición
      setData(data.map((u) => (u.id === savedUnit.id ? savedUnit : u)));
    } else {
      // Creación
      setData([savedUnit, ...data]); // Añadir al inicio para que se vea
    }
    // No cerramos el modal aquí, eso lo hace el UnitModal
  };

  if (loading)
    return <div className="p-5 dark:text-gray-300">Cargando unidad...</div>;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="lg:block">
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
            <div className="overflow-hidden  rounded-xl  bg-white  dark:bg-white/[0.03]">
              <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 dark:text-gray-400">
                    Mostrar
                  </span>
                  <div className="relative z-20 bg-transparent">
                    <select
                      className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
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
                    {" "}
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
                          xmlns="http://www.w3.org/2000/svg"
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
                        placeholder="Buscar Apellidos, Nombre, CI o Unidad     (ctrl k)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[360px]"
                      />
                    </form>
                  </div>
                  <Button
                    className="inline-flex items-center justify-center gap-2 rounded-lg transition  px-4 py-3  ring-1 ring-inset ring-gray-300 hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300 "
                    onClick={handleCreate}
                  >
                    + Nuevo
                  </Button>
                </div>
              </div>
              <div className="max-w-full overflow-x-auto custom-scrollbar">
                <Table>
                  {/* Table Header */}
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableCell
                          key={`${col.key}-${col.key}`}
                          isHeader
                          className=" px-5 py-3 font-medium text-white dark:text-white text-center border border-b-5 border-gray-100 dark:border-white/[0.4] bg-lime-800"
                        >
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>

                  {/* Table Body */}
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {currentItems.map((unit) => (
                      <TableRow
                        key={unit.id}
                        className="hover:bg-lime-200 dark:hover:bg-lime-700"
                      >
                        {columns.map((col) => {
                          if (col.key === "actions") {
                            // Celda para las acciones (Editar y Eliminar)
                            return (
                              <TableCell
                                key={col.key}
                                className="px-1 py-3 text-gray-500 text-theme-sm dark:text-gray-400 border border-lime-700"
                              >
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEdit(unit)}
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
                                  <button
                                    onClick={() => handleDelete(unit.id)}
                                    title="Eliminar"
                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
                                        d="M6.54142 3.7915C6.54142 2.54886 7.54878 1.5415 8.79142 1.5415H11.2081C12.4507 1.5415 13.4581 2.54886 13.4581 3.7915V4.0415H15.6252H16.666C17.0802 4.0415 17.416 4.37729 17.416 4.7915C17.416 5.20572 17.0802 5.5415 16.666 5.5415H16.3752V8.24638V13.2464V16.2082C16.3752 17.4508 15.3678 18.4582 14.1252 18.4582H5.87516C4.63252 18.4582 3.62516 17.4508 3.62516 16.2082V13.2464V8.24638V5.5415H3.3335C2.91928 5.5415 2.5835 5.20572 2.5835 4.7915C2.5835 4.37729 2.91928 4.0415 3.3335 4.0415H4.37516H6.54142V3.7915ZM14.8752 13.2464V8.24638V5.5415H13.4581H12.7081H7.29142H6.54142H5.12516V8.24638V13.2464V16.2082C5.12516 16.6224 5.46095 16.9582 5.87516 16.9582H14.1252C14.5394 16.9582 14.8752 16.6224 14.8752 16.2082V13.2464ZM8.04142 4.0415H11.9581V3.7915C11.9581 3.37729 11.6223 3.0415 11.2081 3.0415H8.79142C8.37721 3.0415 8.04142 3.37729 8.04142 3.7915V4.0415ZM8.3335 7.99984C8.74771 7.99984 9.0835 8.33562 9.0835 8.74984V13.7498C9.0835 14.1641 8.74771 14.4998 8.3335 14.4998C7.91928 14.4998 7.5835 14.1641 7.5835 13.7498V8.74984C7.5835 8.33562 7.91928 7.99984 8.3335 7.99984ZM12.4168 8.74984C12.4168 8.33562 12.081 7.99984 11.6668 7.99984C11.2526 7.99984 10.9168 8.33562 10.9168 8.74984V13.7498C10.9168 14.1641 11.2526 14.4998 11.6668 14.4998C12.081 14.4998 12.4168 14.1641 12.4168 13.7498V8.74984Z"
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
                              className={`border border-lime-700 px-1 py-3 text-gray-800 text-theme-sm dark:text-gray-400 ${col.bold ? "font-bold text-black dark:text-white" : "text-gray-500"}`}
                            >
                              {getValue(unit, col)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
                      className={`inline-flex items-center justify-center gap-2 rounded-lg transition  px-4 py-3 text-sm bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300 ${currentPage === 1 ? "cursor-not-allowed opacity-50" : "hover:bg-gray-100"}`}
                    >
                      Anterior
                    </button>
                    <div className="flex items-center gap-2">
                      {pageRange.map((item, index) => {
                        if (item === "...") {
                          // Renderizar puntos suspensivos
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
                      className={`inline-flex items-center justify-center gap-2 rounded-lg transition  px-4 py-3 text-sm bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300 ${currentPage === totalPages ? "cursor-not-allowed opacity-50" : "hover:bg-gray-100"} `}
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
      {isModalOpen && (
        <UnitModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          unitToEdit={unitToEdit}
          onSave={handleSaveUnit}
        />
      )}
    </div>
  );
}
