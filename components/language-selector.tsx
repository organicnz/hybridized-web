"use client";

import { LANGUAGES, type Language } from "@/lib/constants/languages";
import { getUserStorageItemSync, setUserStorageItemSync } from "@/lib/user-storage";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>(LANGUAGES[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load language preference on mount (after user storage is initialized)
  useEffect(() => {
    const saved = getUserStorageItemSync("language");
    if (saved) {
      const lang = LANGUAGES.find((l) => l.code === saved);
      if (lang) setCurrentLang(lang);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    setIsOpen(false);
    setUserStorageItemSync("language", lang.code);
    // Future: Update i18n router
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center gap-2 rounded-lg px-2 py-1 text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Change language (current: ${currentLang.name})`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        <span className="text-lg" aria-hidden="true">
          {currentLang.flag}
        </span>
        <span className="hidden md:inline">{currentLang.name}</span>
      </button>

      {isOpen && (
        <div className="card-overlay absolute right-0 z-50 mt-2 w-44 animate-in fade-in slide-in-from-top-2 duration-200 py-2">
          {LANGUAGES.map((lang) => (
            <button
              type="button"
              key={lang.code}
              onClick={() => handleLanguageChange(lang)}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                lang.code === currentLang.code
                  ? "bg-accent/60 text-accent-foreground"
                  : "text-muted-foreground",
              )}
              aria-current={lang.code === currentLang.code ? "true" : undefined}
            >
              <span aria-hidden="true">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
