import { describe, it, expect } from "vitest";
import {
  convertTemp,
  tempSymbol,
  convertWind,
  windUnit,
  convertPrecip,
  precipUnit,
  convertVisibility,
  visibilityUnit,
  getUvLabel,
  getAqiLabel,
  getAqiColor,
  getWeatherIconUrl,
  formatLocalTime,
  windDirection,
} from "@/lib/weather-utils";

describe("convertTemp", () => {
  it("returns Celsius unchanged in metric", () => {
    expect(convertTemp(25, "metric")).toBe(25);
    expect(convertTemp(0, "metric")).toBe(0);
    expect(convertTemp(-10, "metric")).toBe(-10);
  });
  it("converts Celsius to Fahrenheit in imperial", () => {
    expect(convertTemp(0, "imperial")).toBe(32);
    expect(convertTemp(100, "imperial")).toBe(212);
    expect(convertTemp(-40, "imperial")).toBe(-40);
    expect(convertTemp(37, "imperial")).toBe(98.6);
  });
});

describe("tempSymbol", () => {
  it("returns °C for metric", () => expect(tempSymbol("metric")).toBe("°C"));
  it("returns °F for imperial", () => expect(tempSymbol("imperial")).toBe("°F"));
});

describe("convertWind", () => {
  it("returns kph unchanged in metric", () => {
    expect(convertWind(100, "metric")).toBe(100);
  });
  it("converts kph to mph in imperial", () => {
    expect(convertWind(100, "imperial")).toBe(62.1);
    expect(convertWind(0, "imperial")).toBe(0);
  });
});

describe("windUnit", () => {
  it("returns km/h for metric", () => expect(windUnit("metric")).toBe("km/h"));
  it("returns mph for imperial", () => expect(windUnit("imperial")).toBe("mph"));
});

describe("convertPrecip", () => {
  it("returns mm unchanged in metric", () => expect(convertPrecip(10, "metric")).toBe(10));
  it("converts mm to inches in imperial", () => {
    expect(convertPrecip(25.4, "imperial")).toBe(1);
  });
});

describe("precipUnit", () => {
  it("returns mm for metric", () => expect(precipUnit("metric")).toBe("mm"));
  it("returns in for imperial", () => expect(precipUnit("imperial")).toBe("in"));
});

describe("convertVisibility", () => {
  it("returns km unchanged in metric", () => expect(convertVisibility(10, "metric")).toBe(10));
  it("converts km to miles in imperial", () => {
    expect(convertVisibility(10, "imperial")).toBe(6.2);
  });
});

describe("visibilityUnit", () => {
  it("returns km for metric", () => expect(visibilityUnit("metric")).toBe("km"));
  it("returns mi for imperial", () => expect(visibilityUnit("imperial")).toBe("mi"));
});

describe("getUvLabel", () => {
  it("returns Low for UV 0-2", () => {
    expect(getUvLabel(0)).toBe("Low");
    expect(getUvLabel(2)).toBe("Low");
  });
  it("returns Moderate for UV 3-5", () => {
    expect(getUvLabel(3)).toBe("Moderate");
    expect(getUvLabel(5)).toBe("Moderate");
  });
  it("returns High for UV 6-7", () => {
    expect(getUvLabel(6)).toBe("High");
    expect(getUvLabel(7)).toBe("High");
  });
  it("returns Very High for UV 8-10", () => {
    expect(getUvLabel(8)).toBe("Very High");
    expect(getUvLabel(10)).toBe("Very High");
  });
  it("returns Extreme for UV 11+", () => {
    expect(getUvLabel(11)).toBe("Extreme");
    expect(getUvLabel(20)).toBe("Extreme");
  });
});

describe("getAqiLabel", () => {
  it("returns correct label for each AQI index", () => {
    expect(getAqiLabel(1)).toBe("Good");
    expect(getAqiLabel(2)).toBe("Moderate");
    expect(getAqiLabel(3)).toBe("Unhealthy (Sensitive)");
    expect(getAqiLabel(4)).toBe("Unhealthy");
    expect(getAqiLabel(5)).toBe("Very Unhealthy");
    expect(getAqiLabel(6)).toBe("Hazardous");
  });
  it("returns Unknown for out-of-range index", () => {
    expect(getAqiLabel(0)).toBe("Unknown");
    expect(getAqiLabel(99)).toBe("Unknown");
  });
});

describe("getAqiColor", () => {
  it("returns a color string for valid indices", () => {
    const color = getAqiColor(1);
    expect(typeof color).toBe("string");
    expect(color.startsWith("#")).toBe(true);
  });
  it("returns fallback for invalid index", () => {
    expect(getAqiColor(0)).toBe("#888");
    expect(getAqiColor(99)).toBe("#888");
  });
});

describe("getWeatherIconUrl", () => {
  it("prepends https: to protocol-relative URLs", () => {
    expect(getWeatherIconUrl("//cdn.weatherapi.com/icon.png")).toBe("https://cdn.weatherapi.com/icon.png");
  });
  it("leaves https URLs unchanged", () => {
    expect(getWeatherIconUrl("https://cdn.weatherapi.com/icon.png")).toBe("https://cdn.weatherapi.com/icon.png");
  });
  it("returns empty string for empty input", () => {
    expect(getWeatherIconUrl("")).toBe("");
  });
});

describe("windDirection", () => {
  it("returns correct cardinal directions", () => {
    expect(windDirection(0)).toBe("N");
    expect(windDirection(90)).toBe("E");
    expect(windDirection(180)).toBe("S");
    expect(windDirection(270)).toBe("W");
    expect(windDirection(45)).toBe("NE");
    expect(windDirection(135)).toBe("SE");
    expect(windDirection(225)).toBe("SW");
    expect(windDirection(315)).toBe("NW");
  });
});

describe("formatLocalTime", () => {
  it("returns a non-empty string for valid localtime", () => {
    const result = formatLocalTime("2024-03-15 14:30");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
  it("falls back to original string on invalid input", () => {
    const invalid = "not-a-date";
    const result = formatLocalTime(invalid);
    expect(typeof result).toBe("string");
  });
});
