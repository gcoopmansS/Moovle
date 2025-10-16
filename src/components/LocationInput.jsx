import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";

const MT_KEY = import.meta.env.VITE_MAPTILER_KEY; // required
const GEOCODE_URL = (q, userLat, userLng) => {
  let url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
    q
  )}.json?key=${MT_KEY}&limit=8&language=en&types=poi,address,place&fuzzyMatch=true`;

  // Add proximity parameter if user location is available
  if (userLat && userLng) {
    url += `&proximity=${userLng},${userLat}`;
  }

  return url;
};

export default function LocationInput({
  value, // { place_name, lat?, lng? }
  onChange, // (loc) => void
  required = true,
  label = "Location",
  placeholder = "e.g. Herentals, Café Central, or Sports Center",
  className = "",
}) {
  const [text, setText] = useState(value?.place_name ?? "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const abortRef = useRef(null);
  const containerRef = useRef(null);

  // keep external value in sync if parent resets
  useEffect(() => {
    setText(value?.place_name ?? "");
  }, [value?.place_name]);

  // Get user's current location for proximity-based search
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          // Silently fail - proximity is just a nice-to-have feature
          console.log("Location access denied or unavailable:", error.message);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    }
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
        setFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search - only when focused and typing
  useEffect(() => {
    if (!MT_KEY) return; // avoid noisy fetch if no key set
    if (!text || text.trim().length < 3 || !focused) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);

    const handle = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          GEOCODE_URL(text.trim(), userLocation?.lat, userLocation?.lng),
          {
            signal: controller.signal,
          }
        );
        const data = await res.json();
        const items = (data.features || []).map((f) => {
          // Extract POI category information
          const poiCategory = f.properties?.category;
          const placeType = f.place_type?.[0];

          // Create more descriptive context for POIs
          let context = f.properties?.osm?.type || f.properties?.type || "";

          // Add category info for POIs to help users identify the type of place
          if (poiCategory && placeType === "poi") {
            const categoryText = poiCategory
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());
            context = categoryText + (context ? ` • ${context}` : "");
          }

          // Calculate distance from user if location is available
          let distanceFromUser = null;
          if (userLocation && f.center) {
            const lat1 = userLocation.lat;
            const lng1 = userLocation.lng;
            const lat2 = f.center[1];
            const lng2 = f.center[0];

            // Haversine formula for distance calculation
            const R = 6371; // Earth's radius in kilometers
            const dLat = ((lat2 - lat1) * Math.PI) / 180;
            const dLng = ((lng2 - lng1) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            distanceFromUser = R * c;
          }

          return {
            id: f.id,
            place_name: f.place_name || f.place_name_en || f.text,
            lat: f.center?.[1],
            lng: f.center?.[0],
            context: context,
            type: placeType,
            category: poiCategory,
            distanceFromUser: distanceFromUser,
          };
        });

        // Enhanced sorting: combine POI relevance with proximity
        const sortedItems = items.sort((a, b) => {
          // First priority: POIs that match common activity meeting spots
          const activityPOIs = [
            "restaurant",
            "cafe",
            "bar",
            "gym",
            "park",
            "sports",
            "recreation",
            "food",
          ];
          const aIsActivityPOI = activityPOIs.some(
            (type) =>
              a.category?.toLowerCase().includes(type) ||
              a.place_name?.toLowerCase().includes(type) ||
              a.context?.toLowerCase().includes(type)
          );
          const bIsActivityPOI = activityPOIs.some(
            (type) =>
              b.category?.toLowerCase().includes(type) ||
              b.place_name?.toLowerCase().includes(type) ||
              b.context?.toLowerCase().includes(type)
          );

          // If both or neither are activity POIs, sort by distance
          if (aIsActivityPOI === bIsActivityPOI) {
            // If we have distances, prioritize closer locations
            if (a.distanceFromUser !== null && b.distanceFromUser !== null) {
              return a.distanceFromUser - b.distanceFromUser;
            }
            // If only one has distance, prioritize it
            if (a.distanceFromUser !== null) return -1;
            if (b.distanceFromUser !== null) return 1;
            // Otherwise maintain original order
            return 0;
          }

          // Activity POIs take priority regardless of distance
          if (aIsActivityPOI && !bIsActivityPOI) return -1;
          if (!aIsActivityPOI && bIsActivityPOI) return 1;
          return 0;
        });

        setSuggestions(sortedItems);
      } catch {
        // ignore (aborted / offline)
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce

    return () => clearTimeout(handle);
  }, [text, focused, userLocation]);

  function pick(item) {
    setText(item.place_name);
    setSuggestions([]);
    setOpen(false);
    setFocused(false);
    onChange?.({ place_name: item.place_name, lat: item.lat, lng: item.lng });
  }

  async function ensureGeocoded() {
    // If parent already has lat/lng from a suggestion, done
    if (value?.lat != null && value?.lng != null) return true;

    // Try geocoding the raw text once on blur/submit
    if (!text || text.trim().length < 3 || !MT_KEY) return false;

    try {
      const res = await fetch(
        GEOCODE_URL(text.trim(), userLocation?.lat, userLocation?.lng)
      );
      const data = await res.json();
      const top = (data.features || [])[0];
      if (!top?.center) return false;
      onChange?.({
        place_name: top.place_name || text.trim(),
        lat: top.center[1],
        lng: top.center[0],
      });
      return true;
    } catch {
      return false;
    }
  }

  const showError = useMemo(() => {
    if (!required) return false;
    if (!touched) return false;
    // must have both name and coords
    return !(value?.place_name && value?.lat != null && value?.lng != null);
  }, [required, touched, value?.place_name, value?.lat, value?.lng]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-4 w-4 text-gray-400" />
        </div>

        <input
          type="text"
          className={`w-full pl-10 pr-10 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            showError
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 hover:border-gray-400"
          } ${focused ? "bg-white" : "bg-gray-50"}`}
          placeholder={placeholder}
          value={text}
          onFocus={() => {
            setFocused(true);
            setTouched(true);
          }}
          onChange={(e) => {
            setText(e.target.value);
            setTouched(true);
            // keep place_name in parent even while typing (coords get set when chosen/geocoded)
            onChange?.({
              place_name: e.target.value,
              lat: value?.lat,
              lng: value?.lng,
            });
          }}
          onBlur={async () => {
            setTouched(true);
            // try to geocode on blur if user didn't pick a suggestion
            await ensureGeocoded();
            // Don't close immediately to allow for clicks on suggestions
            setTimeout(() => {
              if (!containerRef.current?.contains(document.activeElement)) {
                setOpen(false);
                setFocused(false);
              }
            }, 150);
          }}
          autoComplete="off"
          aria-autocomplete="list"
        />

        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Search className="h-4 w-4 text-gray-400 animate-pulse" />
          </div>
        )}
      </div>

      {/* Modern Suggestions Dropdown */}
      {open && (loading || suggestions.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200/50 py-2 animate-in slide-in-from-top-2 duration-200">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <Search className="h-4 w-4 animate-pulse" />
              Searching locations...
            </div>
          )}
          {!loading &&
            suggestions.map((s) => (
              <button
                type="button"
                key={s.id}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-all duration-150 flex items-start gap-3 group cursor-pointer"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                <div className="mt-0.5">
                  <MapPin className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-900 transition-colors">
                    {s.place_name}
                  </div>
                  <div className="flex items-center justify-between">
                    {s.context && (
                      <div className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors mt-0.5">
                        {s.context}
                      </div>
                    )}
                    {s.distanceFromUser !== null && (
                      <div className="text-xs text-blue-600 font-medium ml-2 mt-0.5">
                        {s.distanceFromUser < 1
                          ? `${Math.round(s.distanceFromUser * 1000)}m`
                          : `${s.distanceFromUser.toFixed(1)}km`}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          {!loading && suggestions.length === 0 && text.trim().length >= 3 && (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              No locations found
            </div>
          )}
        </div>
      )}

      {showError && (
        <p className="text-xs text-red-600 mt-1">
          Please choose a place from the list so we can attach a map location.
        </p>
      )}
    </div>
  );
}
