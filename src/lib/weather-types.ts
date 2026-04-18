export type TemperatureUnit = "metric" | "imperial";

export interface WeatherCondition {
  text: string;
  icon: string;
  code: number;
}

export interface AirQuality {
  pm25: number;
  pm10: number;
  usEpaIndex: number;
}

export interface CurrentWeatherData {
  city: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
  localtime: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDir: string;
  windDeg: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  cloud: number;
  precip: number;
  condition: WeatherCondition;
  airQuality: AirQuality | null;
  isDay: boolean;
}

export interface HourlyData {
  time: string;
  epoch: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDir: string;
  windDeg: number;
  pressure: number;
  precip: number;
  chanceOfRain: number;
  cloud: number;
  visibility: number;
  uvIndex: number;
  isDay: boolean;
  condition: WeatherCondition;
}

export interface ForecastDay {
  date: string;
  dayName: string;
  tempHigh: number;
  tempLow: number;
  avgTemp: number;
  maxWind: number;
  totalPrecip: number;
  avgHumidity: number;
  chanceOfRain: number;
  chanceOfSnow: number;
  uvIndex: number;
  condition: WeatherCondition;
  sunrise: string;
  sunset: string;
  moonPhase: string;
  hourly: HourlyData[];
}

export interface SearchEntry {
  city: string;
  lat: number;
  lon: number;
  timestamp: number;
}

export type GraphTab = "temperature" | "precipitation" | "wind";
