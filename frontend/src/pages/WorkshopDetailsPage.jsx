import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api';
import { getOpenStatus, getWeeklySchedule } from '../utils/openingHours.js';

const DAY_KEYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BOOKING_WINDOW_DAYS = 7;
const SLOT_MINUTES = 30;

function normalizeImageList(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string' && item.trim());
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function parseWorkshopImages(rawImages) {
  if (!rawImages || typeof rawImages !== 'string') {
    return { cover: '', before: [], after: [], gallery: [] };
  }

  const trimmed = rawImages.trim();
  if (!trimmed) {
    return { cover: '', before: [], after: [], gallery: [] };
  }

  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return {
      cover: trimmed,
      before: [],
      after: [],
      gallery: [trimmed]
    };
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      const gallery = normalizeImageList(parsed);
      return {
        cover: gallery[0] || '',
        before: [],
        after: [],
        gallery
      };
    }

    const before = normalizeImageList(parsed.before);
    const after = normalizeImageList(parsed.after);
    const gallery = normalizeImageList(parsed.gallery);
    const cover =
      (typeof parsed.cover === 'string' && parsed.cover.trim()) ||
      gallery[0] ||
      before[0] ||
      after[0] ||
      '';

    return {
      cover,
      before,
      after,
      gallery: [...new Set([cover, ...gallery, ...before, ...after].filter(Boolean))]
    };
  } catch {
    return {
      cover: trimmed,
      before: [],
      after: [],
      gallery: [trimmed]
    };
  }
}

