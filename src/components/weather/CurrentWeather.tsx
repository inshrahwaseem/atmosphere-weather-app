import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWeather } from "@/lib/weather-store";
import { convertTemp, tempSymbol, convertWind, windUnit, getWeatherIconUrl, formatLocalTime, getAqiLabel, getAqiColor } from "@/lib/weather-utils";
import { MapPin, Navigation, Droplets, Wind, Gauge, Sun, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getGlowColor(temp: number): string {
  if (temp < 0) return "hsl(var(--glow-cold))";
  if (temp <= 15) return "hsl(199, 70%, 40%)";
  if (temp <= 25) return "hsl(var(--glow-cool))";
  return "hsl(var(--glow-warm))";
}

export const CurrentWeather = memo(function CurrentWeather() {
  const { current, unit, isLoading, forecast, searchByCoords } = useWeather();

  if (isLoading) return <CurrentWeatherSkeleton />;
  if (!current) return <EmptyState />;

  const displayTemp = convertTemp(current.temp, unit);
  const displayFeels = convertTemp(current.feelsLike, unit);
  const sym = tempSymbol(unit);
  const todayForecast = forecast[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative surface-card p-6 md:p-8 overflow-hidden h-full"
    >
      {/* Atmospheric glow */}
      <div
        className="atmospheric-glow top-0 right-0"
        style={{ backgroundColor: getGlowColor(current.temp) }}
      />

      <div className="relative z-10">
        {/* Location */}
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-foreground">{current.city}</span>
          {current.region && (
            <span className="text-xs text-muted-foreground hidden sm:inline">{current.region},</span>
          )}
          <span className="text-xs text-muted-foreground">{current.country}</span>
          <button
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => searchByCoords(pos.coords.latitude, pos.coords.longitude),
                  () => {},
                  { enableHighAccuracy: false, timeout: 8000 }
                );
              }
            }}
            className="ml-auto p-1.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
            title="Use my location"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mb-5 font-mono">
          {formatLocalTime(current.localtime)}
        </p>

        {/* Main weather display */}
        <div className="flex items-center gap-6">
          <motion.img
            src={getWeatherIconUrl(current.condition.icon)}
            alt={current.condition.text}
            className="w-20 h-20 md:w-24 md:h-24 drop-shadow-xl"
            loading="lazy"
            width={96}
            height={96}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
          />
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${displayTemp}-${unit}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="flex items-baseline"
              >
                <span className="text-6xl md:text-7xl font-extralight tracking-[-0.04em] text-foreground leading-none">
                  {displayTemp.toFixed(0)}
                </span>
                <span className="text-xl text-muted-foreground/60 font-light ml-1">{sym}</span>
              </motion.div>
            </AnimatePresence>
            <p className="text-sm text-foreground/80 mt-2 font-medium">{current.condition.text}</p>

            {/* High/Low + Feels like */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {todayForecast && (
                <span className="font-mono text-xs">
                  H: {convertTemp(todayForecast.tempHigh, unit).toFixed(0)}{sym} · L: {convertTemp(todayForecast.tempLow, unit).toFixed(0)}{sym}
                </span>
              )}
              <span className="text-xs">Feels like {displayFeels.toFixed(0)}{sym}</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <QuickStat icon={<Droplets className="w-3.5 h-3.5 text-sky-400/70" />} label="Humidity" value={`${current.humidity}%`} />
          <QuickStat icon={<Wind className="w-3.5 h-3.5 text-green-400/70" />} label="Wind" value={`${convertWind(current.windSpeed, unit)} ${windUnit(unit)}`} />
          <QuickStat icon={<Gauge className="w-3.5 h-3.5 text-purple-400/70" />} label="Pressure" value={`${current.pressure} hPa`} />
          <QuickStat icon={<Sun className="w-3.5 h-3.5 text-yellow-400/70" />} label="UV Index" value={`${current.uvIndex}`} />
        </div>

        {/* Air Quality Badge (if available) */}
        {current.airQuality && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-3 flex items-center gap-2 bg-secondary/30 rounded-xl px-3 py-2"
          >
            <Activity className="w-3.5 h-3.5" style={{ color: getAqiColor(current.airQuality.usEpaIndex) }} />
            <span className="label-caps">Air Quality</span>
            <span className="text-xs font-semibold ml-1" style={{ color: getAqiColor(current.airQuality.usEpaIndex) }}>
              {getAqiLabel(current.airQuality.usEpaIndex)}
            </span>
            <span className="text-xs text-muted-foreground ml-auto font-mono">
              PM2.5: {current.airQuality.pm25.toFixed(1)}
            </span>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
});

function QuickStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-secondary/30 backdrop-blur-sm rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-secondary/50 group">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="label-caps">{label}</p>
      </div>
      <p className="text-sm font-mono text-foreground">{value}</p>
    </div>
  );
}

function CurrentWeatherSkeleton() {
  return (
    <div className="surface-card p-6 md:p-8 space-y-6 h-full shimmer">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-3.5 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex items-center gap-6">
        <Skeleton className="w-20 h-20 rounded-2xl" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-16 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="surface-card p-6 md:p-10 flex flex-col items-center justify-center min-h-[300px] text-center h-full">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-5xl mb-4"
      >
        🌤️
      </motion.div>
      <p className="text-2xl md:text-3xl font-light text-foreground mb-2">Atmospheric</p>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        Search for a city or allow location access to see real-time weather conditions.
      </p>
      <div className="mt-4 flex gap-2 text-xs text-muted-foreground/50">
        <span>🌡️ Temperature</span>
        <span>·</span>
        <span>💨 Wind</span>
        <span>·</span>
        <span>🌧️ Precipitation</span>
      </div>
    </div>
  );
}
