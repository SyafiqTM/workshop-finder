import { Link } from 'react-router-dom';
import { getOpenStatus, getWeeklySchedule } from '../utils/openingHours.js';

export default function WorkshopCard({ workshop, onFavorite, isFavorite, canFavorite = false }) {
  const openStatus = getOpenStatus(workshop.opensAt, workshop.closesAt);
  const weeklySchedule = getWeeklySchedule(workshop.opensAt, workshop.closesAt);
  const statusColorClass =
    openStatus.isOpen === null ? 'text-slate-600' : openStatus.isOpen ? 'text-emerald-600' : 'text-red-600';

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <img src={workshop.images} alt={workshop.name} className="h-44 w-full object-cover" />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{workshop.name}</h3>
          {canFavorite && (
            <button
              type="button"
              onClick={() => onFavorite(workshop.id)}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-100"
            >
              {isFavorite ? 'Unsave' : 'Save'}
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
        <p className="line-clamp-2 text-sm text-slate-600">{workshop.description}</p>
        <Link
          to={`/workshops/${workshop.id}`}
          className="inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
