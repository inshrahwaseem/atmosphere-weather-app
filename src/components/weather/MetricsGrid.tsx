import { memo } from "react";
import { useWeather } from "@/lib/weather-store";
import { convertWind, windUnit, convertVisibility, visibilityUnit, getUvLabel, getAqiLabel, getAqiColor } from "@/lib/weather-utils";
import { Droplets, Wind, Eye, Gauge, Sun, Cloud, Sunrise, Sunset, Activity } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { Skeleton } from "@/components/ui/skeleton";

export const MetricsGrid = memo(function MetricsGrid() {
  const { current, unit, isLoading, forecast } = useWeather();

  if (!current && !isLoading) return null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2.5 h-full">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="surface-card p-4 shimmer">
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-5 w-14" />
          </div>
        ))}
      </div>
    );
  }

  if (!current) return null;

  const todayForecast = forecast[0];

  return (
    <div className="grid grid-cols-2 gap-2.5 h-full content-start">
      <MetricCard label="Humidity" value={current.humidity} unit="%" icon={<Droplets className="w-4 h-4" />} delay={0.08} />
      <MetricCard label="Wind" value={`${convertWind(current.windSpeed, unit)} ${windUnit(unit)}`} icon={<Wind className="w-4 h-4" />} delay={0.12} />
      <MetricCard label="Pressure" value={current.pressure} unit="hPa" icon={<Gauge className="w-4 h-4" />} delay={0.16} />
      <MetricCard label="UV Index" value={`${current.uvIndex} · ${getUvLabel(current.uvIndex)}`} icon={<Sun className="w-4 h-4" />} delay={0.20} />
      <MetricCard label="Visibility" value={convertVisibility(current.visibility, unit)} unit={visibilityUnit(unit)} icon={<Eye className="w-4 h-4" />} delay={0.24} />
      <MetricCard label="Cloud Cover" value={current.cloud} unit="%" icon={<Cloud className="w-4 h-4" />} delay={0.28} />
      {todayForecast && (
        <>
          <MetricCard label="Sunrise" value={todayForecast.sunrise} icon={<Sunrise className="w-4 h-4" />} delay={0.32} />
          <MetricCard label="Sunset" value={todayForecast.sunset} icon={<Sunset className="w-4 h-4" />} delay={0.36} />
        </>
      )}
      {current.airQuality && (
        <div
          className="surface-card p-4 flex flex-col gap-2.5 group col-span-2"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4" style={{ color: getAqiColor(current.airQuality.usEpaIndex) }} />
              <span className="label-caps">Air Quality</span>
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                color: getAqiColor(current.airQuality.usEpaIndex),
                backgroundColor: `${getAqiColor(current.airQuality.usEpaIndex)}20`,
              }}
            >
              {getAqiLabel(current.airQuality.usEpaIndex)}
            </span>
          </div>
          <div className="flex gap-3 text-xs font-mono text-muted-foreground">
            <span>PM2.5: <strong className="text-foreground">{current.airQuality.pm25.toFixed(1)}</strong></span>
            <span>PM10: <strong className="text-foreground">{current.airQuality.pm10.toFixed(1)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
});
