// useTableData.ts
import { useState, useMemo } from "react";
import { Personnel } from "../../services";

interface UseTableDataPropsimport {
  initialData: Personnel[];
  itemsPerPage?: number;
}

export const useTableData = ({
  initialData,
  itemsPerPage = 10,
}: UseTableDataProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Lógica de Filtrado (la misma que arriba)
  const filteredData = useMemo(() => {
    /* ... lógica de filtrado ... */
  }, [initialData, searchTerm]);

  // Lógica de Paginación (la misma que arriba)
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Retorna todo lo que el componente necesita
  return {
    currentItems,
    searchTerm,
    setSearchTerm,
    currentPage,
    totalPages,
    paginate,
    totalItems,
    // ...
  };
};
