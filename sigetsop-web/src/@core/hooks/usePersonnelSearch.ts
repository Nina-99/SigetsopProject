import axios from "axios";
import { useState } from "react";

export default function usePersonnelSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchPersonnel = async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/personnel/search/?q=${query}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setResults(res.data);
    } catch (err) {
      console.error("Error buscando personnel:", err);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, searchPersonnel };
}
