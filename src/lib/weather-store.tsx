import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import type { TemperatureUnit, CurrentWeatherData, ForecastDay, SearchEntry, GraphTab } from "./weather-types";
import { supabase } from "@/integrations/supabase/client";

interface WeatherState {
  unit: TemperatureUnit;
  current: CurrentWeatherData | null;
  forecast: ForecastDay[];
  searchHistory: SearchEntry[];
  isLoading: boolean;
  error: string | null;
  activeTab: GraphTab;
  isOffline: boolean;
  setActiveTab: (tab: GraphTab) => void;
  toggleUnit: () => void;
  searchCity: (city: string) => void;
  searchByCoords: (lat: number, lon: number) => void;
  clearHistory: () => void;
  retryLastSearch: () => void;
}

const WeatherContext = createContext<WeatherState | null>(null);

interface CacheEntry {
  data: { current: unknown; forecast: unknown[] };
  timestamp: number;
}

// In-memory cache with 5min TTL and max 50 entries
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_MAX = 50;

function getCacheKey(params: { city?: string; lat?: number; lon?: number }): string {
  if (params.city) return `city:${params.city.toLowerCase().trim()}`;
  return `coords:${params.lat?.toFixed(2)},${params.lon?.toFixed(2)}`;
}

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function loadOfflineData(): { current: CurrentWeatherData | null; forecast: ForecastDay[] } {
  try {
    const current = JSON.parse(localStorage.getItem("weather_current") || "null");
    const forecast = JSON.parse(localStorage.getItem("weather_forecast") || "[]");
    return { current, forecast };
  } catch {
    return { current: null, forecast: [] };
  }
}

/** Convert raw API/network errors into user-friendly messages */
function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("No matching location") || msg.includes("1006")) return "City not found. Please try a different name.";
  if (msg.includes("Invalid API key") || msg.includes("2006") || msg.includes("2007")) return "Service configuration error. Please contact support.";
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Load failed")) return "Network error. Check your connection and try again.";
  if (msg.includes("AbortError") || msg.includes("aborted")) return "";   // cancelled — silent
  return "Unable to load weather data. Please try again.";
}

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [unit, setUnit] = useState<TemperatureUnit>(() => {
    try { return (localStorage.getItem("weather_unit") as TemperatureUnit) || "metric"; }
    catch { return "metric"; }
  });
  const [current, setCurrent] = useState<CurrentWeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem("weather_history") || "[]"); }
    catch { return []; }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<GraphTab>("temperature");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // AbortController ref — cancels in-flight requests when a new one starts
  const abortRef = useRef<AbortController | null>(null);
  // Store last params for retry
  const lastParamsRef = useRef<{ city?: string; lat?: number; lon?: number } | null>(null);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const toggleUnit = useCallback(() => {
    setUnit(prev => {
      const next = prev === "metric" ? "imperial" : "metric";
      localStorage.setItem("weather_unit", next);
      return next;
    });
  }, []);

  // Sync unit if changed on ForecastDetail page (StorageEvent)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "weather_unit" && (e.newValue === "metric" || e.newValue === "imperial")) {
        setUnit(e.newValue as TemperatureUnit);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const fetchWeather = useCallback(async (params: { city?: string; lat?: number; lon?: number }) => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    lastParamsRef.current = params;

    setIsLoading(true);
    setError(null);

    const cacheKey = getCacheKey(params);
    const cached = getCached(cacheKey);
    if (cached) {
      setCurrent(cached.current);
      setForecast(cached.forecast || []);
      setIsLoading(false);
      return;
    }

    if (!navigator.onLine) {
      const offline = loadOfflineData();
      if (offline.current) {
        setCurrent(offline.current);
        setForecast(offline.forecast);
        setError("You're offline — showing last saved data.");
      } else {
        setError("You're offline and no cached data is available.");
      }
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke("weather", {
        body: params,
      });

      // If this request was cancelled, ignore result silently
      if (abortRef.current?.signal.aborted) return;

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setCurrent(data.current);
      setForecast(data.forecast || []);
      setActiveTab("temperature"); // reset tab on new city load

      // Cap cache size — evict oldest entry when limit reached
      if (cache.size >= CACHE_MAX) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
      }
      cache.set(cacheKey, { data, timestamp: Date.now() });

      // Async localStorage writes (non-blocking)
      setTimeout(() => {
        try {
          localStorage.setItem("weather_forecast", JSON.stringify(data.forecast || []));
          localStorage.setItem("weather_city", data.current.city);
          localStorage.setItem("weather_current", JSON.stringify(data.current));
        } catch { /* quota exceeded — ignore */ }
      }, 0);

      const entry: SearchEntry = {
        city: data.current.city,
        lat: data.current.lat,
        lon: data.current.lon,
        timestamp: Date.now(),
      };
      setSearchHistory(prev => {
        const filtered = prev.filter(s => s.city.toLowerCase() !== entry.city.toLowerCase());
        const updated = [entry, ...filtered].slice(0, 8);
        setTimeout(() => {
          try { localStorage.setItem("weather_history", JSON.stringify(updated)); } catch { }
        }, 0);
        return updated;
      });

    } catch (err: unknown) {
      if (abortRef.current?.signal.aborted) return;
      const msg = friendlyError(err);
      if (!msg) return;

      const offline = loadOfflineData();
      if (offline.current) {
        setCurrent(offline.current);
        setForecast(offline.forecast);
        setError("Couldn't refresh data. Showing cached results.");
      } else {
        setError(msg);
      }
    } finally {
      if (!abortRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  const searchCity = useCallback((city: string) => {
    if (!city.trim()) return;
    fetchWeather({ city: city.trim() });
  }, [fetchWeather]);

  const searchByCoords = useCallback((lat: number, lon: number) => {
    fetchWeather({ lat, lon });
  }, [fetchWeather]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try { localStorage.removeItem("weather_history"); } catch { }
  }, []);

  const retryLastSearch = useCallback(() => {
    if (lastParamsRef.current) {
      fetchWeather(lastParamsRef.current);
    }
  }, [fetchWeather]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => fetchWeather({ city: "London" }),
        { enableHighAccuracy: false, timeout: 8000 }
      );
    } else {
      fetchWeather({ city: "London" });
    }
  }, [fetchWeather]);

  return (
    <WeatherContext.Provider
      value={{
        unit, current, forecast, searchHistory, isLoading, error,
        activeTab, isOffline, setActiveTab, toggleUnit,
        searchCity, searchByCoords, clearHistory, retryLastSearch,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error("useWeather must be used within WeatherProvider");
  return ctx;
}
