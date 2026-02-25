import { useEffect, useState } from 'react';

import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api';

function formatDateForInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export default function ProfilePage() {
  const { user, refreshProfile, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    carModel: '',
    birthday: ''
  });

  useEffect(() => {
    refreshProfile().catch((requestError) => {
      setError(requestError.response?.data?.message || 'Unable to load profile');
    });

    api.get('/reviews/user/my')
      .then((res) => setMyReviews(res.data))
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        carModel: user.carModel || '',
        birthday: formatDateForInput(user.birthday)
      });
    }
  }, [user]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await updateProfile({
        name: form.name.trim() || undefined,
        phone: form.phone.trim() || null,
        carModel: form.carModel.trim() || null,
        birthday: form.birthday || null
      });
      setSuccess('Profile updated successfully.');
      setEditing(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        carModel: user.carModel || '',
        birthday: formatDateForInput(user.birthday)
      });
    }
    setError('');
    setSuccess('');
    setEditing(false);
  }

  return (
    <main className="container-page space-y-6">
      <section className="mx-auto w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My Profile</h1>
          {!editing && (
            <button
              onClick={() => { setSuccess(''); setError(''); setEditing(true); }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-600">{success}</p>}

        {user && !editing && (
          <dl className="mt-4 divide-y divide-slate-100 text-sm text-slate-700">
            <ProfileRow label="Name" value={user.name} />
            <ProfileRow label="Email" value={user.email} note="(cannot be changed)" />
            <ProfileRow label="Phone" value={user.phone || '—'} />
            <ProfileRow label="Car Model" value={user.carModel || '—'} />
            <ProfileRow
              label="Birthday"
              value={user.birthday ? new Date(user.birthday).toLocaleDateString() : '—'}
            />
          </dl>
        )}

        {user && editing && (
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            {/* Email — read-only */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-slate-400">Email is tied to your account and cannot be changed.</p>
            </div>

            <FormField
              label="Name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Your full name"
            />

            <FormField
              label="Phone Number"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. +60 12-345 6789"
            />

            <FormField
              label="Car Model"
              name="carModel"
              type="text"
              value={form.carModel}
              onChange={handleChange}
              placeholder="e.g. Toyota Vios 2021"
            />

            <FormField
              label="Birthday"
              name="birthday"
              type="date"
              value={form.birthday}
              onChange={handleChange}
            />

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* My Reviews */}
      <section className="mx-auto w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">My Reviews</h2>

        {reviewsLoading && <p className="mt-3 text-sm text-slate-500">Loading reviews…</p>}

        {!reviewsLoading && myReviews.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">You have not submitted any reviews yet.</p>
        )}

        {!reviewsLoading && myReviews.length > 0 && (
          <div className="mt-4 space-y-3">
            {myReviews.map((review) => (
              <article key={review.id} className="rounded-md border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{review.workshop?.name}</span>
                  <ReviewStatusBadge status={review.status} />
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={s <= review.rating ? 'text-yellow-400' : 'text-slate-300'}>★</span>
                  ))}
                </div>
                <p className="mt-1 text-slate-600">{review.comment}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ReviewStatusBadge({ status }) {
  const map = {
    pending:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-800' },
    approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-800' },
    rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' }
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
  );
}

function ProfileRow({ label, value, note }) {
  return (
    <div className="flex items-start gap-2 py-2.5">
      <dt className="w-28 shrink-0 font-medium text-slate-500">{label}</dt>
      <dd className="text-slate-800">
        {value}
        {note && <span className="ml-1 text-xs text-slate-400">{note}</span>}
      </dd>
    </div>
  );
}

function FormField({ label, name, type, value, onChange, required, placeholder }) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
    </div>
  );
}
