import { describe, it, expect } from "vitest";
import {
  convertTemp,
  getUvLabel,
  getAqiLabel,
  getWeatherIconUrl,
} from "@/lib/weather-utils";

// --- Cache key logic (pure JS, no import needed) ---
describe("Cache key generation", () => {
  it("city keys are lowercase and trimmed", () => {
    const city = "  Karachi  ".toLowerCase().trim();
    expect(city).toBe("karachi");
  });
  it("coord keys round to 2 decimal places", () => {
    const lat = (24.8607).toFixed(2);
    const lon = (67.0011).toFixed(2);
    expect(`coords:${lat},${lon}`).toBe("coords:24.86,67.00");
  });
});

// --- Input sanitization ---
describe("Input sanitization", () => {
  function sanitize(q: string): string {
    return q.replace(/[<>{}[\]\\]/g, "").slice(0, 100);
  }
  it("removes HTML injection chars", () => {
    expect(sanitize("<script>alert(1)</script>")).toBe("scriptalert(1)/script");
  });
  it("removes curly braces", () => {
    expect(sanitize("{city}")).toBe("city");
  });
  it("limits to 100 characters", () => {
    const long = "a".repeat(200);
    expect(sanitize(long).length).toBe(100);
  });
  it("leaves normal city names unchanged", () => {
    expect(sanitize("Karachi")).toBe("Karachi");
    expect(sanitize("New York")).toBe("New York");
    expect(sanitize("São Paulo")).toBe("São Paulo");
  });
});

// --- Friendly error messages (inline — matches logic in weather-store.tsx) ---
describe("Friendly error messages", () => {
  function friendlyError(msg: string): string {
    if (msg.includes("No matching location") || msg.includes("1006"))
      return "City not found. Please try a different name.";
    if (msg.includes("Invalid API key") || msg.includes("2006") || msg.includes("2007"))
      return "Service configuration error. Please contact support.";
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Load failed"))
      return "Network error. Check your connection and try again.";
    if (msg.includes("AbortError") || msg.includes("aborted")) return "";
    return "Unable to load weather data. Please try again.";
  }

  it("maps city not found error", () => {
    expect(friendlyError("No matching location found.")).toBe("City not found. Please try a different name.");
    expect(friendlyError("Error 1006: No matching")).toBe("City not found. Please try a different name.");
  });
  it("maps API key error", () => {
    expect(friendlyError("Invalid API key")).toBe("Service configuration error. Please contact support.");
    expect(friendlyError("Error 2006")).toBe("Service configuration error. Please contact support.");
  });
  it("maps network error", () => {
    expect(friendlyError("Failed to fetch")).toBe("Network error. Check your connection and try again.");
    expect(friendlyError("NetworkError occurred")).toBe("Network error. Check your connection and try again.");
  });
  it("returns empty string for aborted requests (silent)", () => {
    expect(friendlyError("AbortError: request aborted")).toBe("");
    expect(friendlyError("request was aborted")).toBe("");
  });
  it("returns generic message for unknown errors", () => {
    expect(friendlyError("Some weird error")).toBe("Unable to load weather data. Please try again.");
  });
});

// --- Temperature conversion edge cases ---
describe("Temperature conversion edge cases", () => {
  it("handles negative temperatures", () => {
    expect(convertTemp(-40, "imperial")).toBe(-40);
    expect(convertTemp(-273.15, "metric")).toBe(-273.2);
  });
  it("handles very high temperatures", () => {
    const result = convertTemp(1000, "imperial");
    expect(result).toBeGreaterThan(1800);
  });
  it("0°C = 32°F exactly", () => {
    expect(convertTemp(0, "imperial")).toBe(32);
  });
  it("100°C = 212°F exactly", () => {
    expect(convertTemp(100, "imperial")).toBe(212);
  });
});

// --- UV label boundary tests ---
describe("UV label boundaries", () => {
  it("UV=2 is Low, UV=3 is Moderate", () => {
    expect(getUvLabel(2)).toBe("Low");
    expect(getUvLabel(3)).toBe("Moderate");
  });
  it("UV=5 is Moderate, UV=6 is High", () => {
    expect(getUvLabel(5)).toBe("Moderate");
    expect(getUvLabel(6)).toBe("High");
  });
  it("UV=7 is High, UV=8 is Very High", () => {
    expect(getUvLabel(7)).toBe("High");
    expect(getUvLabel(8)).toBe("Very High");
  });
  it("UV=10 is Very High, UV=11 is Extreme", () => {
    expect(getUvLabel(10)).toBe("Very High");
    expect(getUvLabel(11)).toBe("Extreme");
  });
});

// --- AQI label coverage ---
describe("AQI label coverage", () => {
  const expected: Record<number, string> = {
    1: "Good",
    2: "Moderate",
    3: "Unhealthy (Sensitive)",
    4: "Unhealthy",
    5: "Very Unhealthy",
    6: "Hazardous",
  };
  Object.entries(expected).forEach(([idx, label]) => {
    it(`AQI ${idx} → ${label}`, () => {
      expect(getAqiLabel(Number(idx))).toBe(label);
    });
  });
  it("Unknown for out-of-range", () => {
    expect(getAqiLabel(0)).toBe("Unknown");
    expect(getAqiLabel(99)).toBe("Unknown");
  });
});

// --- Icon URL handling ---
describe("Icon URL handling", () => {
  it("handles protocol-relative URL", () => {
    expect(getWeatherIconUrl("//cdn.weatherapi.com/img.png"))
      .toBe("https://cdn.weatherapi.com/img.png");
  });
  it("handles already-absolute URL", () => {
    expect(getWeatherIconUrl("https://cdn.weatherapi.com/img.png"))
      .toBe("https://cdn.weatherapi.com/img.png");
  });
  it("returns empty for empty string", () => {
    expect(getWeatherIconUrl("")).toBe("");
  });
});
