 import {
  ComponentCard,
  PageBreadCrumb,
  PageMeta,
  PrenatalRecordsTable,
} from "../../components";
import { useState, useEffect } from "react";
import { PersonnelService } from "../../services";

export default function PrenatalRecordsPage() {
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<number | null>(null);
  const [personnelName, setPersonnelName] = useState<string>("");
  const [personnelOptions, setPersonnelOptions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  const searchDelay = 300;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, searchDelay);

    return () => clearTimeout(timer);
  }, [searchTerm, searchDelay]);

  useEffect(() => {
    const fetchPersonnel = async () => {
      if (debouncedSearchTerm.length >= 2) {
        setIsSearching(true);
        try {
          const response = await PersonnelService.list({
            search: debouncedSearchTerm,
            limit: 2500,
            filter_status: "True"
          });
          const allPersonnel = response.data.results || response.data;

          setPersonnelOptions(allPersonnel);
          setShowDropdown(true);
        } catch (error) {
          console.error("Error fetching personnel:", error);
          setPersonnelOptions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setPersonnelOptions([]);
        setShowDropdown(false);
      }
    };

    fetchPersonnel();
  }, [debouncedSearchTerm]);

  const handleSelectPersonnel = (personnel: any) => {
    setSelectedPersonnelId(personnel.id);
    setPersonnelName(`${personnel.first_name} ${personnel.last_name}`);
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    setSelectedPersonnelId(null);
    setPersonnelName("");
  };

  return (
    <>
      <PageMeta
        title="Sigetsop - Control Prenatal"
        description="Página de gestión de registros prenatales"
      />
      <PageBreadCrumb pageTitle="Control Prenatal" />
      <div className="space-y-6">
        {!selectedPersonnelId ? (
          <ComponentCard title="Buscar Personal">
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar por Nombre o Cédula de Identidad
                </label>
                <input
                  type="text"
                  placeholder="Ingrese nombre o CI del personal (mínimo 2 caracteres)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => debouncedSearchTerm.length >= 2 && setShowDropdown(true)}
                  autoComplete="off"
                />
                {isSearching && (
                  <div className="absolute right-10 top-10 text-gray-500">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                {showDropdown && personnelOptions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {personnelOptions.slice(0, 50).map((personnel) => (
                      <button
                        key={personnel.id}
                        onClick={() => handleSelectPersonnel(personnel)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                      >
                        {`${personnel.first_name} ${personnel.last_name} ${personnel.maternal_name || ''}`.trim()} - CI: {personnel.identity_card}
                      </button>
                    ))}
                    {personnelOptions.length > 50 && (
                      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center border-t dark:border-gray-600">
                        Mostrando los primeros 50 de {personnelOptions.length} resultados
                      </div>
                    )}
                  </div>
                )}
                {showDropdown && personnelOptions.length === 0 && !isSearching && debouncedSearchTerm.length >= 2 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    No se encontraron resultados para "{debouncedSearchTerm}"
                  </p>
                )}
              </div>

              {debouncedSearchTerm.length >= 2 && personnelOptions.length === 0 && !isSearching && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No se encontraron resultados para "{debouncedSearchTerm}"
                </p>
              )}
            </div>
          </ComponentCard>
        ) : (
          <ComponentCard title={`Registros Prenatales - ${personnelName}`}>
            <div className="flex flex-col gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Personal ID: {selectedPersonnelId}
              </div>
              <button
                onClick={handleClearSelection}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                ← Buscar otro personal
              </button>
              <PrenatalRecordsTable personnelId={selectedPersonnelId} />
            </div>
          </ComponentCard>
        )}
      </div>
    </>
  );
}
