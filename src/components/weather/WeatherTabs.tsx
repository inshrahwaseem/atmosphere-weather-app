import { memo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWeather } from "@/lib/weather-store";
import { HourlyGraph } from "./HourlyGraph";
import { Thermometer, CloudRain, Wind } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import type { GraphTab } from "@/lib/weather-types";

export const WeatherTabs = memo(function WeatherTabs() {
  const { forecast, unit, isLoading, activeTab, setActiveTab } = useWeather();

  if (isLoading) {
    return (
      <div className="surface-card p-5 md:p-6 shimmer">
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-3 w-24" />
          <div className="flex gap-1">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-24 rounded-md" />)}
          </div>
        </div>
        <Skeleton className="h-[240px] rounded-xl" />
      </div>
    );
  }

  const todayHourly = forecast[0]?.hourly || [];
  if (!todayHourly.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="surface-card p-5 md:p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <p className="label-caps">Today's Hourly</p>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GraphTab)}>
          <TabsList className="bg-secondary/40 backdrop-blur-sm h-9 rounded-xl p-1 border border-border/30">
            <TabsTrigger value="temperature" className="text-xs gap-1.5 h-7 px-3 rounded-lg data-[state=active]:shadow-sm">
              <Thermometer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Temperature</span>
            </TabsTrigger>
            <TabsTrigger value="precipitation" className="text-xs gap-1.5 h-7 px-3 rounded-lg data-[state=active]:shadow-sm">
              <CloudRain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Precipitation</span>
            </TabsTrigger>
            <TabsTrigger value="wind" className="text-xs gap-1.5 h-7 px-3 rounded-lg data-[state=active]:shadow-sm">
              <Wind className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wind</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <HourlyGraph hourly={todayHourly} unit={unit} activeTab={activeTab} />
    </motion.div>
  );
});
