import { useEffect, useState } from 'react';

import WorkshopCard from '../components/WorkshopCard.jsx';
import api from '../services/api';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFavorites = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/favorites');
      setFavorites(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load favorites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const removeFavorite = async (workshopId) => {
    await api.delete(`/favorites/${workshopId}`);
    setFavorites((current) => current.filter((favorite) => favorite.workshopId !== workshopId));
  };

  return (
    <main className="container-page space-y-4">
      <h1 className="text-2xl font-semibold">Saved Workshops</h1>

      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p>Loading favorites...</p>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((favorite) => (
            <WorkshopCard
              key={favorite.id}
              workshop={favorite.workshop}
              canFavorite
              isFavorite
              onFavorite={removeFavorite}
            />
          ))}
          {!favorites.length && <p className="text-slate-600">No favorites saved yet.</p>}
        </section>
      )}
    </main>
  );
}
