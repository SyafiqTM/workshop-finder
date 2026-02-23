import { useCallback, useEffect, useMemo, useState } from 'react';

import MapView from '../components/MapView.jsx';
import WorkshopCard from '../components/WorkshopCard.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api';

const SEARCH_RADIUS_KM = 5;

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
    if (selectedCity === 'All') {
      return nearbyWorkshops;
    }

    return nearbyWorkshops.filter((workshop) => (workshop.city || 'Other') === selectedCity);
  }, [nearbyWorkshops, selectedCity]);
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
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-semibold">Find trusted nearby workshops</h1>
        <p className="mt-2 text-slate-600">Browse, save favorites, review service quality, and view locations on map.</p>
        {locationFilterActive && userCoords && (
          <p className="mt-2 text-sm text-slate-700">Showing workshops within {SEARCH_RADIUS_KM}km of your location.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadNearby}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
           🗺️ Find Nearby
          </button>
          <button
            type="button"
            onClick={fetchAll}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Reset List
          </button>
          <button
            type="button"
            onClick={() => setIsMapVisible((current) => !current)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            {isMapVisible ? 'Hide Map' : 'Show Map'}
          </button>
          <select
            value={selectedCity}
            onChange={(event) => setSelectedCity(event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p>Loading workshops...</p>
      ) : (
        <>
          {isMapVisible && (hasWorkshops || userCoords) && (
            <MapView workshops={filteredWorkshops} externalUserCoords={userCoords} />
          )}
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
        </>
      )}
    </main>
  );
}
