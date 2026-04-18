import { memo, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { HourlyData, TemperatureUnit, GraphTab } from "@/lib/weather-types";
import {
  convertTemp, tempSymbol, convertWind, windUnit,
  convertPrecip, precipUnit, convertVisibility, visibilityUnit,
  getWeatherIconUrl,
} from "@/lib/weather-utils";
import { Thermometer, Wind, Droplets, Eye, Gauge, Cloud } from "lucide-react";

interface Props {
  hourly: HourlyData[];
  unit: TemperatureUnit;
  activeTab: GraphTab;
}

const TAB_CONFIG: Record<GraphTab, {
  color: string;
  fillId: string;
  label: (u: TemperatureUnit) => string;
  getValue: (h: HourlyData, u: TemperatureUnit) => number;
}> = {
  temperature: {
    color: "hsl(199, 89%, 48%)",
    fillId: "tempGradient",
    label: (u) => tempSymbol(u),
    getValue: (h, u) => Number(convertTemp(h.temp, u).toFixed(1)),
  },
  precipitation: {
    color: "hsl(210, 80%, 55%)",
    fillId: "precipGradient",
    label: (u) => precipUnit(u),
    getValue: (h, u) => Number(convertPrecip(h.precip, u).toFixed(2)),
  },
  wind: {
    color: "hsl(160, 60%, 45%)",
    fillId: "windGradient",
    label: (u) => windUnit(u),
    getValue: (h, u) => Number(convertWind(h.windSpeed, u).toFixed(1)),
  },
};

interface ChartDataPoint {
  time: string;
  value: number;
  hourData: HourlyData;
  index: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint; unit?: string }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  const h = point.hourData;
  return (
    <div className="glass-dropdown rounded-xl px-3.5 py-2.5 space-y-1.5 min-w-[130px]">
      <div className="flex items-center gap-2">
        <img src={getWeatherIconUrl(h.condition.icon)} alt="" className="w-7 h-7 drop-shadow-sm" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            {point.value}{payload[0].unit}
          </p>
          <p className="text-[10px] text-muted-foreground">{point.time}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground/80 border-t border-border/30 pt-1.5">
        {h.condition.text}
      </p>
    </div>
  );
}

// All getValue functions now have consistent (h, u) signature — unit is used where relevant
const DETAIL_ITEMS: Array<{
  key: string;
  label: string;
  icon: React.ReactNode;
  getValue: (h: HourlyData, u: TemperatureUnit) => string;
}> = [
  {
    key: "temp",
    label: "Temperature",
    icon: <Thermometer className="w-3.5 h-3.5" />,
    getValue: (h, u) => `${convertTemp(h.temp, u).toFixed(1)}${tempSymbol(u)}`,
  },
  {
    key: "feels",
    label: "Feels Like",
    icon: <Thermometer className="w-3.5 h-3.5 text-orange-400" />,
    getValue: (h, u) => `${convertTemp(h.feelsLike, u).toFixed(1)}${tempSymbol(u)}`,
  },
  {
    key: "wind",
    label: "Wind",
    icon: <Wind className="w-3.5 h-3.5 text-green-400" />,
    getValue: (h, u) => `${convertWind(h.windSpeed, u)} ${windUnit(u)} ${h.windDir}`,
  },
  {
    key: "humidity",
    label: "Humidity",
    icon: <Droplets className="w-3.5 h-3.5 text-sky-400" />,
    getValue: (h, _u) => `${h.humidity}%`,
  },
  {
    key: "rain",
    label: "Rain Chance",
    icon: <Droplets className="w-3.5 h-3.5 text-blue-400" />,
    getValue: (h, _u) => `${h.chanceOfRain}%`,
  },
  {
    key: "pressure",
    label: "Pressure",
    icon: <Gauge className="w-3.5 h-3.5 text-purple-400" />,
    getValue: (h, _u) => `${h.pressure} hPa`,
  },
  {
    key: "visibility",
    label: "Visibility",
    icon: <Eye className="w-3.5 h-3.5 text-teal-400" />,
    // ✅ FIXED: was hardcoded "km" — now respects imperial unit
    getValue: (h, u) => `${convertVisibility(h.visibility, u)} ${visibilityUnit(u)}`,
  },
  {
    key: "cloud",
    label: "Cloud Cover",
    icon: <Cloud className="w-3.5 h-3.5 text-slate-400" />,
    getValue: (h, _u) => `${h.cloud}%`,
  },
];

interface ChartClickData {
  activePayload?: Array<{ payload: ChartDataPoint }>;
}

export const HourlyGraph = memo(function HourlyGraph({ hourly, unit, activeTab }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const config = TAB_CONFIG[activeTab];

  const handleClick = useCallback((data: ChartClickData) => {
    if (data?.activePayload?.[0]) {
      const idx = data.activePayload[0].payload.index;
      setSelectedIndex((prev) => (prev === idx ? null : idx));
    }
  }, []);

  const chartData = useMemo<ChartDataPoint[]>(
    () =>
      hourly.map((h, index) => ({
        time: h.time.slice(0, 5),
        value: config.getValue(h, unit),
        hourData: h,
        index,
      })),
    [hourly, unit, activeTab, config]
  );

  if (!hourly.length) return null;

  const unitLabel = config.label(unit);
  const color = config.color;
  const selected = selectedIndex !== null ? hourly[selectedIndex] : null;
  const currentHour = `${String(new Date().getHours()).padStart(2, "0")}:00`;

  return (
    <div className="space-y-4">
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            onClick={handleClick}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            style={{ cursor: "pointer" }}
          >
            <defs>
              <linearGradient id={config.fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="60%" stopColor={color} stopOpacity={0.05} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeOpacity={0.25}
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))", strokeOpacity: 0.3 }}
              interval={2}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
              tickLine={false}
              axisLine={false}
              unit={unitLabel}
              width={60}
            />
            <ReferenceLine
              x={currentHour}
              stroke={color}
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{ value: "Now", fill: color, fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: color, strokeDasharray: "4 4", strokeOpacity: 0.3 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#${config.fillId})`}
              unit={unitLabel}
              dot={false}
              activeDot={{ r: 6, fill: color, stroke: "hsl(var(--card))", strokeWidth: 3 }}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {selectedIndex === null && (
        <p className="text-center text-[10px] text-muted-foreground/40 tracking-wider">
          ↑ tap any point for detailed hourly breakdown
        </p>
      )}

      <AnimatePresence mode="wait">
        {selected && selectedIndex !== null && (
          <motion.div
            key={selectedIndex}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-3 px-1 pb-3 border-b border-border/20">
              <img
                src={getWeatherIconUrl(selected.condition.icon)}
                alt={selected.condition.text}
                className="w-9 h-9 drop-shadow-md"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {selected.time} — {selected.condition.text}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selected.isDay ? "Daytime" : "Nighttime"} · {selected.chanceOfRain}% rain chance
                </p>
              </div>
              <button
                onClick={() => setSelectedIndex(null)}
                aria-label="Close detail panel"
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors px-2 py-1 rounded-lg hover:bg-secondary/40"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DETAIL_ITEMS.map((item, i) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.03 * i }}
                  className="bg-secondary/30 backdrop-blur-sm rounded-xl p-3 hover:bg-secondary/50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity">
                      {item.icon}
                    </span>
                    <p className="label-caps">{item.label}</p>
                  </div>
                  <p className="text-sm font-mono font-medium text-foreground">
                    {item.getValue(selected, unit)}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
