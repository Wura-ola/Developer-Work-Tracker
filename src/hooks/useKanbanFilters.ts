import { useSearchParams } from "react-router-dom";

export function useKanbanFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read current query values from URL string
  const searchQuery = searchParams.get("q") || "";
  const selectedLabel = searchParams.get("label") || "";

  // Update or delete query params in real-time
  const setFilter = (key: "q" | "label", value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value.trim()) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  return { searchQuery, selectedLabel, setFilter };
}
