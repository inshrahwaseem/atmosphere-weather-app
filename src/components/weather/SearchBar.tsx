import { useState, useCallback, useRef, useEffect, memo } from "react";
import { Search, X, MapPin, Clock, Loader2 } from "lucide-react";
import { useWeather } from "@/lib/weather-store";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";

interface Suggestion {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
}

/** Strip potentially dangerous characters from search input */
function sanitizeQuery(q: string): string {
  return q.replace(/[<>{}[\]\\]/g, "").slice(0, 100);
}

export const SearchBar = memo(function SearchBar() {
  const { searchCity, searchByCoords, searchHistory, clearHistory, isLoading } = useWeather();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); // keyboard nav index
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query.trim(), 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    const sanitized = sanitizeQuery(debouncedQuery);
    if (!sanitized) return;

    let cancelled = false;
    setLoadingSuggestions(true);

    supabase.functions
      .invoke("city-search", { body: { query: sanitized } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data?.results) {
          setSuggestions(data.results);
          setActiveIndex(-1);
        }
      })
      .catch(() => { /* silent fail */ })
      .finally(() => { if (!cancelled) setLoadingSuggestions(false); });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const closeDropdown = useCallback(() => {
    setIsFocused(false);
    setSuggestions([]);
    setActiveIndex(-1);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      // Check highlighted suggestion first
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        const s = suggestions[activeIndex];
        searchByCoords(s.lat, s.lon);
        setQuery("");
        closeDropdown();
        inputRef.current?.blur();
        return;
      }
      // ✅ FIX: Also handle highlighted history item (when suggestions are empty)
      if (activeIndex >= 0 && searchHistory[activeIndex]) {
        searchCity(searchHistory[activeIndex].city);
        setQuery("");
        closeDropdown();
        inputRef.current?.blur();
        return;
      }
      const q = sanitizeQuery(query.trim());
      if (q) {
        searchCity(q);
        setQuery("");
        closeDropdown();
        inputRef.current?.blur();
      }
    },
    [query, activeIndex, suggestions, searchHistory, searchCity, searchByCoords, closeDropdown]
  );

  const handleSuggestionClick = useCallback(
    (s: Suggestion) => {
      searchByCoords(s.lat, s.lon);
      setQuery("");
      closeDropdown();
    },
    [searchByCoords, closeDropdown]
  );

  const handleHistoryClick = useCallback(
    (city: string) => {
      searchCity(city);
      setQuery("");
      closeDropdown();
    },
    [searchCity, closeDropdown]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(sanitizeQuery(e.target.value));
  }, []);

  // ✅ Keyboard navigation: Arrow keys, Escape, Enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const items = suggestions.length > 0 ? suggestions : [];
      const histItems = searchHistory;
      const allItems = items.length > 0 ? items : histItems;

      if (e.key === "Escape") {
        closeDropdown();
        inputRef.current?.blur();
        return;
      }

      if (!isFocused || allItems.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(prev => (prev < allItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : allItems.length - 1));
      }
    },
    [isFocused, suggestions, searchHistory, closeDropdown]
  );

  const showSuggestions = isFocused && suggestions.length > 0 && query.trim().length >= 2;
  const showHistory =
    isFocused && !showSuggestions && searchHistory.length > 0 && query.trim().length < 2;
  const dropdownId = "search-dropdown";

  return (
    <div className="relative w-full max-w-sm" ref={containerRef}>
      <form onSubmit={handleSubmit} className="relative" role="search">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(closeDropdown, 200)}
          onKeyDown={handleKeyDown}
          placeholder="Search city..."
          disabled={isLoading}
          maxLength={100}
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions || showHistory}
          aria-controls={dropdownId}
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          aria-label="Search for a city"
          className="w-full pl-10 pr-10 py-2.5 glass-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-all duration-250"
        />
        {(loadingSuggestions || (query && !isLoading)) && (
          <button
            type="button"
            onClick={() => { setQuery(""); setSuggestions([]); setActiveIndex(-1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            {loadingSuggestions ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        )}
      </form>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            id={dropdownId}
            ref={listRef}
            role="listbox"
            aria-label="City suggestions"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full mt-2 w-full glass-dropdown rounded-xl z-50 overflow-hidden"
          >
            <div className="px-3.5 py-2 border-b border-border/30">
              <span className="label-caps">Suggestions</span>
            </div>
            {suggestions.map((s, i) => (
              <button
                key={`${s.lat}-${s.lon}-${i}`}
                id={`suggestion-${i}`}
                role="option"
                aria-selected={activeIndex === i}
                onClick={() => handleSuggestionClick(s)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground transition-colors text-left ${
                  activeIndex === i ? "bg-secondary/60" : "hover:bg-secondary/40"
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground ml-1.5 text-xs">
                    {s.region ? `${s.region}, ` : ""}{s.country}
                  </span>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {showHistory && (
          <motion.div
            id={dropdownId}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full mt-2 w-full glass-dropdown rounded-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/30">
              <span className="label-caps">Recent</span>
              <button
                onClick={clearHistory}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                aria-label="Clear search history"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            {searchHistory.map((entry, i) => (
              <button
                key={entry.timestamp}
                id={`suggestion-${i}`}
                role="option"
                aria-selected={activeIndex === i}
                onClick={() => handleHistoryClick(entry.city)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground transition-colors text-left ${
                  activeIndex === i ? "bg-secondary/60" : "hover:bg-secondary/40"
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                {entry.city}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
