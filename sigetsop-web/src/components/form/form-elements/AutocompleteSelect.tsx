import { useEffect, useState, useCallback } from "react";

interface Personnel {
  id: number | string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  maternal_name?: string;
  grade_data?: { grade_abbr: string };
}

interface AutocompleteSelectProps<T extends { id?: number | string }> {
  label?: string;
  value: T | null;
  onChange: (selected: T | null) => void;
  placeholder?: string;
  fetchResults: (query: string) => Promise<T[]>;
}

export default function AutocompleteSelect<T extends Personnel>({
  label,
  value,
  onChange,
  placeholder = "Buscar personal...",
  fetchResults,
}: AutocompleteSelectProps<T>) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const getFullName = (person: any) => {
    if (!person) return "";
    // usa los campos reales que vienen de tu backend
    const parts = [
      person.last_name || person.apellido || "",
      person.maternal_name || "",
      person.first_name || person.nombre || "",
      person.middle_name || "",
    ].filter(Boolean);
    return parts.join(" ") || person.id?.toString() || "";
  };

  useEffect(() => {
    if (value) setQuery(getFullName(value));
  }, [value]);

  const search = useCallback(
    async (q: string) => {
      if (!q || q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchResults(q);
        setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error buscando personal:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchResults],
  );

  useEffect(() => {
    search(query);
  }, [query, search]);

  return (
    <div className="relative w-full">
      {label && (
        <label className="text-sm text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          const newQuery = e.target.value;
          setQuery(newQuery);
          setOpen(true);

          if (!newQuery.trim()) {
            onChange(null); // Notificar al padre si el campo se borra
          }
        }}
        className="w-full p-2 mt-1 border rounded-lg bg-white dark:bg-gray-900 dark:text-gray-200"
      />

      {open && (
        <div className="absolute z-20 w-full max-h-60 overflow-y-auto mt-1 bg-white border rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
          {loading ? (
            <div className="p-3 text-gray-500">Buscando...</div>
          ) : results.length > 0 ? (
            results.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setQuery(getFullName(p));
                  setOpen(false);
                  onChange(p);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="font-medium">{getFullName(p)}</div>
                {p.grade_data?.grade_abbr && (
                  <div className="text-xs text-gray-500">
                    {p.grade_data.grade_abbr}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-3 text-gray-500">Sin resultados</div>
          )}
        </div>
      )}
    </div>
  );
}
