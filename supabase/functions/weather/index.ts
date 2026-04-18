const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE = "https://api.weatherapi.com/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("WEATHERAPI_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "WEATHERAPI_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { city, lat, lon } = body;

    let query = "";
    if (city) {
      query = encodeURIComponent(city);
    } else if (lat !== undefined && lon !== undefined) {
      query = `${lat},${lon}`;
    } else {
      return new Response(JSON.stringify({ error: "Provide city or lat/lon" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch 7-day forecast (includes current + hourly + astro)
    const url = `${BASE}/forecast.json?key=${apiKey}&q=${query}&days=7&aqi=yes`;
    console.log("WeatherAPI URL:", url.replace(apiKey, "***"));
    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      console.error("WeatherAPI error:", res.status, text);
      return new Response(JSON.stringify({ error: `WeatherAPI error (${res.status}): ${text}` }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = JSON.parse(text);
    const loc = data.location;
    const cur = data.current;

    const current = {
      city: loc.name,
      country: loc.country,
      region: loc.region,
      lat: loc.lat,
      lon: loc.lon,
      localtime: loc.localtime,
      temp: cur.temp_c,
      feelsLike: cur.feelslike_c,
      humidity: cur.humidity,
      windSpeed: cur.wind_kph,
      windDir: cur.wind_dir,
      windDeg: cur.wind_degree,
      pressure: cur.pressure_mb,
      visibility: cur.vis_km,
      uvIndex: cur.uv,
      cloud: cur.cloud,
      precip: cur.precip_mm,
      condition: {
        text: cur.condition.text,
        icon: cur.condition.icon,
        code: cur.condition.code,
      },
      airQuality: cur.air_quality ? {
        pm25: cur.air_quality.pm2_5,
        pm10: cur.air_quality.pm10,
        usEpaIndex: cur.air_quality["us-epa-index"],
      } : null,
      isDay: cur.is_day === 1,
    };

    const forecast = data.forecast.forecastday.map((day: any) => {
      const dayData = day.day;
      const astro = day.astro;
      return {
        date: day.date,
        dayName: new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
        tempHigh: dayData.maxtemp_c,
        tempLow: dayData.mintemp_c,
        avgTemp: dayData.avgtemp_c,
        maxWind: dayData.maxwind_kph,
        totalPrecip: dayData.totalprecip_mm,
        avgHumidity: dayData.avghumidity,
        chanceOfRain: Number(dayData.daily_chance_of_rain) || 0,
        chanceOfSnow: Number(dayData.daily_chance_of_snow) || 0,
        uvIndex: dayData.uv,
        condition: {
          text: dayData.condition.text,
          icon: dayData.condition.icon,
          code: dayData.condition.code,
        },
        sunrise: astro.sunrise,
        sunset: astro.sunset,
        moonPhase: astro.moon_phase,
        hourly: day.hour.map((h: any) => ({
          time: h.time.split(" ")[1],
          epoch: h.time_epoch,
          temp: h.temp_c,
          feelsLike: h.feelslike_c,
          humidity: h.humidity,
          windSpeed: h.wind_kph,
          windDir: h.wind_dir,
          windDeg: h.wind_degree,
          pressure: h.pressure_mb,
          precip: h.precip_mm,
          chanceOfRain: Number(h.chance_of_rain) || 0,
          cloud: h.cloud,
          visibility: h.vis_km,
          uvIndex: h.uv,
          isDay: h.is_day === 1,
          condition: {
            text: h.condition.text,
            icon: h.condition.icon,
            code: h.condition.code,
          },
        })),
      };
    });

    return new Response(JSON.stringify({ current, forecast }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
