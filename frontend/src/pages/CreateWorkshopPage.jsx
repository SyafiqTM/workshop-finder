import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';

const initialForm = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  phone: '',
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
          {Object.keys(initialForm).map((field) => (
            <input
              key={field}
              required
              type={field.includes('latitude') || field.includes('longitude') ? 'number' : 'text'}
              placeholder={field}
              value={form[field]}
              onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          ))}

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
