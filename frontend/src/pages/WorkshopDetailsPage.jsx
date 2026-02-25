import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api';
import { getOpenStatus, getWeeklySchedule } from '../utils/openingHours.js';

export default function WorkshopDetailsPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();

  const [workshop, setWorkshop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [hoverRating, setHoverRating] = useState(0);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const reviewCount = useMemo(() => reviews.length, [reviews]);
  const openStatus = useMemo(() => getOpenStatus(workshop?.opensAt, workshop?.closesAt, new Date(), workshop?.schedule), [workshop]);
  const weeklySchedule = useMemo(() => getWeeklySchedule(workshop?.opensAt, workshop?.closesAt, workshop?.schedule), [workshop]);
  const statusColorClass =
    openStatus.isOpen === null ? 'text-slate-600' : openStatus.isOpen ? 'text-emerald-600' : 'text-red-600';

  const loadData = async () => {
    setError('');
    try {
      const [workshopResponse, reviewsResponse] = await Promise.all([
        api.get(`/workshops/${id}`),
        api.get(`/reviews/${id}`)
      ]);

      setWorkshop(workshopResponse.data);
      setReviews(reviewsResponse.data.reviews);
      setAverageRating(reviewsResponse.data.averageRating);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load workshop details');
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const submitReview = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await api.post(`/reviews/${id}`, {
        rating: Number(form.rating),
        comment: form.comment
      });
      setForm({ rating: 5, comment: '' });
      setHoverRating(0);
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to submit review');
    }
  };

  if (!workshop) {
    return <main className="container-page">{error || 'Loading...'}</main>;
  }

  return (
    <main className="container-page space-y-6">
      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <img src={workshop.images} alt={workshop.name} className="h-72 w-full rounded-lg object-cover" />
        <h1 className="mt-4 text-2xl font-semibold">{workshop.name}</h1>
        <p className="mt-1 text-slate-600">{workshop.address}</p>
        <p className="mt-3 text-slate-700">{workshop.description}</p>
        <p className="mt-2 text-sm text-slate-600">Phone: {workshop.phone}</p>
        <p className={`mt-2 text-sm font-medium ${statusColorClass}`}>
          {openStatus.message}
        </p>
        <div className="mt-2 text-sm text-slate-600">
          <p className="font-medium text-slate-700">Hours</p>
          {weeklySchedule.map((day) => (
            <p key={day.key} className="mt-1">
              {day.label}: {day.isClosed ? 'Closed' : `${day.opensAt} - ${day.closesAt}`}
            </p>
          ))}
          {!weeklySchedule.length && <p className="mt-1">Hours not available</p>}
        </div>
        <p className="mt-2 text-sm text-slate-700">
          ⭐ {averageRating} ({reviewCount} reviews)
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Reviews</h2>

        {isAuthenticated && (
          <>
            {submitted ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-medium">Review submitted!</p>
                <p className="mt-1">Your review is pending admin approval and will appear once approved.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-3 rounded-md bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800"
                >
                  Write another review
                </button>
              </div>
            ) : (
              <form onSubmit={submitReview} className="mt-4 space-y-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setForm((c) => ({ ...c, rating: star }))}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-2xl leading-none focus:outline-none"
                      aria-label={`${star} star`}
                    >
                      <span className={(hoverRating || form.rating) >= star ? 'text-yellow-400' : 'text-slate-300'}>
                        ★
                      </span>
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-slate-500">{form.rating} / 5</span>
                </div>
                <textarea
                  required
                  value={form.comment}
                  onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
                  rows={3}
                  placeholder="Write your experience"
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />
                <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                  Submit Review
                </button>
              </form>
            )}
          </>
        )}

        <div className="mt-6 space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{review.user.name}</span>
                <span>⭐ {review.rating}</span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{review.comment}</p>
            </article>
          ))}
          {!reviews.length && <p className="text-sm text-slate-600">No reviews yet.</p>}
        </div>
      </section>
    </main>
  );
}
