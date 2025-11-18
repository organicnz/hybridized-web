'use client'

import { Search } from "lucide-react"
import { useState, useCallback, FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  
  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }, [query, router])
  
  return (
    <form onSubmit={handleSubmit} className="relative hidden sm:block">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search mixes..."
        className="w-40 md:w-64 px-4 py-2 pl-10 bg-white/10 text-white placeholder:text-white/40 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:bg-white/15 transition-all hover:bg-white/15"
        aria-label="Search mixes"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
    </form>
  )
}
