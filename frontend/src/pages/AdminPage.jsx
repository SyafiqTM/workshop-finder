import { useEffect, useState } from 'react';

import api from '../services/api';
import { CreateWorkshopForm } from './CreateWorkshopPage.jsx';

const STATUS_BADGE = {
  pending:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' }
};

function Badge({ status }) {
  const { label, cls } = STATUS_BADGE[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function ActionButtons({ onApprove, onReject, loading }) {
  return (
    <div className="flex gap-2 mt-3">
      <button
        disabled={loading}
        onClick={onApprove}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        disabled={loading}
        onClick={onReject}
        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState('reviews');
  const [reviews, setReviews] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');

  const loadReviews = () =>
    api.get('/reviews/admin/pending').then((r) => setReviews(r.data)).catch(() => {});

  const loadWorkshops = () =>
    api.get('/workshops/admin/pending').then((r) => setWorkshops(r.data)).catch(() => {});

  useEffect(() => {
    loadReviews();
    loadWorkshops();
  }, []);

  async function handleReviewAction(reviewId, status) {
    setLoadingId(reviewId);
    setError('');
    try {
      await api.patch(`/reviews/${reviewId}/status`, { status });
      await loadReviews();
    } catch {
      setError('Failed to update review.');
    } finally {
      setLoadingId(null);
    }
  }

  async function handleWorkshopAction(workshopId, status) {
    setLoadingId(workshopId);
    setError('');
    try {
      await api.patch(`/workshops/${workshopId}/status`, { status });
      await loadWorkshops();
    } catch {
      setError('Failed to update workshop.');
    } finally {
      setLoadingId(null);
    }
  }

  const reviewsBadge = reviews.length > 0 ? reviews.length : null;
  const workshopsBadge = workshops.length > 0 ? workshops.length : null;

  return (
    <main className="container-page">
      <section className="mx-auto w-full max-w-3xl">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Review and approve pending submissions, or add a workshop.</p>

        {error && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>
        )}

        {/* Tabs */}
        <div className="mt-5 flex gap-1 border-b border-slate-200">
          <TabButton
            active={tab === 'reviews'}
            onClick={() => setTab('reviews')}
            badge={reviewsBadge}
          >
            Reviews
          </TabButton>
          <TabButton
            active={tab === 'workshops'}
            onClick={() => setTab('workshops')}
            badge={workshopsBadge}
          >
            Workshops
          </TabButton>
          <TabButton
            active={tab === 'add'}
            onClick={() => setTab('add')}
          >
            Add Workshop
          </TabButton>
        </div>

        {/* Reviews tab */}
        {tab === 'reviews' && (
          <div className="mt-4 space-y-3">
            {reviews.length === 0 && (
              <p className="text-sm text-slate-500">No pending reviews.</p>
            )}
            {reviews.map((review) => (
              <article key={review.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-800">{review.workshop?.name}</p>
                    <p className="text-slate-500 mt-0.5">
                      by <span className="font-medium">{review.user?.name}</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge status={review.status} />
                </div>

                <div className="mt-2 flex items-center gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} className={s <= review.rating ? 'text-yellow-400' : 'text-slate-200'}>★</span>
                  ))}
                </div>

                <p className="mt-2 text-slate-700">{review.comment}</p>

                <ActionButtons
                  loading={loadingId === review.id}
                  onApprove={() => handleReviewAction(review.id, 'approved')}
                  onReject={() => handleReviewAction(review.id, 'rejected')}
                />
              </article>
            ))}
          </div>
        )}

        {/* Workshops tab */}
        {tab === 'workshops' && (
          <div className="mt-4 space-y-3">
            {workshops.length === 0 && (
              <p className="text-sm text-slate-500">No pending workshops.</p>
            )}
            {workshops.map((workshop) => (
              <article key={workshop.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{workshop.name}</p>
                    <p className="text-slate-500 mt-0.5">{workshop.address}</p>
                  </div>
                  <Badge status={workshop.status} />
                </div>

                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
                  <span><span className="font-medium">City:</span> {workshop.city}</span>
                  <span><span className="font-medium">Phone:</span> {workshop.phone}</span>
                  <span><span className="font-medium">Opens:</span> {workshop.opensAt} – {workshop.closesAt}</span>
                  <span><span className="font-medium">Submitted:</span> {new Date(workshop.createdAt).toLocaleDateString()}</span>
                </div>

                {workshop.description && (
                  <p className="mt-2 text-slate-600 line-clamp-2">{workshop.description}</p>
                )}

                {workshop.images && (
                  <img
                    src={workshop.images}
                    alt={workshop.name}
                    className="mt-3 h-36 w-full rounded-lg object-cover"
                  />
                )}

                <ActionButtons
                  loading={loadingId === workshop.id}
                  onApprove={() => handleWorkshopAction(workshop.id, 'approved')}
                  onReject={() => handleWorkshopAction(workshop.id, 'rejected')}
                />
              </article>
            ))}
          </div>
        )}

        {/* Add workshop tab */}
        {tab === 'add' && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">Add Workshop</h2>
            <CreateWorkshopForm embedded />
          </div>
        )}
      </section>
    </main>
  );
}

function TabButton({ active, onClick, badge, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'border-slate-900 text-slate-900'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
      {badge != null && (
        <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-semibold leading-none text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
