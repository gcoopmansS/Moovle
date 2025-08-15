import { useEffect, useMemo, useRef, useState } from "react";

const MT_KEY = import.meta.env.VITE_MAPTILER_KEY; // required
const GEOCODE_URL = (q) =>
  `https://api.maptiler.com/geocoding/${encodeURIComponent(
    q
  )}.json?key=${MT_KEY}&limit=5&language=en`;

export default function LocationInput({
  value, // { place_name, lat?, lng? }
  onChange, // (loc) => void
  required = true,
  label = "Location",
  placeholder = "e.g. Herentals, Hoge Mouw parking",
}) {
  const [text, setText] = useState(value?.place_name ?? "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const abortRef = useRef(null);

  // keep external value in sync if parent resets
  useEffect(() => {
    setText(value?.place_name ?? "");
  }, [value?.place_name]);

  // Debounced search
  useEffect(() => {
    if (!MT_KEY) return; // avoid noisy fetch if no key set
    if (!text || text.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setOpen(true);

    const handle = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(GEOCODE_URL(text.trim()), {
          signal: controller.signal,
        });
        const data = await res.json();
        const items = (data.features || []).map((f) => ({
          id: f.id,
          place_name: f.place_name || f.place_name_en || f.text,
          lat: f.center?.[1],
          lng: f.center?.[0],
          context: f.properties?.osm?.type || f.properties?.type || "",
        }));
        setSuggestions(items);
      } catch (_) {
        // ignore (aborted / offline)
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce

    return () => clearTimeout(handle);
  }, [text]);

  function pick(item) {
    setText(item.place_name);
    setSuggestions([]);
    setOpen(false);
    onChange?.({ place_name: item.place_name, lat: item.lat, lng: item.lng });
  }

  async function ensureGeocoded() {
    // If parent already has lat/lng from a suggestion, done
    if (value?.lat != null && value?.lng != null) return true;

    // Try geocoding the raw text once on blur/submit
    if (!text || text.trim().length < 3 || !MT_KEY) return false;

    try {
      const res = await fetch(GEOCODE_URL(text.trim()));
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
    <div className="relative">
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <input
        type="text"
        className={`w-full p-2 border rounded ${
          showError ? "border-red-400" : "border-gray-300"
        }`}
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setTouched(true);
          // keep place_name in parent even while typing (coords get set when chosen/geocoded)
          onChange?.({
            place_name: e.target.value,
            lat: value?.lat,
            lng: value?.lng,
          });
          setOpen(true);
        }}
        onBlur={async () => {
          setTouched(true);
          // try to geocode on blur if user didn't pick a suggestion
          await ensureGeocoded();
          setOpen(false);
        }}
        autoComplete="off"
        aria-autocomplete="list"
      />

      {/* Suggestions */}
      {open && (loading || suggestions.length > 0) && (
        <div className="absolute z-20 w-full mt-1 rounded-lg border bg-white shadow">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
          )}
          {!loading &&
            suggestions.map((s) => (
              <button
                type="button"
                key={s.id}
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                <div className="text-sm text-gray-900">{s.place_name}</div>
                {s.context && (
                  <div className="text-xs text-gray-500">{s.context}</div>
                )}
              </button>
            ))}
          {!loading && suggestions.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">No results</div>
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
