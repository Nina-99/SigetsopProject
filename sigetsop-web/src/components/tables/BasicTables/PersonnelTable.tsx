import {
  Button,
  PersonnelModal,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui";
import { Personnel, PersonnelService } from "../../../services";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import React from "react";
import Swal from "sweetalert2";
import { DownloadIcon } from "../../../icons";

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

type Column<T> = {
  key: string;
  label: string;
  bold?: boolean;
  getter?: (row: T) => string;
};

const columns = [
  { key: "grade_data.grade_abbr", label: "Grado", bold: true },
  { key: "last_name", label: "Apellido Paterno" },
  { key: "maternal_name", label: "Apellido Materno" },
  { key: "first_name", label: "Nombre" },
  { key: "middle_name", label: "Segundo Nombre" },
  { key: "identity_card", label: "C.I." },
  { key: "age", label: "Edad" },
  { key: "birthdate", label: "Fecha de Nacimiento" },
  { key: "genre", label: "Género" },
  { key: "phone", label: "Celular" },
  { key: "years_age", label: "Antigüedad" },
  { key: "joining_police", label: "Fecha Ingreso" },
  { key: "scale", label: "Escalafón" },
  { key: "insured_number", label: "Número Asegurado" },
  { key: "units_data.name", label: "Destino" },
  { key: "address", label: "Dirección" },
  { key: "door_number", label: "Número Puerta" },
  { key: "area", label: "Zona" },
  { key: "reference", label: "Referencia" },
  { key: "reference_phone", label: "Celular de Referencia" },
  { key: "actions", label: "Acciones" },
];

type PersonnelListParams = {
  limit: number;
  offset: number;
  search?: string;
  filter_status?: string;
};

const FILTERS = [
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Eliminados" },
];

const getValue = (
  personnel: Personnel,
  col: { key: string; getter?: (personnel: Personnel) => string },
) => {
  if (col.getter) return col.getter(personnel);
  const path = col.key;
  const parts = path.split(".");
  let acc: unknown = personnel;

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

export default function PersonnelTable() {
  const [currentData, setCurrentData] = useState<Personnel[]>([]);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"active" | "inactive">(
    "active",
  );

  const [itemsPerPages, setItemsPerPages] = useState<number | "all">(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personnelToEdit, setPersonnelToEdit] = useState<Personnel | null>(
    null,
  );

  const itemsPerPageActual = useMemo(() => {
    return itemsPerPages === "all"
      ? totalItemsCount
      : (itemsPerPages as number);
  }, [itemsPerPages, totalItemsCount]);

  const currentOffset = useMemo(() => {
    if (itemsPerPages === "all") return 0;
    return (currentPage - 1) * (itemsPerPages as number);
  }, [currentPage, itemsPerPages]);

  const totalPages = useMemo(() => {
    if (itemsPerPages === "all") return 1;
    return Math.ceil(totalItemsCount / itemsPerPageActual);
  }, [totalItemsCount, itemsPerPageActual, itemsPerPages]);

  const fetchData = useCallback(async (
    limit: number | "all",
    offset: number,
    status: "active" | "inactive",
    search: string,
  ) => {
    setLoading(true);
    try {
      const limitParam = limit === "all" ? 10000 : limit;
      const offsetParam = limit === "all" ? 0 : offset;

      const params: PersonnelListParams = {
        limit: limitParam,
        offset: offsetParam,
        search: search.trim() || undefined,
        filter_status: status === "active" ? "True" : "False",
      };

      const response = await PersonnelService.list(params);
      setCurrentData(response.data.results);
      setTotalItemsCount(response.data.count);
    } catch (error) {
      console.error("Error fetching personnel:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 debounce de 2000ms para la búsqueda
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData(itemsPerPages, currentOffset, filterStatus, searchTerm);
    }, 2000);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, itemsPerPages, currentOffset, filterStatus]);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    } else if (pageNumber > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  };

  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value;
    const newItemsPerPage = value === "all" ? "all" : Number(value);
    setItemsPerPages(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleFilterStatusChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setFilterStatus(event.target.value as "active" | "inactive");
    setCurrentPage(1);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  const pageRange = useMemo(() => {
    const range = [];
    const maxVisiblePages = 7;
    if (totalPages <= 1) return [];
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

  const handleCreate = () => {
    setPersonnelToEdit(null);
    setIsModalOpen(true);
  };

  const handleExportCSV = async () => {
    try {
      Swal.fire({
        title: "Exportando CSV...",
        text: "Por favor espere mientras se genera el archivo.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      const response = await PersonnelService.exportCSV({ filter_status: filterStatus });
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `personal_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "El archivo CSV ha sido descargado correctamente.",
        timer: 3000,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo exportar el archivo CSV. Inténtelo de nuevo.",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      Swal.fire({
        title: "Exportando PDF...",
        text: "Por favor espere mientras se genera el archivo.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      const response = await PersonnelService.exportPDF({ filter_status: filterStatus });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `personal_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "El archivo PDF ha sido descargado correctamente.",
        timer: 3000,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo exportar el archivo PDF. Inténtelo de nuevo.",
      });
    }
  };

  const handleEdit = (personnel: Personnel) => {
    if (personnel.is_active === false) {
      window.alert(
        "No se puede editar un registro eliminado. Por favor, restáurelo primero.",
      );
      return;
    }
    setPersonnelToEdit(personnel);
    setIsModalOpen(true);
  };

  const toggleActiveStatus = async (
    personnel: Personnel,
    newState: boolean,
  ) => {
    const action = newState ? "restaurar" : "eliminar";
    if (
      !window.confirm(
        `¿Estás seguro de que deseas ${action} a ${personnel.first_name} ${personnel.last_name}?`,
      )
    )
      return;
    try {
      await PersonnelService.update(personnel.id, {
        ...personnel,
        is_active: newState,
      });
      fetchData(itemsPerPages, currentOffset, filterStatus, searchTerm);
      console.log(`Personal ${action} correctamente.`);
    } catch (error) {
      console.error(`Error al ${action} personal:`, error);
      window.alert(`Hubo un error al ${action} el registro.`);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setPersonnelToEdit(null);
  };

  const handleSave = (savedPersonnel: Personnel) => {
    fetchData(itemsPerPages, currentOffset, filterStatus, searchTerm);
  };

  const itemsDisplayedCount = currentData.length;
  const startItem = itemsDisplayedCount > 0 ? currentOffset + 1 : 0;
  const endItem = currentOffset + itemsDisplayedCount;

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
    return <div className="p-5 dark:text-gray-300">Cargando personal...</div>;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="lg:block">
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
            <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
              <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
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
                    {itemsPerPages !== "all" && (
                      <span className="text-gray-500 dark:text-gray-400">
                        filas
                      </span>
                    )}
                  </div>

                  <div className="relative z-20 bg-transparent">
                    <select
                      className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                      value={filterStatus}
                      onChange={handleFilterStatusChange}
                    >
                      {FILTERS.map((filter) => (
                        <option
                          key={filter.value}
                          value={filter.value}
                          className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                        >
                          {filter.label}
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
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative">
                    <form onSubmit={(e) => e.preventDefault()}>
                      <span className="absolute text-gray-498 -translate-y-1/2 left-4 top-1/2 dark:text-gray-400">
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
                        placeholder="Buscar Apellidos, Nombre, CI o Unidad (ctrl k)"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[360px]"
                      />
                    </form>
                  </div>

                  {/* Botón Nuevo */}
                  {filterStatus === "active" && (
                    <Button
                      className="inline-flex items-center justify-center gap-2 rounded-lg transition px-4 py-3 ring-1 ring-inset ring-gray-300 hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300 "
                      onClick={handleCreate}
                    >
                      + Nuevo
                    </Button>
                  )}

                  {/* Botones de Exportación */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleExportCSV}
                      className="inline-flex items-center justify-center gap-2 rounded-lg transition px-4 py-3 ring-1 ring-inset ring-gray-300 hover:bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:ring-gray-700 dark:hover:bg-green-900/[0.3] dark:hover:text-green-300"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      CSV
                    </Button>
                    <Button
                      onClick={handleExportPDF}
                      className="inline-flex items-center justify-center gap-2 rounded-lg transition px-4 py-3 ring-1 ring-inset ring-gray-300 hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:ring-gray-700 dark:hover:bg-red-900/[0.3] dark:hover:text-red-300"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {currentData.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No se encontraron registros{" "}
                    {filterStatus === "active" ? "activos" : "eliminados"}.
                  </div>
                ) : (
                  currentData.map((person) => (
                    <div
                      key={`person-card-${person.id}`}
                      className="bg-white dark:bg-white/[0.03] p-4 rounded-lg border border-gray-200 dark:border-white/[0.05] shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {person.grade_data?.grade_abbr} {person.first_name}{" "}
                          {person.last_name}
                        </h3>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(person)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => handleDelete(person.id)}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            {filterStatus === "active"
                              ? "Eliminar"
                              : "Restaurar"}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">C.I.:</span>{" "}
                          {person.identity_card}
                        </div>
                        <div>
                          <span className="font-medium">Edad:</span>{" "}
                          {person.age}
                        </div>
                        <div>
                          <span className="font-medium">Género:</span>{" "}
                          {person.genre}
                        </div>
                        <div>
                          <span className="font-medium">Celular:</span>{" "}
                          {person.phone}
                        </div>
                        <div>
                          <span className="font-medium">Destino:</span>{" "}
                          {person.units_data?.name}
                        </div>
                        <div>
                          <span className="font-medium">Dirección:</span>{" "}
                          {person.address}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block max-w-full overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
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

                  {/* Table Body */}
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {currentData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          // colSpan={columns.length}
                          className="text-center py-4 text-gray-500 dark:text-gray-400"
                        >
                          No se encontraron registros{" "}
                          {filterStatus === "active" ? "activos" : "eliminados"}
                          .
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentData.map((person) => (
                        <TableRow
                          key={`person-${person.id}`}
                          className="hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          {columns.map((col) => {
                            if (col.key === "actions") {
                              return (
                                <TableCell
                                  key={col.key}
                                  className="px-1 py-3 text-gray-500 text-theme-sm dark:text-gray-400 border border-lime-700"
                                >
                                  <div className="flex items-center w-full gap-2">
                                    {/* Botón de Editar/Restaurar */}
                                    {filterStatus === "active" ? (
                                      // Modo ACTIVO: Botón Editar
                                      <button
                                        onClick={() => handleEdit(person)}
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
                                    ) : (
                                      // Modo INACTIVO: Botón Restaurar
                                      <button
                                        onClick={() =>
                                          toggleActiveStatus(person, true)
                                        }
                                        title="Restaurar"
                                        className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                      >
                                        <svg
                                          className="size-5"
                                          width="1em"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M12 4V2.00003C12 1.62503 12.4497 1.43986 12.7157 1.70586L15.7071 4.69726C16.0976 5.08779 16.0976 5.72096 15.7071 6.11149L12.7157 9.10289C12.4497 9.36889 12 9.18372 12 8.80872V7C7.6477 7 4.47545 10.155 4.0728 14.2831C4.01831 14.8465 4.46904 15.3408 5.0335 15.3408H5.97607C6.27555 15.3408 6.54145 15.1037 6.58667 14.8055C6.91038 12.6366 8.16788 11.2393 10.3683 10.518C10.7431 10.3957 11 10.0526 11 9.66403V10.8087C11 11.1837 11.4497 11.3689 11.7157 11.1029L14.7071 8.11149C15.0976 7.72096 15.0976 7.08779 14.7071 6.69726L11.7157 3.70586C11.4497 3.43986 11 3.62503 11 4V4.80872H10.5752C6.03061 4.80872 3.00003 7.84652 3.00003 12.6408C3.00003 17.4351 6.03061 20.4729 10.5752 20.4729H18.9959C19.4629 20.4729 19.8459 20.0898 19.8459 19.6229V17.0784C19.8459 16.6642 19.5101 16.3284 19.0959 16.3284C18.6817 16.3284 18.3459 16.6642 18.3459 17.0784V19.6229H10.5752C7.3001 19.6229 5.84592 18.3751 5.09592 16.4998C4.94592 16.1248 4.60013 15.8408 4.21592 15.8408H3.59092C3.12399 15.8408 2.74098 16.2238 2.74098 16.6908C2.74098 17.1577 3.12399 17.5408 3.59092 17.5408H4.21592C4.60013 17.5408 4.94592 17.8247 5.09592 18.1998C5.84592 20.0751 7.3001 21.3229 10.5752 21.3229H18.9959C20.6459 21.3229 21.3459 20.6124 21.3459 19.6229V4.7915C21.3459 3.80199 20.6459 3.0915 18.9959 3.0915H11.2081C10.7938 3.0915 10.4581 3.42729 10.4581 3.8415C10.4581 4.25572 10.7938 4.5915 11.2081 4.5915H18.9959C19.5604 4.5915 19.8459 4.88775 19.8459 5.25072V15.7082C19.8459 16.0712 19.5604 16.3674 18.9959 16.3674H10.5752C5.95928 16.3674 2.94086 13.4002 2.94086 8.74984C2.94086 4.16744 5.95928 1.20019 10.5752 1.20019H11.2081C11.6223 1.20019 11.9581 1.53597 11.9581 1.95019V4.00003L11.7081 4.25003L11.7157 4.25769L11.7157 4.25769L11.7157 4.25769L11.7157 4.25769L11.7157 4.25769L11.7157 4.25769V4.00003L11.7081 4.00003L11.7081 4.00003H10.5752C6.67512 4.00003 4.24086 6.13111 4.24086 8.74984C4.24086 11.3686 6.67512 13.4996 10.5752 13.4996H19.0959C19.5101 13.4996 19.8459 13.1638 19.8459 12.7496V12.0125C19.8459 11.5983 19.5101 11.2625 19.0959 11.2625H10.5752C6.98565 11.2625 4.5835 9.17514 4.5835 6.4674C4.5835 6.05319 4.24771 5.7174 3.8335 5.7174C3.41928 5.7174 3.0835 6.05319 3.0835 6.4674C3.0835 9.53935 5.78762 11.7625 10.5752 11.7625H19.0959C20.3385 11.7625 21.3459 12.7698 21.3459 14.0125V17.3996C21.3459 18.6423 20.3385 19.6496 19.0959 19.6496H10.5752C5.38316 19.6496 2.0835 17.7688 2.0835 12.6408C2.0835 7.51272 5.38316 5.63198 10.5752 5.63198H11.2081C11.6223 5.63198 11.9581 5.96777 11.9581 6.38198V7.37503H12.7081V6.38198C12.7081 5.58137 12.062 4.93532 11.2081 4.93532H10.5752C5.95928 4.93532 2.94086 7.85408 2.94086 12.6408C2.94086 17.4274 5.95928 20.3462 10.5752 20.3462H18.9959C20.6459 20.3462 21.3459 19.6357 21.3459 18.6462V4.7915C21.3459 3.80199 20.6459 3.0915 18.9959 3.0915H11.2081C10.7938 3.0915 10.4581 3.42729 10.4581 3.8415C10.4581 4.25572 10.7938 4.5915 11.2081 4.5915H18.9959C20.0954 4.5915 20.3459 5.0915 20.3459 5.7174V18.6462C20.3459 19.2721 20.0954 19.7721 18.9959 19.7721H10.5752Z"
                                            fill="currentColor"
                                          ></path>
                                        </svg>
                                      </button>
                                    )}

                                    {/* Botón de Eliminar / Eliminar Lógico */}
                                    {filterStatus === "active" && (
                                      <button
                                        onClick={() =>
                                          toggleActiveStatus(person, false)
                                        }
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
                                    )}
                                  </div>
                                </TableCell>
                              );
                            }
                            return (
                              <TableCell
                                key={col.key}
                                className={`px-1 py-3 text-gray-500 text-theme-sm border border-lime-700 dark:border-white/[0.05] dark:text-gray-400 ${col.bold ? "font-bold text-black dark:text-white" : "text-gray-500 whitespace-nowrap"}`}
                              >
                                {getValue(person, col)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/*NOTE: Paginación */}
              <div className="border border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                  <div className="pb-3 xl:pb-0">
                    <span className="dark:text-gray-200">
                      Mostrando{" "}
                      {totalItemsCount > 0 ? (
                        <>
                          <span className="font-medium text-gray-800 dark:text-white">
                            {startItem}
                          </span>{" "}
                          a{" "}
                          <span className="font-medium text-gray-800 dark:text-white">
                            {endItem}
                          </span>{" "}
                          de{" "}
                        </>
                      ) : null}
                      <span className="font-medium text-gray-800 dark:text-white">
                        {totalItemsCount}
                      </span>{" "}
                      registros{" "}
                      {filterStatus === "active" ? "activos" : "eliminados"}
                    </span>
                  </div>

                  {/* Controles de paginación solo si hay más de una página */}
                  {totalPages > 1 && (
                    <nav
                      aria-label="Pagination"
                      className="flex items-center justify-end gap-3 text-sm"
                    >
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="inline-flex items-center justify-center rounded-lg transition h-9 px-4 py-2 ring-1 ring-inset ring-gray-300 hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        Anterior
                      </button>

                      {/* Botones de página */}
                      <div className="flex items-center gap-2">
                        {pageRange.map((page, index) =>
                          page === "..." ? (
                            <span
                              key={page}
                              className="px-3 py-2 text-gray-500 dark:text-gray-400"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => paginate(page as number)}
                              className={`inline-flex items-center justify-center rounded-lg transition h-9 px-3 py-2 ${
                                currentPage === page
                                  ? "bg-brand-500 text-white dark:bg-brand-700 dark:text-white"
                                  : "ring-1 ring-inset ring-gray-300 hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300"
                              }`}
                            >
                              {page}
                            </button>
                          ),
                        )}
                      </div>

                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center justify-center rounded-lg transition h-9 px-4 py-2 ring-1 ring-inset ring-gray-300 hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        Siguiente
                      </button>
                    </nav>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <PersonnelModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          personnelToEdit={personnelToEdit}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
