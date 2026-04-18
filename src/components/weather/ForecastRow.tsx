import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useWeather } from "@/lib/weather-store";
import { convertTemp, tempSymbol, getWeatherIconUrl } from "@/lib/weather-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, CloudRain } from "lucide-react";

export const ForecastRow = memo(function ForecastRow() {
  const { forecast, unit, isLoading, current } = useWeather();
  const navigate = useNavigate();

  if (!current && !isLoading) return null;

  if (isLoading) {
    return (
      <div className="surface-card p-5 shimmer">
        <Skeleton className="h-3 w-20 mb-4" />
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2.5 p-3">
              <Skeleton className="h-3 w-10 mx-auto" />
              <Skeleton className="h-9 w-9 rounded-full mx-auto" />
              <Skeleton className="h-4 w-14 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (forecast.length === 0) return null;

  const sym = tempSymbol(unit);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="surface-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="label-caps">{forecast.length}-Day Forecast</p>
        <span className="text-[10px] text-muted-foreground/50 hidden sm:flex items-center gap-1">
          Tap a day for details <ChevronRight className="w-3 h-3" />
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2.5">
        {forecast.map((day, i) => (
          <motion.button
            key={day.date}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 * i }}
            onClick={() => navigate(`/forecast/${day.date}`)}
            aria-label={`View forecast for ${i === 0 ? "Today" : day.dayName}, ${day.date}`}
            className="group bg-secondary/30 hover:bg-primary/5 backdrop-blur-sm rounded-2xl p-3.5 text-center space-y-2 transition-all duration-250 cursor-pointer hover:shadow-md active:scale-[0.96] border border-transparent hover:border-primary/20"
          >
            <p className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors duration-200">
              {i === 0 ? "Today" : day.dayName}
            </p>
            <motion.img
              src={getWeatherIconUrl(day.condition.icon)}
              alt={day.condition.text}
              className="w-10 h-10 mx-auto drop-shadow-sm group-hover:drop-shadow-lg transition-all duration-300"
              loading="lazy"
              width={40}
              height={40}
              whileHover={{ scale: 1.12, rotate: 3 }}
            />
            <div className="flex items-center justify-center gap-1.5 text-sm">
              <span className="font-mono font-semibold text-foreground">
                {convertTemp(day.tempHigh, unit).toFixed(0)}°
              </span>
              <span className="font-mono text-muted-foreground/60">
                {convertTemp(day.tempLow, unit).toFixed(0)}°
              </span>
            </div>
            {day.chanceOfRain > 0 && (
              <div className="flex items-center justify-center gap-0.5">
                <CloudRain className="w-2.5 h-2.5 text-primary/60" />
                <p className="text-[10px] text-primary/80 font-semibold">{day.chanceOfRain}%</p>
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
});
