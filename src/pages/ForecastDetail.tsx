import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import type { ForecastDay, TemperatureUnit, GraphTab } from "@/lib/weather-types";
import { convertTemp, tempSymbol, convertWind, windUnit, convertPrecip, precipUnit, getWeatherIconUrl, getUvLabel } from "@/lib/weather-utils";
import { HourlyGraph } from "@/components/weather/HourlyGraph";
import { ThemeToggle } from "@/components/weather/ThemeToggle";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Droplets, Wind, Thermometer, CloudRain, Sun, Sunrise, Sunset, Eye, Moon, Gauge, Cloud, Snowflake } from "lucide-react";
import { motion } from "framer-motion";

export default function ForecastDetail() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [unit, setUnit] = useState<TemperatureUnit>("metric");
  const [day, setDay] = useState<ForecastDay | null>(null);
  const [cityName, setCityName] = useState("");
  const [activeTab, setActiveTab] = useState<GraphTab>("temperature");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("weather_forecast");
      const cityStored = localStorage.getItem("weather_city");
      if (stored) {
        const forecast: ForecastDay[] = JSON.parse(stored);
        const found = forecast.find(f => f.date === date);
        setDay(found || null);
      }
      if (cityStored) setCityName(cityStored);
    } catch {}

    try {
      const unitStored = localStorage.getItem("weather_unit");
      if (unitStored === "imperial") setUnit("imperial");
    } catch {}
  }, [date]);

  const sym = tempSymbol(unit);

  const toggleUnit = () => {
    setUnit(prev => {
      const next = prev === "metric" ? "imperial" : "metric";
      localStorage.setItem("weather_unit", next);
      // Dispatch storage event so main dashboard syncs when user goes back
      window.dispatchEvent(new StorageEvent("storage", { key: "weather_unit", newValue: next }));
      return next;
    });
  };

  if (!day) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center transition-colors">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="text-4xl mb-2">📅</div>
          <p className="text-muted-foreground">Forecast not found for {date}</p>
          <button onClick={() => navigate("/")} className="text-primary hover:underline text-sm font-medium">
            ← Back to dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  const metrics = [
    { icon: <Droplets className="w-4 h-4 text-sky-400" />, label: "Humidity", value: `${day.avgHumidity}%` },
    { icon: <Wind className="w-4 h-4 text-green-400" />, label: "Max Wind", value: `${convertWind(day.maxWind, unit)} ${windUnit(unit)}` },
    { icon: <CloudRain className="w-4 h-4 text-blue-400" />, label: "Precipitation", value: `${convertPrecip(day.totalPrecip, unit)} ${precipUnit(unit)}` },
    { icon: <Sun className="w-4 h-4 text-yellow-400" />, label: "UV Index", value: `${day.uvIndex} · ${getUvLabel(day.uvIndex)}` },
    { icon: <Thermometer className="w-4 h-4 text-orange-400" />, label: "Avg Temp", value: `${convertTemp(day.avgTemp, unit).toFixed(0)}${sym}` },
    { icon: <CloudRain className="w-4 h-4 text-indigo-400" />, label: "Rain Chance", value: `${day.chanceOfRain}%` },
    { icon: <Snowflake className="w-4 h-4 text-cyan-400" />, label: "Snow Chance", value: `${day.chanceOfSnow}%` },
    { icon: <Sunrise className="w-4 h-4 text-amber-400" />, label: "Sunrise", value: day.sunrise },
    { icon: <Sunset className="w-4 h-4 text-rose-400" />, label: "Sunset", value: day.sunset },
    { icon: <Moon className="w-4 h-4 text-violet-400" />, label: "Moon Phase", value: day.moonPhase },
  ];

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header className="border-b border-border/40 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-secondary/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm md:text-base font-bold text-foreground truncate">
              {cityName ? `${cityName} — ` : ""}{day.dayName}, {day.date}
            </h1>
          </div>
          <button
            onClick={toggleUnit}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground border border-border/60 rounded-xl px-3 py-1.5 transition-all hover:bg-secondary/50"
          >
            {unit === "metric" ? "°C → °F" : "°F → °C"}
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">
        {/* Day overview hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="surface-card p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 relative overflow-hidden"
        >
          <div className="atmospheric-glow top-0 right-0" style={{ backgroundColor: "hsl(199, 70%, 50%)", opacity: 0.1 }} />
          <motion.img
            src={getWeatherIconUrl(day.condition.icon)}
            alt={day.condition.text}
            className="w-24 h-24 drop-shadow-lg"
            loading="lazy"
            width={96}
            height={96}
            whileHover={{ scale: 1.05, rotate: 2 }}
          />
          <div className="flex-1">
            <p className="text-5xl md:text-6xl font-extralight text-foreground leading-none">
              {convertTemp(day.tempHigh, unit).toFixed(0)}{sym}
              <span className="text-2xl text-muted-foreground ml-3">
                / {convertTemp(day.tempLow, unit).toFixed(0)}{sym}
              </span>
            </p>
            <p className="text-sm text-foreground/80 mt-2 font-medium">{day.condition.text}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {convertTemp(day.avgTemp, unit).toFixed(0)}{sym} · {day.chanceOfRain}% rain chance
            </p>
          </div>
        </motion.div>

        {/* Metrics grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3"
        >
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.03 }}
              className="surface-card p-4 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="opacity-70 group-hover:opacity-100 transition-opacity">{m.icon}</span>
                <span className="label-caps">{m.label}</span>
              </div>
              <p className="text-base font-mono font-medium text-foreground">{m.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Hourly graph with tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="surface-card p-5 md:p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <p className="label-caps">Hourly Breakdown</p>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GraphTab)}>
              <TabsList className="bg-secondary/60 h-9 rounded-xl p-1">
                <TabsTrigger value="temperature" className="text-xs gap-1.5 h-7 px-3 rounded-lg">
                  <Thermometer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Temp</span>
                </TabsTrigger>
                <TabsTrigger value="precipitation" className="text-xs gap-1.5 h-7 px-3 rounded-lg">
                  <CloudRain className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Rain</span>
                </TabsTrigger>
                <TabsTrigger value="wind" className="text-xs gap-1.5 h-7 px-3 rounded-lg">
                  <Wind className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Wind</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <HourlyGraph hourly={day.hourly || []} unit={unit} activeTab={activeTab} />
        </motion.div>
      </main>
    </div>
  );
}
