import { memo } from "react";
import { motion } from "framer-motion";
import { useWeather } from "@/lib/weather-store";

export const UnitToggle = memo(function UnitToggle() {
  const { unit, toggleUnit } = useWeather();
  const isMetric = unit === "metric";

  return (
    <button
      onClick={toggleUnit}
      className="relative flex items-center glass-input rounded-xl p-0.5 text-xs font-semibold"
      aria-label={`Switch to ${isMetric ? "Fahrenheit" : "Celsius"}`}
    >
      <motion.div
        className="absolute top-0.5 bottom-0.5 w-8 bg-primary rounded-lg shadow-sm"
        animate={{ x: isMetric ? 2 : 34 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
      />
      <span className={`relative z-10 w-8 py-1.5 text-center transition-colors duration-200 ${isMetric ? "text-primary-foreground" : "text-muted-foreground"}`}>
        °C
      </span>
      <span className={`relative z-10 w-8 py-1.5 text-center transition-colors duration-200 ${!isMetric ? "text-primary-foreground" : "text-muted-foreground"}`}>
        °F
      </span>
    </button>
  );
});
