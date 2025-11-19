"use client";

import { Search, Clock, X } from "lucide-react";
import { useState, useCallback, FormEvent, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const MAX_RECENT_SEARCHES = 5;

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent searches:", e);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveRecentSearch = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (s) => s.toLowerCase() !== trimmed.toLowerCase(),
      );
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        saveRecentSearch(query);
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        setIsFocused(false);
      }
    },
    [query, router, saveRecentSearch],
  );

  const handleRecentSearchClick = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsFocused(false);
    },
    [router],
  );

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  }, []);

  const showDropdown = isFocused && recentSearches.length > 0;

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <form onSubmit={handleSubmit}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search mixes..."
          className="w-40 md:w-64 px-4 py-2 pl-10 bg-white/10 text-white placeholder:text-white/40 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/15 transition-all hover:bg-white/15"
          aria-label="Search mixes"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
      </form>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsFocused(false)}
          />

          {/* Recent Searches Dropdown */}
          <div
            className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-br from-zinc-900/95 to-black/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200 gpu-filter gpu"
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none" />

            <div className="relative p-3">
              <div className="flex items-center justify-between mb-2 px-2">
                <h3 className="text-white/70 font-medium text-xs">
                  Recent Searches
                </h3>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-white/50 hover:text-white/80 transition-colors"
                  type="button"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all duration-200 group text-left border border-transparent hover:border-purple-400/30 gpu"
                    type="button"
                  >
                    <Clock className="w-4 h-4 text-white/40 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                    <span className="text-sm truncate flex-1">{search}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
