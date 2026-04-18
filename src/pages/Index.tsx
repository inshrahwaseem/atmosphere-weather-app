import { WeatherProvider, useWeather } from "@/lib/weather-store";
import { SearchBar } from "@/components/weather/SearchBar";
import { UnitToggle } from "@/components/weather/UnitToggle";
import { ThemeToggle } from "@/components/weather/ThemeToggle";
import { FavoriteButton, FavoritesBar } from "@/components/weather/FavoriteLocations";
import { CurrentWeather } from "@/components/weather/CurrentWeather";
import { MetricsGrid } from "@/components/weather/MetricsGrid";
import { ForecastRow } from "@/components/weather/ForecastRow";
import { WeatherTabs } from "@/components/weather/WeatherTabs";
import { WifiOff, CloudSun, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

function WeatherDashboard() {
  const { error, isOffline, retryLastSearch } = useWeather();

  const handleRetry = () => {
    retryLastSearch();
    toast("Refreshing weather data...");
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-400">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <h1 className="text-base font-bold text-foreground tracking-tight shrink-0 flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-primary" />
            <span className="hidden sm:inline bg-gradient-to-r from-primary to-[hsl(220,70%,55%)] bg-clip-text text-transparent">
              Atmospheric
            </span>
          </h1>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <SearchBar />
            <FavoriteButton />
            <UnitToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Offline banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-yellow-500/10 backdrop-blur-lg border-b border-yellow-500/20 overflow-hidden"
          >
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-2 flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              You're offline — showing cached data.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner with retry */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-6xl mx-auto px-4 md:px-6 pt-4 overflow-hidden"
          >
            <div className="surface-card bg-destructive/5 border-destructive/20 px-4 py-2.5 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive font-medium flex-1">{error}</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 text-xs text-destructive/80 hover:text-destructive border border-destructive/30 rounded-lg px-2.5 py-1.5 transition-all hover:bg-destructive/10"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">
        <FavoritesBar />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><CurrentWeather /></div>
          <div className="lg:col-span-1"><MetricsGrid /></div>
        </div>
        <WeatherTabs />
        <ForecastRow />
      </main>

      <footer className="border-t border-border/20 py-6 mt-4">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <p className="text-xs text-muted-foreground/40 text-center tracking-wide">
            Powered by WeatherAPI · Built with Atmospheric
          </p>
        </div>
      </footer>
    </div>
  );
}

const Index = () => (
  <WeatherProvider>
    <WeatherDashboard />
  </WeatherProvider>
);

export default Index;
