'use client'

import { useState, useRef, useEffect } from 'react'
import { LANGUAGES, type Language } from '@/lib/constants/languages'
import { cn } from '@/lib/utils'

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language')
      return LANGUAGES.find(l => l.code === saved) || LANGUAGES[0]
    }
    return LANGUAGES[0]
  })
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang)
    setIsOpen(false)
    localStorage.setItem('language', lang.code)
    // Future: Update i18n router
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200"
        aria-label={`Change language (current: ${currentLang.name})`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        <span className="text-lg" aria-hidden="true">{currentLang.flag}</span>
        <span className="hidden md:inline">{currentLang.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 py-2 w-40 bg-gray-800 rounded-lg shadow-xl border border-white/10 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang)}
              className={cn(
                "w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-white/10 transition-colors",
                lang.code === currentLang.code 
                  ? "text-white bg-white/5" 
                  : "text-gray-300"
              )}
              aria-current={lang.code === currentLang.code ? 'true' : undefined}
            >
              <span aria-hidden="true">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
