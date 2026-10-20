"use client";

import {
  getUserStorageItemSync,
  removeUserStorageItemSync,
  setUserStorageItemSync,
} from "@/lib/user-storage";
import { Clock, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";

const MAX_RECENT_SEARCHES = 5;

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from user-scoped localStorage
  useEffect(() => {
    const stored = getUserStorageItemSync("recentSearches");
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
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      setUserStorageItemSync("recentSearches", JSON.stringify(updated));
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
    removeUserStorageItemSync("recentSearches");
  }, []);

  const showDropdown = isFocused && recentSearches.length > 0;

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search mixes..."
          className="input w-40 pl-10 md:w-64"
          aria-label="Search mixes"
        />
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </form>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close search results"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsFocused(false);
            }}
          />

          {/* Recent Searches Dropdown */}
          <div className="card-overlay absolute top-full right-0 left-0 z-50 mt-2 animate-in duration-200 slide-in-from-top-2">
            <div className="p-3">
              <div className="mb-2 flex items-center justify-between px-2">
                <h3 className="text-xs font-medium text-muted-foreground">Recent Searches</h3>
                <button
                  onClick={clearRecentSearches}
                  className="btn btn-ghost btn-sm text-xs text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-1">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleRecentSearchClick(search)}
                    className="btn btn-ghost w-full justify-start gap-3 rounded-lg border-transparent px-3 py-2 text-sm text-muted-foreground transition-all duration-fast hover:bg-accent hover:text-foreground"
                    type="button"
                  >
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm">{search}</span>
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
