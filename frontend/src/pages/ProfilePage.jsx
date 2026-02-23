import { useEffect, useState } from 'react';

import { useAuth } from '../hooks/useAuth.jsx';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    refreshProfile().catch((requestError) => {
      setError(requestError.response?.data?.message || 'Unable to load profile');
    });
  }, []);

  return (
    <main className="container-page">
      <section className="mx-auto w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {user && (
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-medium">Name:</span> {user.name}
            </p>
            <p>
              <span className="font-medium">Email:</span> {user.email}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
