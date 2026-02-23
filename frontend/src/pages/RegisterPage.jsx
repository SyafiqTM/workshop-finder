import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container-page">
      <section className="mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold">Register</h1>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <input
            type="text"
            required
            placeholder="Name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-slate-900 underline">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
