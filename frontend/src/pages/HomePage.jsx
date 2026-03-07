import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import MapView from '../components/MapView.jsx';
import WorkshopCard, { WorkshopCardSkeleton } from '../components/WorkshopCard.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api';

const SEARCH_RADIUS_KM = 5;
const PAGE_SIZE = 6;

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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [sortBy, setSortBy] = useState('default');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  // Debounce search input by 350 ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
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

    if (sortBy === 'rating') {
      result = [...result].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sortBy === 'distance') {
      result = [...result].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    } else if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [nearbyWorkshops, selectedCity, debouncedSearch, selectedServices, sortBy]);
  // Reset visible count whenever the filtered result set changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filteredWorkshops]);

  // Infinite scroll: reveal more cards when the sentinel enters view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredWorkshops.length && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((c) => Math.min(c + PAGE_SIZE, filteredWorkshops.length));
            setIsLoadingMore(false);
          }, 1200);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredWorkshops.length, visibleCount, isLoadingMore]);

  const visibleWorkshops = useMemo(
    () => filteredWorkshops.slice(0, visibleCount),
    [filteredWorkshops, visibleCount]
  );

  const groupedWorkshops = useMemo(() => {
    return visibleWorkshops.reduce((groups, workshop) => {
      const cityName = workshop.city || 'Other';
      if (!groups[cityName]) {
        groups[cityName] = [];
      }
      groups[cityName].push(workshop);
      return groups;
    }, {});
  }, [visibleWorkshops]);

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
      setDebouncedSearch('');
      setSelectedServices([]);
      setSortBy('default');
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
      <section className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Find trusted nearby workshops</h1>
        <p className="mt-1 text-slate-300 text-sm">Browse, save favourites, read reviews, and view locations on the map.</p>
        {locationFilterActive && userCoords && (
          <p className="mt-1 text-xs text-slate-400">Showing workshops within {SEARCH_RADIUS_KM} km of your location.</p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadNearby}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100 transition"
          >
            <span className="material-icons text-[18px] leading-none">location_on</span>
            Find Nearby
          </button>
          <button
            type="button"
            onClick={() => setIsMapVisible((v) => !v)}
            className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition"
          >
            {isMapVisible ? 'Hide Map' : 'Show Map'}
          </button>
          <div className="flex items-center gap-2">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="rounded-full border border-white/30 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {cityOptions.map((city) => (
                <option key={city} value={city} className="text-slate-900">{city}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchAll}
              className="flex items-center justify-center rounded-full border border-white/30 p-2 text-white hover:bg-white/10 transition"
              aria-label="Reset all filters"
            >
              <span className="material-icons text-[18px] leading-none">refresh</span>
            </button>
          </div>
        </div>
      </section>

      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <WorkshopCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* ── Map ── */}
          {isMapVisible && (hasWorkshops || userCoords) && (
            <MapView workshops={filteredWorkshops} externalUserCoords={userCoords} />
          )}

          {/* ── Search + service filter (below map) ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            {/* Row: search input + sort */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="material-icons pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workshops by name or location…"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-sm text-slate-700 placeholder:text-slate-400 transition focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setDebouncedSearch(''); }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <span className="material-icons text-[18px] leading-none">close</span>
                  </button>
                )}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-100"
              >
                <option value="default">Sort: Default</option>
                <option value="rating">Top Rated</option>
                <option value="distance">Nearest</option>
                <option value="name">A – Z</option>
              </select>
            </div>

            {/* Quick-select service chips */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Filter by services</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {ALL_SERVICES.map((s) => {
                  const active = selectedServices.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        active
                          ? setSelectedServices(selectedServices.filter((x) => x !== s))
                          : setSelectedServices([...selectedServices, s])
                      }
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
                        active
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400 hover:bg-white'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Result count + clear */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                <span className="font-semibold text-slate-700">{filteredWorkshops.length}</span>{' '}
                workshop{filteredWorkshops.length !== 1 ? 's' : ''} found
              </span>
              {(selectedServices.length > 0 || debouncedSearch.trim()) && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setDebouncedSearch(''); setSelectedServices([]); }}
                  className="font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
                >
                  Clear filters
                </button>
              )}
            </div>
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
                  setDebouncedSearch('');
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
            <>
              {Object.entries(groupedWorkshops).map(([cityName, cityWorkshops]) => (
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
              ))}
              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-4" />
              {isLoadingMore && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <WorkshopCardSkeleton key={i} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