function parseServices(rawServices) {
  if (!rawServices) return [];

  try {
    const parsed = JSON.parse(rawServices);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function formatPhoneForWhatsApp(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/[^\d]/g, '');
  if (!digits) return '';

  if (digits.startsWith('0')) {
    return `6${digits}`;
  }

  return digits;
}

function parseScheduleMap(schedule, opensAt, closesAt) {
  const fallback = Object.fromEntries(
    DAY_KEYS.map((day) => [day, { opensAt: opensAt || '09:00', closesAt: closesAt || '18:00', off: false }])
  );

  if (!schedule) return fallback;

  try {
    const parsed = JSON.parse(schedule);
    return DAY_KEYS.reduce((acc, day) => {
      acc[day] = {
        opensAt: parsed?.[day]?.opensAt || opensAt || '09:00',
        closesAt: parsed?.[day]?.closesAt || closesAt || '18:00',
        off: Boolean(parsed?.[day]?.off)
      };
      return acc;
    }, {});
  } catch {
    return fallback;
  }
}

function toMinutes(value) {
  const [hours, minutes] = String(value).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function formatSlot(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function isSameCalendarDate(first, second) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function buildTimeSlots(date, daySchedule) {
  if (!daySchedule || daySchedule.off) return [];

  const openMinutes = toMinutes(daySchedule.opensAt);
  const closeMinutes = toMinutes(daySchedule.closesAt);
  if (openMinutes === null || closeMinutes === null || closeMinutes <= openMinutes) return [];

  const now = new Date();
  const minimumTodayMinutes = now.getHours() * 60 + now.getMinutes() + SLOT_MINUTES;

  const slots = [];
  for (let minutes = openMinutes; minutes + SLOT_MINUTES <= closeMinutes; minutes += SLOT_MINUTES) {
    if (isSameCalendarDate(date, now) && minutes < minimumTodayMinutes) {
      continue;
    }
    slots.push(formatSlot(minutes));
  }

  return slots;
}

function getBookingDates(schedule, opensAt, closesAt) {
  const scheduleMap = parseScheduleMap(schedule, opensAt, closesAt);
  const today = new Date();

  return Array.from({ length: BOOKING_WINDOW_DAYS })
    .map((_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() + index);

      const dayKey = DAY_KEYS[date.getDay()];
      const daySchedule = scheduleMap[dayKey];
      const slots = buildTimeSlots(date, daySchedule);

      return {
        key: dayKey,
        value: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString(undefined, {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        }),
        isToday: index === 0,
        slots
      };
    })
    .filter((item) => item.slots.length > 0);
}

function buildWhatsAppMessage(workshop, bookingForm) {
  const lines = [
    `Hi ${workshop.name},`,
    'I would like to book a service appointment.',
    '',
    `Service: ${bookingForm.service}`,
    `Preferred date: ${bookingForm.date}`,
    `Preferred time: ${bookingForm.time}`,
    `Customer name: ${bookingForm.customerName}`,
    `Contact number: ${bookingForm.customerPhone}`
  ];

  if (bookingForm.notes.trim()) {
    lines.push(`Notes: ${bookingForm.notes.trim()}`);
  }

  return lines.join('\n');
}

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
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    customerPhone: '',
    service: '',
    date: '',
    time: '',
    notes: ''
  });
  const [bookingMessage, setBookingMessage] = useState('');

  const reviewCount = useMemo(() => reviews.length, [reviews]);
  const openStatus = useMemo(() => getOpenStatus(workshop?.opensAt, workshop?.closesAt, new Date(), workshop?.schedule), [workshop]);
  const weeklySchedule = useMemo(() => getWeeklySchedule(workshop?.opensAt, workshop?.closesAt, workshop?.schedule), [workshop]);
  const workshopImages = useMemo(() => parseWorkshopImages(workshop?.images), [workshop?.images]);
  const services = useMemo(() => parseServices(workshop?.services), [workshop?.services]);
  const bookingDates = useMemo(
    () => getBookingDates(workshop?.schedule, workshop?.opensAt, workshop?.closesAt),
    [workshop?.schedule, workshop?.opensAt, workshop?.closesAt]
  );
  const availableSlots = useMemo(() => {
    const selectedDate = bookingDates.find((item) => item.value === bookingForm.date);
    return selectedDate?.slots || [];
  }, [bookingDates, bookingForm.date]);
  const whatsappNumber = useMemo(() => formatPhoneForWhatsApp(workshop?.phone), [workshop?.phone]);
  const whatsappHref = useMemo(() => {
    if (!whatsappNumber) return '';
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi ${workshop?.name || 'there'}, I would like to ask about your services.`)}`;
  }, [whatsappNumber, workshop?.name]);
  const statusColorClass =
    openStatus.isOpen === null ? 'text-slate-600' : openStatus.isOpen ? 'text-emerald-600' : 'text-red-600';

  useEffect(() => {
    if (!services.length) return;

    setBookingForm((current) => {
      if (current.service && services.includes(current.service)) {
        return current;
      }

      return { ...current, service: services[0] };
    });
  }, [services]);

  useEffect(() => {
    if (!bookingDates.length) return;

    setBookingForm((current) => {
      const currentDate = bookingDates.find((item) => item.value === current.date);
      if (currentDate) {
        const nextTime = currentDate.slots.includes(current.time) ? current.time : currentDate.slots[0] || '';
        if (nextTime === current.time) return current;
        return { ...current, time: nextTime };
      }

      return {
        ...current,
        date: bookingDates[0].value,
        time: bookingDates[0].slots[0] || ''
      };
    });
  }, [bookingDates]);

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

  const setBookingField = (key) => (event) => {
    const value = event.target.value;
    setBookingMessage('');
    setBookingForm((current) => {
      if (key !== 'date') {
        return { ...current, [key]: value };
      }

      const nextDate = bookingDates.find((item) => item.value === value);
      return {
        ...current,
        date: value,
        time: nextDate?.slots[0] || ''
      };
    });
  };

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

  const handleBookingSubmit = (event) => {
    event.preventDefault();
    setBookingMessage('');

    if (!whatsappNumber) {
      setBookingMessage('WhatsApp contact is not available for this workshop yet.');
      return;
    }

    if (!bookingForm.customerName || !bookingForm.customerPhone || !bookingForm.service || !bookingForm.date || !bookingForm.time) {
      setBookingMessage('Please complete your name, contact, service, date, and time slot.');
      return;
    }

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildWhatsAppMessage(workshop, bookingForm))}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setBookingMessage('Opening WhatsApp with your appointment request.');
  };

  if (!workshop) {
    return <main className="container-page">{error || 'Loading...'}</main>;
  }

  return (
    <main className="container-page space-y-6">
      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          {workshopImages.cover && (
            <img src={workshopImages.cover} alt={workshop.name} className="h-72 w-full rounded-lg object-cover" />
          )}
          <h1 className="mt-4 text-2xl font-semibold">{workshop.name}</h1>
          <p className="mt-1 text-slate-600">{workshop.address}</p>
          <p className="mt-3 text-slate-700">{workshop.description}</p>

          {services.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {services.map((service) => (
                <span
                  key={service}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {service}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
              <p className="mt-2 text-sm text-slate-700">Phone: {workshop.phone}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    <span className="material-icons text-[18px] leading-none">chat</span>
                    WhatsApp Chat
                  </a>
                )}
                <a
                  href={`tel:${workshop.phone}`}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <span className="material-icons text-[18px] leading-none">call</span>
                  Call Workshop
                </a>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <p className={`mt-2 text-sm font-medium ${statusColorClass}`}>{openStatus.message}</p>
              <p className="mt-2 text-sm text-slate-700">
                ⭐ {averageRating} ({reviewCount} reviews)
              </p>
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-600">
            <p className="font-medium text-slate-700">Hours</p>
            {weeklySchedule.map((day) => (
              <p key={day.key} className="mt-1">
                {day.label}: {day.isClosed ? 'Closed' : `${day.opensAt} - ${day.closesAt}`}
              </p>
            ))}
            {!weeklySchedule.length && <p className="mt-1">Hours not available</p>}
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Book service appointment</h2>
              <p className="mt-1 text-sm text-slate-500">
                Pick a service, choose an available time slot, and continue on WhatsApp.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Online booking
            </span>
          </div>

          <form onSubmit={handleBookingSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Your name</span>
                <input
                  required
                  type="text"
                  value={bookingForm.customerName}
                  onChange={setBookingField('customerName')}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
                  placeholder="Full name"
                />
              </label>

              <label className="block text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Contact number</span>
                <input
                  required
                  type="text"
                  value={bookingForm.customerPhone}
                  onChange={setBookingField('customerPhone')}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
                  placeholder="e.g. 012-3456789"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Service</span>
                <select
                  required
                  value={bookingForm.service}
                  onChange={setBookingField('service')}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:border-slate-500 focus:outline-none"
                >
                  {!services.length && <option value="">General service inquiry</option>}
                  {services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Date</span>
                <select
                  required
                  value={bookingForm.date}
                  onChange={setBookingField('date')}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:border-slate-500 focus:outline-none"
                >
                  {bookingDates.length === 0 && <option value="">No time slots available</option>}
                  {bookingDates.map((dateOption) => (
                    <option key={dateOption.value} value={dateOption.value}>
                      {dateOption.label}{dateOption.isToday ? ' · Today' : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">Time slot</span>
                <select
                  required
                  value={bookingForm.time}
                  onChange={setBookingField('time')}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:border-slate-500 focus:outline-none"
                >
                  {availableSlots.length === 0 && <option value="">No slots</option>}
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Available slots</p>
              <div className="flex flex-wrap gap-2">
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot) => {
                    const isSelected = bookingForm.time === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setBookingMessage('');
                          setBookingForm((current) => ({ ...current, time: slot }));
                        }}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-slate-900 text-white'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">No available slots for the selected day.</p>
                )}
              </div>
            </div>

            <label className="block text-sm text-slate-600">
              <span className="mb-1 block font-medium text-slate-700">Notes</span>
              <textarea
                rows={3}
                value={bookingForm.notes}
                onChange={setBookingField('notes')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
                placeholder="Tell the workshop what issue you are facing"
              />
            </label>

            {bookingMessage && (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {bookingMessage}
              </p>
            )}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <span className="material-icons text-[18px] leading-none">chat</span>
              Book on WhatsApp
            </button>
          </form>
        </section>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Before/after repair photos</h2>
            <p className="mt-1 text-sm text-slate-500">
              Show repair progress and recent workshop results.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            Photo showcase
          </span>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Before</h3>
            {workshopImages.before.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {workshopImages.before.map((image, index) => (
                  <img
                    key={`before-${index}`}
                    src={image}
                    alt={`${workshop.name} before repair ${index + 1}`}
                    className="h-48 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                No before-repair photos uploaded yet.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">After</h3>
            {workshopImages.after.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {workshopImages.after.map((image, index) => (
                  <img
                    key={`after-${index}`}
                    src={image}
                    alt={`${workshop.name} after repair ${index + 1}`}
                    className="h-48 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                No after-repair photos uploaded yet.
              </div>
            )}
          </div>
        </div>

        {workshopImages.gallery.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Workshop gallery</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {workshopImages.gallery.map((image, index) => (
                <img
                  key={`gallery-${index}`}
                  src={image}
                  alt={`${workshop.name} gallery ${index + 1}`}
                  className="h-36 w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </div>
        )}
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
