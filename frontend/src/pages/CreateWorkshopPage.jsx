import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';

const initialForm = {
  name: '',
  address: '',
  city: '',
  latitude: '',
  longitude: '',
  phone: '',
  opensAt: '09:00',
  closesAt: '18:00',
  description: '',
  images: ''
};

export default function CreateWorkshopPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude)
      };

      const { data } = await api.post('/workshops', payload);
      navigate(`/workshops/${data.id}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not create workshop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container-page">
      <section className="mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Add Workshop</h1>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
          <input
            required
            type="text"
            placeholder="name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            required
            type="text"
            placeholder="address"
            value={form.address}
            onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            required
            type="text"
            placeholder="city"
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            required
            type="number"
            step="any"
            placeholder="latitude"
            value={form.latitude}
            onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            required
            type="number"
            step="any"
            placeholder="longitude"
            value={form.longitude}
            onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            required
            type="text"
            placeholder="phone"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              type="time"
              value={form.opensAt}
              onChange={(event) => setForm((current) => ({ ...current, opensAt: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
            <input
              required
              type="time"
              value={form.closesAt}
              onChange={(event) => setForm((current) => ({ ...current, closesAt: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <textarea
            required
            rows={4}
            placeholder="description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            required
            type="url"
            placeholder="images"
            value={form.images}
            onChange={(event) => setForm((current) => ({ ...current, images: event.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Create Workshop'}
          </button>
        </form>
      </section>
    </main>
  );
}
