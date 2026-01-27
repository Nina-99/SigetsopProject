import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AVC09, AVC09Service } from "../../../services";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

const columns = [
  { key: "personnel_data.grade_data.grade_abbr", label: "grado" },
  {
    key: "full_personnel_name",
    label: "Nombre",
    getter: (avc09: AVC09) => {
      const personnel = avc09.personnel_data;
      if (!personnel) return "";

      return `${personnel.last_name} ${personnel.maternal_name} ${personnel.first_name} ${personnel.middle_name || ""}`.trim();
    },
  },
  { key: "insured_number", label: "No. Asergurado" },
  { key: "employer_number", label: "No. Empleado" },
  { key: "type_risk", label: "Tipo de Riesgo" },
  { key: "isue_date", label: "Fecha de Emision" },
  { key: "from_date", label: "Desde" },
  { key: "to_date", label: "Hasta" },
  { key: "days_incapacity", label: "Dias de Incapacidad" },
  { key: "state", label: "Estado" },
  { key: "delivery_date", label: "Fecha de Entrega" },
];

export default function AVC09Table() {
  const navigate = useNavigate();
  const [data, setData] = useState<AVC09[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [itemsPerPages, setItemsPerPages] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const orderedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (a.state === "ENTREGAR" && b.state !== "ENTREGAR") return -1;
      if (a.state !== "ENTREGAR" && b.state === "ENTREGAR") return 1;
      return 0;
    });
  }, [data]);

  const filteredData = useMemo(() => {
    const data = orderedData;
    if (!searchTerm) return data;

    const lowerCaseSearch = searchTerm.toLowerCase();
    const hasSpace = lowerCaseSearch.includes(" ");

    const prioritizedData = data
      .map((avc09) => {
        let priority = Infinity;

        const fullName =
          `${avc09.personnel_data?.last_name} ${avc09.personnel_data?.maternal_name} ${avc09.personnel_data?.first_name}`.toLowerCase();

        if (hasSpace) {
          if (fullName.includes(lowerCaseSearch)) {
            priority = 0;
          }
        } else {
          if (
            avc09.personnel_data?.last_name
              .toLowerCase()
              .includes(lowerCaseSearch)
          ) {
            priority = Math.min(priority, 1);
          }
          if (
            avc09.personnel_data?.maternal_name
              .toLowerCase()
              .includes(lowerCaseSearch)
          ) {
            priority = Math.min(priority, 2);
          }
          if (
            avc09.personnel_data?.first_name
              .toLowerCase()
              .includes(lowerCaseSearch)
          ) {
            priority = Math.min(priority, 3);
          }
        }

        if (avc09.insured_number.toLowerCase().includes(lowerCaseSearch)) {
          priority = Math.min(priority, 4);
        }
        return { avc09, priority };
      })
      .filter((item) => item.priority !== Infinity);

    prioritizedData.sort((a, b) => a.priority - b.priority);
    return prioritizedData.map((item) => item.avc09);
  }, [orderedData, searchTerm]);

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
        const response = await AVC09Service.list();
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
    avc09: AVC09,
    col: { key: string; getter?: (avc09: AVC09) => string },
  ) => {
    if (col.getter) {
      return col.getter(avc09);
    }

    const path = col.key;
    const parts = path.split(".");
    let acc: any = avc09;

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
    navigate("/upload09");
  };

  const handleEdit = (avc09: AVC09) => {
    if (avc09.state !== "ENTREGAR") return;
    console.log("llama la funcion");

    Swal.fire({
      title: "¿Confirmar entrega?",
      text: "Una vez entregado no podrás revertirlo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, entregar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const today = new Date().toISOString().split("T")[0];

          console.log("Payload enviado: ", {
            state: "ENTREGADO",
            delivery_date: today,
          });
          console.log("ID:", avc09.id);

          await AVC09Service.update(avc09.id, {
            state: "ENTREGADO",
            delivery_date: today,
          });

          // actualizar estado en la tabla sin recargar
          setData((prev) =>
            prev.map((item) =>
              item.id === avc09.id
                ? { ...item, state: "ENTREGADO", delivery_date: today }
                : item,
            ),
          );

          Swal.fire(
            "Entregado",
            "El documento fue marcado como ENTREGADO",
            "success",
          );
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "No se pudo actualizar", "error");
        }
      }
    });
    //   await AVC09Service.update(avc09.id, {
    //     state: avc09ToEdit?.State,
    //   });
  };

  if (loading)
    return <div className="p-5 dark:text-gray-300">Cargando bajas...</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
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
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
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
                    {currentItems.map((avc09) => (
                      <TableRow
                        key={avc09.id}
                        className="hover:bg-lime-200 dark:hover:bg-lime-700"
                      >
                        {columns.map((col) => {
                          if (col.key === "state") {
                            return (
                              <TableCell
                                key={col.key}
                                className="border border-lime-700 px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap"
                              >
                                <div className="flex items-center w-full gap-2">
                                  <button
                                    disabled={avc09.state === "ENTREGADO"}
                                    onClick={() => handleEdit(avc09)}
                                    className={`px-3 py-1 rounded text-white text-sm font-semibold
                                                ${avc09.state === "ENTREGAR" ? "bg-red-500 hover:bg-red-700" : ""}
                                                ${avc09.state === "ENTREGADO" ? "bg-green-600 cursor-not-allowed" : ""}`}
                                  >
                                    {getValue(avc09, col)}
                                  </button>
                                </div>
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell
                              key={col.key}
                              className="border border-lime-700 px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap"
                            >
                              {getValue(avc09, col)}
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
    </div>
  );
}
