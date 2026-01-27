import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui";
import { useEffect, useMemo, useState } from "react";
import React from "react";
import { PrenatalCareService, PrenatalRecord } from "../../../services/prenatalCareService";
import PrenatalRecordModal from "../../ui/modal/PrenatalRecordModal";
import { DownloadIcon } from "../../../icons";
import Swal from "sweetalert2";

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50];
const columns = [
  { key: "relationship_type", label: "Tipo de Relación", formatter: (v: string) => v === "officer" ? "Funcionario" : "Pareja Civil" },
  { 
    key: "personnel_name", 
    label: "Persona Asociada", 
    formatter: (_: any, record: any) => {
      if (record.relationship_type === "officer") {
        return record.personnel_name || (record.personnel ? `${record.personnel.first_name} ${record.personnel.last_name}` : "-");
      }
      return record.civil_partner_name || "-";
    }
  },
  { key: "estimated_delivery_date", label: "Fecha Probable Parto" },
  { key: "current_gestation_week", label: "Semana Gestación" },
  { key: "rh_factor", label: "Factor RH" },
  { key: "control_location", label: "Lugar de Control" },
  { key: "observations", label: "Observaciones" },
  { key: "actions", label: "Acciones" },
];

interface PrenatalRecordsTableProps {
  personnelId: number;
}

export default function PrenatalRecordsTable({ personnelId }: PrenatalRecordsTableProps) {
  const [data, setData] = useState<PrenatalRecord[]>([]);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<PrenatalRecord | null>(null);

  const [itemsPerPages, setItemsPerPages] = useState<number | "all">(10);
  const [currentPage, setCurrentPage] = useState(1);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const limitParam = itemsPerPages === "all" ? 10000 : (itemsPerPages as number);
      const offsetParam = itemsPerPages === "all" ? 0 : currentOffset;

      if (!personnelId) {
        setData([]);
        setTotalItemsCount(0);
        return;
      }
      
      const response = await PrenatalCareService.getByPersonnel(personnelId, {
        limit: limitParam,
        offset: offsetParam,
      });

      // Manejar respuesta paginada o no paginada
      if (response.data.results) {
        setData(response.data.results || []);
        setTotalItemsCount(response.data.count || 0);
      } else {
        // Asume no paginado o sub-lista si el endpoint no devuelve el formato estándar
        setData(response.data || []);
        setTotalItemsCount(response.data.length || 0);
      }
    } catch (error) {
      console.error("Error fetching prenatal records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (personnelId) {
      fetchData();
    }
  }, [personnelId, itemsPerPages, currentOffset]);

  const currentItems = data;

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

  const pageRange = useMemo(() => {
    const range = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      range.push(1);

      if (startPage > 2) {
        range.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        if (i > 1 && i < totalPages) {
          range.push(i);
        }
      }

      if (endPage < totalPages - 1) {
        range.push("...");
      }

      if (totalPages > 1) {
        range.push(totalPages);
      }
    }

    return Array.from(new Set(range));
  }, [totalPages, currentPage]);

  const handleExportCSV = async () => {
    try {
      Swal.fire({
        title: "Exportando CSV...",
        text: "Por favor espere mientras se genera el archivo.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      
      const params = personnelId ? { personnel_id: personnelId } : {};
      const response = await PrenatalCareService.exportCSV(params);
      
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prenatal_records_${new Date().toISOString().slice(0, 10)}.csv`;
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
      
      const params = personnelId ? { personnel_id: personnelId } : {};
      const response = await PrenatalCareService.exportPDF(params);
      
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prenatal_records_${new Date().toISOString().slice(0, 10)}.pdf`;
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

  const handleCreate = () => {
    setRecordToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record: PrenatalRecord) => {
    setRecordToEdit(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (record: PrenatalRecord) => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseas eliminar este registro prenatal?`,
      )
    ) {
      return;
    }

    try {
      await PrenatalCareService.delete(record.id);
      fetchData(); // Usar fetchData para refrescar la lista
    } catch (error) {
      console.error("Error al eliminar registro prenatal:", error);
      window.alert("Hubo un error al eliminar el registro.");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setRecordToEdit(null);
  };

  const handleSave = (savedRecord: PrenatalRecord) => {
    fetchData(); // Usar fetchData para refrescar la lista y el conteo total
  };

  const itemsDisplayedCount = currentItems.length;
  const startItem = itemsDisplayedCount > 0 ? currentOffset + 1 : 0;
  const endItem = currentOffset + itemsDisplayedCount;

  if (loading)
    return <div className="p-5 dark:text-gray-300">Cargando registros prenatales...</div>;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="lg:block">
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
            <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
              <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 dark:text-gray-400">
                    Mostrar
                  </span>
                  <div className="relative z-20 bg-transparent">
                    <select
                      className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
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
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center justify-center gap-2 rounded-lg transition px-4 py-3 ring-1 ring-inset ring-gray-300 hover:bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:ring-gray-700 dark:hover:bg-green-900/[0.3] dark:hover:text-green-300"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      CSV
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="inline-flex items-center justify-center gap-2 rounded-lg transition px-4 py-3 ring-1 ring-inset ring-gray-300 hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:ring-gray-700 dark:hover:bg-red-900/[0.3] dark:hover:text-red-300"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      PDF
                    </button>
                  </div>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg transition px-4 py-3 ring-1 ring-inset ring-gray-300 hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300"
                    onClick={handleCreate}
                  >
                    + Nuevo Registro
                  </button>
                </div>
              </div>
              <div className="max-w-full overflow-x-auto custom-scrollbar">
                <Table>
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

                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {currentItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          className="border border-lime-700 text-center py-4 text-gray-500 dark:text-gray-400"
                        >
                          No se encontraron registros prenatales.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentItems.map((record) => (
                        <TableRow
                          key={record.id}
                          className="hover:bg-lime-200 dark:hover:bg-lime-700"
                        >
                          {columns.map((col) => {
                            if (col.key === "actions") {
                              return (
                                <TableCell
                                  key={col.key}
                                  className="border border-lime-700 px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap"
                                >
                                  <div className="flex items-center w-full gap-2">
                                    <button
                                      onClick={() => handleEdit(record)}
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
                                      onClick={() => handleDelete(record)}
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
                                className="border border-lime-700 px-1 py-3 text-gray-500 text-theme-sm border border-gray-100 dark:border-white/[0.05] dark:text-gray-400 whitespace-nowrap"
                              >
                                {(col.formatter && col.formatter((record as any)[col.key], record)) || (record as any)[col.key] || "-"}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="border border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                  <div className="pb-3 xl:pb-0">
                    <span className="dark:text-gray-200">
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
                      registros
                    </span>
                  </div>
                  {totalPages > 1 && (
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
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <PrenatalRecordModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          recordToEdit={recordToEdit}
          personnelId={personnelId}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
