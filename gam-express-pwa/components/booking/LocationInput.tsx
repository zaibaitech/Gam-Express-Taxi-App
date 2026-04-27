'use client';

import { useState, useEffect, useRef } from 'react';
import { isPlusCode, normalisePlusCode } from '@/lib/utils';

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  // Nominatim also returns address parts — we use display_name only
}

interface Props {
  readonly id: string;
  readonly label: string;
  readonly placeholder?: string;
  readonly value: string;
  readonly error?: string;
  readonly onChange: (value: string) => void;
}

export default function LocationInput({ id, label, placeholder, value, error, onChange }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleChange(raw: string) {
    onChange(raw);
    setGpsError('');

    // Plus Code — no need to search
    if (isPlusCode(raw.trim())) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    // Too short — clear suggestions
    if (raw.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    // Debounce Nominatim search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchNominatim(raw.trim()), 400);
  }

  async function searchNominatim(query: string) {
    setLoading(true);
    try {
      // Bias results to Gambia (viewbox covers The Gambia)
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '5',
        countrycodes: 'gm',
        viewbox: '-17.0,13.1,-13.8,13.9',
        bounded: '0',
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'Accept-Language': 'en' },
      });
      const data: Suggestion[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function selectSuggestion(s: Suggestion) {
    // Store a short human label — strip country/long suffix
    const parts = s.display_name.split(',');
    const short = parts.slice(0, 3).join(',').trim();
    onChange(short);
    setSuggestions([]);
    setOpen(false);
  }

  async function useGPS() {
    if (!navigator.geolocation) {
      setGpsError('GPS not available on this device.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const parts = (data.display_name as string).split(',');
          const short = parts.slice(0, 3).join(',').trim();
          onChange(short);
        } catch {
          setGpsError('Could not get address from your location.');
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsError('Location permission denied. Please allow location access.');
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  }

  const isPlusCodeValue = isPlusCode(value.trim());

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={id} className="label">{label}</label>

      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            id={id}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder={placeholder ?? 'Area name, street, or Plus Code'}
            autoComplete="off"
            spellCheck={false}
            className={`input-field pr-8 ${error ? 'border-red-500' : ''} ${isPlusCodeValue ? 'font-mono' : ''}`}
          />
          {loading && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm animate-spin">⏳</span>
          )}
        </div>

        {/* GPS button */}
        <button
          type="button"
          onClick={useGPS}
          disabled={gpsLoading}
          title="Use my current location"
          className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white hover:border-yellow-400 hover:bg-yellow-50 transition disabled:opacity-50"
        >
          {gpsLoading ? (
            <span className="text-base animate-spin">⏳</span>
          ) : (
            <span className="text-base">📍</span>
          )}
        </button>
      </div>

      {/* Autocomplete dropdown */}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {suggestions.map((s, i) => {
            const parts = s.display_name.split(',');
            const main = parts[0];
            const sub = parts.slice(1, 3).join(',').trim();
            return (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-3 hover:bg-yellow-50 border-b last:border-0 border-gray-100"
                >
                  <p className="font-semibold text-gray-800 text-sm">{main}</p>
                  {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Status indicators */}
      {isPlusCodeValue && (
        <p className="text-green-600 text-sm mt-1 font-semibold">✓ Plus Code detected</p>
      )}
      {gpsError && (
        <p className="text-orange-600 text-sm mt-1">{gpsError}</p>
      )}
      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
