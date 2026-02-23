import { useEffect, useMemo, useState } from 'react';

import MapView from '../components/MapView.jsx';
import WorkshopCard from '../components/WorkshopCard.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hasWorkshops = useMemo(() => workshops.length > 0, [workshops]);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data: allWorkshops }, favoritesResponse] = await Promise.all([
        api.get('/workshops'),
        isAuthenticated ? api.get('/favorites') : Promise.resolve({ data: [] })
      ]);

      setWorkshops(allWorkshops);
      setFavoriteIds((favoritesResponse.data || []).map((item) => item.workshopId));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load workshops');
    } finally {
      setLoading(false);
    }
  };

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
          const { data } = await api.get('/workshops/nearby', {
            params: { lat: latitude, lng: longitude }
          });
          setWorkshops(data);
        } catch (requestError) {
          setError(requestError.response?.data?.message || 'Could not fetch nearby workshops');
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
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={loadNearby}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Detect Nearby Workshops
          </button>
          <button
            type="button"
            onClick={fetchAll}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Reset List
          </button>
        </div>
      </section>

      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p>Loading workshops...</p>
      ) : (
        <>
          {hasWorkshops && <MapView workshops={workshops} />}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workshops.map((workshop) => (
              <WorkshopCard
                key={workshop.id}
                workshop={workshop}
                canFavorite={isAuthenticated}
                isFavorite={favoriteIds.includes(workshop.id)}
                onFavorite={toggleFavorite}
              />
            ))}
          </section>
        </>
      )}
    </main>
  );
}
