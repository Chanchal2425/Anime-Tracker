import React, { useState, useEffect } from "react";
import API from "../api/api";

export default function SearchBar({ onResultsFound }) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Debounce API calls by 350ms
    const timer = setTimeout(() => {
      // Build query string dynamically based on selected filters
      const params = new URLSearchParams();
      if (query.trim()) params.append("q", query.trim());
      if (genre) params.append("genre", genre);
      if (minRating) params.append("min_rating", minRating);
      if (sortBy) params.append("sort_by", sortBy);

      setLoading(true);

      API.get(`/search/?${params.toString()}`)
        .then((res) => {
          setLoading(false);
          if (onResultsFound) {
            onResultsFound(res.data || []);
          }
        })
        .catch((err) => {
          setLoading(false);
          console.error("🔍 Search error:", err.response?.data || err.message);
          if (onResultsFound) onResultsFound([]);
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [query, genre, minRating, sortBy]);


  const executeSearch = async (searchQuery, currentFilters) => {
  // Allow search if user typed OR selected any filter
  const hasFilter = 
    currentFilters.genre || 
    currentFilters.minRating || 
    currentFilters.duration || 
    currentFilters.sortBy;

  if (!searchQuery.trim() && !hasFilter) return;

  setLoading(true);
  setHasSearched(true);

  const params = new URLSearchParams();
  if (searchQuery.trim()) params.append("q", searchQuery.trim());
  if (currentFilters.genre) params.append("genre", currentFilters.genre);
  if (currentFilters.minRating) params.append("min_rating", currentFilters.minRating);
  if (currentFilters.duration) params.append("duration", currentFilters.duration);
  if (currentFilters.sortBy) params.append("sort_by", currentFilters.sortBy);

  try {
    const res = await API.get(`/search/?${params.toString()}`);
    setResults(res.data || []);
  } catch (err) {
    console.error(err);
    setResults([]);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-4">
      {/* Search Bar Input */}
      <div className="relative w-full max-w-xl flex items-center bg-[#222226] rounded-full px-4 py-2 border border-gray-700">
        <input
          type="text"
          placeholder="Search anime (e.g. Naruto, Bleach)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent w-full text-white outline-none px-2 placeholder-gray-400"
        />
        {loading && <span className="text-sm mr-2">⏳</span>}
        <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-1.5 rounded-full font-semibold transition">
          Search
        </button>
      </div>
    </div>
  );
}