import { useState, useEffect, useCallback, memo } from "react";
import { Star, X } from "lucide-react";
import { useWeather } from "@/lib/weather-store";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface FavoriteLocation {
  city: string;
  lat: number;
  lon: number;
}

function getFavorites(): FavoriteLocation[] {
  try { return JSON.parse(localStorage.getItem("weather_favorites") || "[]"); }
  catch { return []; }
}

function saveFavorites(favs: FavoriteLocation[]) {
  try { localStorage.setItem("weather_favorites", JSON.stringify(favs)); }
  catch { /* quota exceeded */ }
}

export const FavoriteButton = memo(function FavoriteButton() {
  const { current } = useWeather();
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (!current) return;
    const favs = getFavorites();
    setIsFav(favs.some(f => f.city.toLowerCase() === current.city.toLowerCase()));
  }, [current]);

  const toggle = useCallback(() => {
    if (!current) return;
    const favs = getFavorites();
    const exists = favs.findIndex(f => f.city.toLowerCase() === current.city.toLowerCase());
    if (exists >= 0) {
      favs.splice(exists, 1);
      setIsFav(false);
      toast(`Removed ${current.city} from favorites`);
    } else {
      favs.push({ city: current.city, lat: current.lat, lon: current.lon });
      setIsFav(true);
      toast.success(`Added ${current.city} to favorites ⭐`);
    }
    saveFavorites(favs);
    window.dispatchEvent(new Event("favorites-updated"));
  }, [current]);

  if (!current) return null;

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-xl glass-input transition-all duration-200 hover:border-primary/30"
      title={isFav ? "Remove from favorites" : "Add to favorites"}
      aria-label={isFav ? `Remove ${current.city} from favorites` : `Add ${current.city} to favorites`}
      aria-pressed={isFav}
    >
      <motion.div
        animate={{ scale: isFav ? [1, 1.35, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        <Star
          className={`w-4 h-4 transition-colors duration-200 ${
            isFav ? "fill-primary text-primary" : "text-muted-foreground"
          }`}
        />
      </motion.div>
    </button>
  );
});

export const FavoritesBar = memo(function FavoritesBar() {
  const { searchByCoords } = useWeather();
  const [favorites, setFavorites] = useState<FavoriteLocation[]>(getFavorites);

  useEffect(() => {
    const handler = () => setFavorites(getFavorites());
    window.addEventListener("favorites-updated", handler);
    return () => window.removeEventListener("favorites-updated", handler);
  }, []);

  const removeFav = useCallback((city: string) => {
    const favs = getFavorites().filter(f => f.city.toLowerCase() !== city.toLowerCase());
    saveFavorites(favs);
    setFavorites(favs);
    window.dispatchEvent(new Event("favorites-updated"));
    toast(`Removed ${city} from favorites`);
  }, []);

  if (favorites.length === 0) return null;

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide"
      role="list"
      aria-label="Favorite locations"
    >
      <Star className="w-3.5 h-3.5 text-primary flex-shrink-0" aria-hidden="true" />
      <AnimatePresence mode="popLayout">
        {favorites.map(fav => (
          <motion.div
            key={fav.city}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="group flex items-center gap-1 glass-chip flex-shrink-0"
            role="listitem"
          >
            {/* City name button */}
            <button
              onClick={() => searchByCoords(fav.lat, fav.lon)}
              className="px-3 py-1.5 text-xs font-medium text-foreground"
              aria-label={`Load weather for ${fav.city}`}
            >
              {fav.city}
            </button>
            {/* ✅ FIXED: X is now a proper <button> element — keyboard accessible */}
            <button
              onClick={() => removeFav(fav.city)}
              aria-label={`Remove ${fav.city} from favorites`}
              className="pr-2 py-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
