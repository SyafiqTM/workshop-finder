import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import MapView from '../components/MapView.jsx';
import WorkshopCard from '../components/WorkshopCard.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api';

const SEARCH_RADIUS_KM = 5;

const ALL_SERVICES = [
  'Oil Change',
  'Major Service',
  'Tyre Change',
  'Accessories',
  'General Repairs',
  'Diagnostics',
  'Brake Service',
  'Engine Tuning',
  'Aircond Service',
  'Battery Service',
];

function ServiceTagInput({ selectedServices, onChange }) {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const suggestions = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    return ALL_SERVICES.filter(
      (s) => !selectedServices.includes(s) && (q === '' || s.toLowerCase().includes(q))
    );
  }, [inputValue, selectedServices]);

  const addService = (service) => {
    if (service && !selectedServices.includes(service)) {
      onChange([...selectedServices, service]);
    }
    setInputValue('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeService = (service) => {
    onChange(selectedServices.filter((s) => s !== service));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const exact = ALL_SERVICES.find(
        (s) => s.toLowerCase() === inputValue.trim().toLowerCase()
      );
      const first = suggestions[0];
      if (exact) addService(exact);
      else if (first && suggestions.length === 1) addService(first);
      else if (first) addService(first); // pick first match on Enter
    } else if (e.key === 'Backspace' && inputValue === '' && selectedServices.length > 0) {
      onChange(selectedServices.slice(0, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-xs font-medium text-slate-500 uppercase tracking-wide">
        Filter by services
      </label>

      {/* Tag + input row */}
      <div
        className="flex min-h-[2.4rem] flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1.5 cursor-text focus-within:border-slate-500"
        onClick={() => inputRef.current?.focus()}
      >
        {selectedServices.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white"
          >
            {s}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeService(s); }}
              className="ml-0.5 leading-none hover:opacity-70"
              aria-label={`Remove ${s}`}
            >
              <span className="material-icons text-[13px] leading-none">close</span>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedServices.length ? '' : 'Type a service and press Enter…'}
          className="min-w-[160px] flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg text-sm">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addService(s); }}
                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [allWorkshops, setAllWorkshops] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [locationFilterActive, setLocationFilterActive] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);

  const nearbyWorkshops = useMemo(() => {
    if (!locationFilterActive || !userCoords) {
      return allWorkshops;
    }

    return allWorkshops
      .map((workshop) => {
        const distanceKm = haversineDistanceKm(userCoords.lat, userCoords.lng, workshop.latitude, workshop.longitude);
        return {
          ...workshop,
          distanceKm: Number(distanceKm.toFixed(2))
        };
      })
      .filter((workshop) => workshop.distanceKm <= SEARCH_RADIUS_KM)
      .sort((first, second) => first.distanceKm - second.distanceKm);
  }, [allWorkshops, locationFilterActive, userCoords]);
  const hasWorkshops = useMemo(() => nearbyWorkshops.length > 0, [nearbyWorkshops]);
  const cityOptions = useMemo(() => {
    return ['All', ...new Set(nearbyWorkshops.map((workshop) => workshop.city || 'Other'))];
  }, [nearbyWorkshops]);
  const filteredWorkshops = useMemo(() => {
    let result = nearbyWorkshops;

    if (selectedCity !== 'All') {
      result = result.filter((w) => (w.city || 'Other') === selectedCity);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          (w.address || '').toLowerCase().includes(q) ||
          (w.city || '').toLowerCase().includes(q)
      );
    }

    if (selectedServices.length > 0) {
      result = result.filter((w) => {
        try {
          const services = w.services ? JSON.parse(w.services) : [];
          return selectedServices.every((sel) => services.includes(sel));
        } catch {
          return false;
        }
      });
    }

    return result;
  }, [nearbyWorkshops, selectedCity, searchQuery, selectedServices]);
  const groupedWorkshops = useMemo(() => {
    return filteredWorkshops.reduce((groups, workshop) => {
      const cityName = workshop.city || 'Other';
      if (!groups[cityName]) {
        groups[cityName] = [];
      }

      groups[cityName].push(workshop);
      return groups;
    }, {});
  }, [filteredWorkshops]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data: allWorkshops }, favoritesResponse] = await Promise.all([
        api.get('/workshops'),
        isAuthenticated ? api.get('/favorites') : Promise.resolve({ data: [] })
      ]);

      setAllWorkshops(allWorkshops);
      setFavoriteIds((favoritesResponse.data || []).map((item) => item.workshopId));
      setLocationFilterActive(false);
      setUserCoords(null);
      setSelectedCity('All');
      setSearchQuery('');
      setSelectedServices([]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load workshops');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAll();
  }, [isAuthenticated]);

  const loadNearby = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setError('');
        try {
          const { latitude, longitude } = position.coords;
          setUserCoords({ lat: latitude, lng: longitude });
          setLocationFilterActive(true);
          setSelectedCity('All');
        } catch {
          setError('Could not fetch nearby workshops');
        }
      },
      () => {
        setError('Location access denied. Please allow location and retry.');
      }
    );
  };

  const toggleFavorite = async (workshopId) => {
    if (!isAuthenticated) {
      return;
    }

    const alreadyFavorite = favoriteIds.includes(workshopId);
    if (alreadyFavorite) {
      await api.delete(`/favorites/${workshopId}`);
      setFavoriteIds((current) => current.filter((id) => id !== workshopId));
      return;
    }

    await api.post(`/favorites/${workshopId}`);
    setFavoriteIds((current) => [...current, workshopId]);
  };

  return (
    <main className="container-page space-y-6">
      {/* ── Hero: title + map controls only ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-semibold">Find trusted nearby workshops</h1>
        <p className="mt-1 text-slate-600">Browse, save favorites, review service quality, and view locations on map.</p>
        {locationFilterActive && userCoords && (
          <p className="mt-1 text-sm text-slate-500">Showing workshops within {SEARCH_RADIUS_KM} km of your location.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadNearby}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            <span className="material-icons text-[18px] leading-none">location_on</span>
            Find Nearby
          </button>
          <button
            type="button"
            onClick={() => setIsMapVisible((v) => !v)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {isMapVisible ? 'Hide Map' : 'Show Map'}
          </button>
          <div className="flex items-center gap-2">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              {cityOptions.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchAll}
              className="flex items-center justify-center rounded-full border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Reset all filters"
            >
              <span className="material-icons text-[18px] leading-none">refresh</span>
            </button>
          </div>
        </div>
      </section>

      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p>Loading workshops…</p>
      ) : (
        <>
          {/* ── Map ── */}
          {isMapVisible && (hasWorkshops || userCoords) && (
            <MapView workshops={filteredWorkshops} externalUserCoords={userCoords} />
          )}

          {/* ── Search + service filter (below map) ── */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
            {/* Search box */}
            <div className="relative">
              <span className="material-icons pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workshops by name or location…"
                className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <span className="material-icons text-[18px] leading-none">close</span>
                </button>
              )}
            </div>

            {/* Multi-select service tag input */}
            <ServiceTagInput selectedServices={selectedServices} onChange={setSelectedServices} />

            {/* Active filter summary */}
            {(selectedServices.length > 0 || searchQuery.trim()) && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{filteredWorkshops.length} workshop{filteredWorkshops.length !== 1 ? 's' : ''} found</span>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedServices([]); }}
                  className="text-slate-400 hover:text-slate-700 underline underline-offset-2"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>

          {/* ── Results ── */}
          {filteredWorkshops.length === 0 && allWorkshops.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <span className="material-icons text-4xl text-slate-400">search_off</span>
              <p className="mt-3 text-base font-medium text-slate-700">No workshops match your search.</p>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting your filters, or find the nearest workshop in your area.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedServices([]);
                  setSelectedCity('All');
                  loadNearby();
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                <span className="material-icons text-[18px] leading-none">location_on</span>
                Find Nearest Workshop
              </button>
            </div>
          ) : (
            Object.entries(groupedWorkshops).map(([cityName, cityWorkshops]) => (
              <section key={cityName} className="space-y-3">
                <h2 className="text-xl font-semibold">{cityName}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cityWorkshops.map((workshop) => (
                    <WorkshopCard
                      key={workshop.id}
                      workshop={workshop}
                      canFavorite={isAuthenticated}
                      isFavorite={favoriteIds.includes(workshop.id)}
                      onFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}
    </main>
  );
}
