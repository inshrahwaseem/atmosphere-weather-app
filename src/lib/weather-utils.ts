import type { TemperatureUnit } from "./weather-types";

/**
 * Convert temperature from Celsius to the target unit.
 * @param tempC - Temperature in Celsius
 * @param unit - Target unit ("metric" = °C, "imperial" = °F)
 * @returns Converted temperature rounded to 1 decimal place
 */
export function convertTemp(tempC: number, unit: TemperatureUnit): number {
  if (unit === "imperial") return Math.round((tempC * 9 / 5 + 32) * 10) / 10;
  return Math.round(tempC * 10) / 10;
}

/** Returns the temperature symbol for the given unit (°C or °F) */
export function tempSymbol(unit: TemperatureUnit): string {
  return unit === "metric" ? "°C" : "°F";
}

/**
 * Convert a wind degree to a compass direction string.
 * @param deg - Wind direction in degrees (0–360)
 * @returns Cardinal direction abbreviation (N, NE, E, SE, S, SW, W, NW)
 */
export function windDirection(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

/** Returns the wind speed unit label for the given unit */
export function windUnit(unit: TemperatureUnit): string {
  return unit === "metric" ? "km/h" : "mph";
}

/**
 * Convert wind speed from km/h to the target unit.
 * @param speedKph - Wind speed in km/h
 * @param unit - Target unit
 * @returns Converted speed rounded to 1 decimal place
 */
export function convertWind(speedKph: number, unit: TemperatureUnit): number {
  if (unit === "imperial") return Math.round(speedKph * 0.6214 * 10) / 10;
  return Math.round(speedKph * 10) / 10;
}

/** Returns the precipitation unit label (mm or in) */
export function precipUnit(unit: TemperatureUnit): string {
  return unit === "metric" ? "mm" : "in";
}

/**
 * Convert precipitation from mm to the target unit.
 * @param mm - Precipitation in millimeters
 * @param unit - Target unit
 */
export function convertPrecip(mm: number, unit: TemperatureUnit): number {
  if (unit === "imperial") return Math.round(mm * 0.03937 * 100) / 100;
  return Math.round(mm * 10) / 10;
}

/**
 * Normalize a WeatherAPI icon URL to always use https.
 * WeatherAPI returns protocol-relative URLs like "//cdn.weatherapi.com/..."
 * @param iconPath - Raw icon path from API
 * @returns Absolute HTTPS URL, or empty string if input is empty
 */
export function getWeatherIconUrl(iconPath: string): string {
  if (!iconPath) return "";
  return iconPath.startsWith("//") ? `https:${iconPath}` : iconPath;
}

/**
 * Returns a human-readable UV index label.
 * Based on WHO UV index scale.
 */
export function getUvLabel(uv: number): string {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

/**
 * Returns a human-readable air quality label.
 * Based on US EPA AQI index (1–6 scale from WeatherAPI).
 */
export function getAqiLabel(index: number): string {
  const labels: Record<number, string> = {
    1: "Good", 2: "Moderate", 3: "Unhealthy (Sensitive)",
    4: "Unhealthy", 5: "Very Unhealthy", 6: "Hazardous",
  };
  return labels[index] ?? "Unknown";
}

/**
 * Returns a hex color for the given EPA AQI index.
 * Colors match the standard US EPA AQI color scale.
 */
export function getAqiColor(index: number): string {
  const colors: Record<number, string> = {
    1: "#00e400", 2: "#ffff00", 3: "#ff7e00",
    4: "#ff0000", 5: "#8f3f97", 6: "#7e0023",
  };
  return colors[index] ?? "#888";
}

/** Convert visibility from km to the target unit */
export function convertVisibility(km: number, unit: TemperatureUnit): number {
  if (unit === "imperial") return Math.round(km * 0.6214 * 10) / 10;
  return Math.round(km * 10) / 10;
}

/** Returns the visibility unit label (km or mi) */
export function visibilityUnit(unit: TemperatureUnit): string {
  return unit === "metric" ? "km" : "mi";
}

/**
 * Format a WeatherAPI localtime string into a readable date/time.
 * @param localtime - WeatherAPI localtime format: "2024-03-15 14:30"
 * @returns Formatted string like "Fri, Mar 15, 2:30 PM"
 */
export function formatLocalTime(localtime: string): string {
  try {
    const date = new Date(localtime.replace(" ", "T"));
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return localtime;
  }
}

/**
 * Get a Tailwind gradient class based on weather condition and time of day.
 * Used for dynamic background theming.
 * @param conditionCode - WeatherAPI condition code
 * @param isDay - Whether it is currently daytime
 */
export function getWeatherGradient(conditionCode: number, isDay: boolean): string {
  if (!isDay) return "from-slate-900 via-blue-950 to-slate-900";
  if (conditionCode === 1000) return "from-sky-400 via-blue-500 to-indigo-600";
  if (conditionCode <= 1003) return "from-sky-300 via-blue-400 to-blue-500";
  if (conditionCode <= 1030) return "from-slate-400 via-slate-500 to-slate-600";
  if (conditionCode <= 1117) return "from-slate-600 via-blue-700 to-slate-800";
  if (conditionCode <= 1201) return "from-blue-600 via-blue-700 to-slate-700";
  if (conditionCode <= 1282) return "from-slate-700 via-yellow-800 to-slate-900";
  return "from-sky-400 via-blue-500 to-indigo-600";
}
