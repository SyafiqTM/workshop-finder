import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { getOpenStatus, getWeeklySchedule } from '../utils/openingHours.js';

const SERVICE_COLORS = {
  'Oil Change':      'bg-amber-100 text-amber-700',
  'Major Service':   'bg-violet-100 text-violet-700',
  'Tyre Change':     'bg-orange-100 text-orange-700',
  'Accessories':     'bg-teal-100 text-teal-700',
  'General Repairs': 'bg-slate-100 text-slate-600',
  'Diagnostics':     'bg-blue-100 text-blue-700',
  'Brake Service':   'bg-red-100 text-red-700',
  'Engine Tuning':   'bg-emerald-100 text-emerald-700',
  'Aircond Service': 'bg-sky-100 text-sky-700',
  'Battery Service': 'bg-yellow-100 text-yellow-700',
};
const DEFAULT_COLOR = 'bg-slate-100 text-slate-600';

function ServicePills({ services }) {
  if (!services?.length) return null;
  const visible = services.slice(0, 3);
  const extra = services.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((s) => (
        <span
          key={s}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SERVICE_COLORS[s] ?? DEFAULT_COLOR}`}
        >
          {s}
        </span>
      ))}
      {extra > 0 && (
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
          +{extra} more
        </span>
      )}
    </div>
  );
}

function HoursPopover({ anchorRef, weeklySchedule }) {
  const [style, setStyle] = useState({ visibility: 'hidden' });
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popoverWidth = 256; // w-64
    let left = rect.left;
    // keep within viewport
    if (left + popoverWidth > window.innerWidth - 8) {
      left = window.innerWidth - popoverWidth - 8;
    }
    setStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left,
      width: popoverWidth,
      zIndex: 9999,
      visibility: 'visible',
    });
  }, [anchorRef]);

  return createPortal(
    <div
      ref={popoverRef}
      style={style}
      className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-lg"
      role="tooltip"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Availability</p>
      {weeklySchedule.map((day) => (
        <div key={day.key} className="flex items-center justify-between gap-3">
          <span className="text-slate-700">{day.label}</span>
          <span className={day.isClosed ? 'text-red-600' : 'text-slate-600'}>
            {day.isClosed ? 'Closed' : `${day.opensAt} - ${day.closesAt}`}
          </span>
        </div>
      ))}
      {!weeklySchedule.length && <p>Hours not available</p>}
    </div>,
    document.body,
  );
}

function LoginPromptModal({ onClose }) {
  const navigate = useNavigate();
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-800">Sign in to save workshops</h3>
        <p className="mt-2 text-sm text-slate-500">
          Create an account or log in to bookmark your favourite workshops.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Register
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-center text-xs text-slate-400 hover:text-slate-600"
        >
          Maybe later
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default function WorkshopCard({ workshop, onFavorite, isFavorite, canFavorite = false }) {
  const openStatus = getOpenStatus(workshop.opensAt, workshop.closesAt, new Date(), workshop.schedule);
  const weeklySchedule = getWeeklySchedule(workshop.opensAt, workshop.closesAt, workshop.schedule);
  const statusColorClass =
    openStatus.isOpen === null ? 'text-slate-600' : openStatus.isOpen ? 'text-emerald-600' : 'text-red-600';

  const services = (() => {
    try { return workshop.services ? JSON.parse(workshop.services) : []; }
    catch { return []; }
  })();
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const anchorRef = useRef(null);

  const handleFavoriteClick = () => {
    if (!canFavorite) {
      setShowLoginPrompt(true);
    } else {
      onFavorite(workshop.id);
    }
  };

  const isMobile = useCallback(() => window.innerWidth < 640, []);

  const handleMouseEnter = () => { if (!isMobile()) setIsHovered(true); };
  const handleMouseLeave = () => setIsHovered(false);
  const handleFocus = () => { if (!isMobile()) setIsHovered(true); };
  const handleBlur = () => setIsHovered(false);
  const handleClick = () => { if (isMobile()) setMobileOpen((v) => !v); };

  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-hidden rounded-t-xl">
        <img src={workshop.images} alt={workshop.name} className="h-44 w-full object-cover" />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold leading-snug">{workshop.name}</h3>
          <button
            type="button"
            onClick={handleFavoriteClick}
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
        </div>
        {showLoginPrompt && <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />}
        <p className="text-sm text-slate-600">{workshop.address}</p>
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-sm font-medium ${statusColorClass}`}>{openStatus.message}</p>

          <span
            ref={anchorRef}
            tabIndex={0}
            role="button"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={handleClick}
            className="inline-flex cursor-pointer items-center gap-1 text-xs text-slate-500 underline decoration-dotted underline-offset-2 focus:outline-none"
            aria-label="View weekly availability"
            aria-expanded={mobileOpen}
          >
            <span className="material-icons text-[14px] leading-none">schedule</span>
            Hours
          </span>

          {/* Desktop fixed popover via portal */}
          {isHovered && <HoursPopover anchorRef={anchorRef} weeklySchedule={weeklySchedule} />}
        </div>

        {/* Mobile inline section */}
        {mobileOpen && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 sm:hidden">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Availability</p>
            {weeklySchedule.map((day) => (
              <div key={day.key} className="flex items-center justify-between gap-3">
                <span className="text-slate-700">{day.label}</span>
                <span className={day.isClosed ? 'text-red-600' : 'text-slate-600'}>
                  {day.isClosed ? 'Closed' : `${day.opensAt} - ${day.closesAt}`}
                </span>
              </div>
            ))}
            {!weeklySchedule.length && <p>Hours not available</p>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
          <span>⭐ {workshop.averageRating || 0}</span>
          <span>{workshop.reviewCount || 0} reviews</span>
          {typeof workshop.distanceKm === 'number' && <span>{workshop.distanceKm} km away</span>}
        </div>
        <div className="flex items-end justify-between">
          <ServicePills services={services} />
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
