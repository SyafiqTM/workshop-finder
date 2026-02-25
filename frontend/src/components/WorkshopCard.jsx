import { Link } from 'react-router-dom';
import { getOpenStatus, getWeeklySchedule } from '../utils/openingHours.js';

export default function WorkshopCard({ workshop, onFavorite, isFavorite, canFavorite = false }) {
  const openStatus = getOpenStatus(workshop.opensAt, workshop.closesAt, new Date(), workshop.schedule);
  const weeklySchedule = getWeeklySchedule(workshop.opensAt, workshop.closesAt, workshop.schedule);
  const statusColorClass =
    openStatus.isOpen === null ? 'text-slate-600' : openStatus.isOpen ? 'text-emerald-600' : 'text-red-600';

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <img src={workshop.images} alt={workshop.name} className="h-44 w-full object-cover" />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold leading-snug">{workshop.name}</h3>
          {canFavorite && (
            <button
              type="button"
              onClick={() => onFavorite(workshop.id)}
              className="shrink-0 p-1 transition-opacity hover:opacity-70"
              aria-label={isFavorite ? 'Unsave' : 'Save'}
            >
              <span
                className="material-icons text-2xl"
                style={{ color: isFavorite ? '#FBBF24' : '#94a3b8' }}
              >
                {isFavorite ? 'bookmark' : 'bookmark_border'}
              </span>
            </button>
          )}
        </div>
        <p className="text-sm text-slate-600">{workshop.address}</p>
        <p className={`text-sm font-medium ${statusColorClass}`}>{openStatus.message}</p>
        <div className="text-sm text-slate-600">
          {weeklySchedule.map((day) => (
            <p key={day.key}>
              {day.label}: {day.isClosed ? 'Closed' : `${day.opensAt} - ${day.closesAt}`}
            </p>
          ))}
          {!weeklySchedule.length && <p>Hours not available</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
          <span>⭐ {workshop.averageRating || 0}</span>
          <span>{workshop.reviewCount || 0} reviews</span>
          {typeof workshop.distanceKm === 'number' && <span>{workshop.distanceKm} km away</span>}
        </div>
        <div className="flex items-end justify-between">
          <p className="line-clamp-2 text-sm text-slate-600">{workshop.description}</p>
          <Link
            to={`/workshops/${workshop.id}`}
            className="ml-3 flex shrink-0 items-center justify-center rounded-full bg-slate-900 p-2 text-white hover:bg-slate-700"
            aria-label="View details"
          >
            <span className="material-icons text-[20px] leading-none">arrow_forward</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
