import { Link, NavLink } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api';

const navClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`;

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const accountMenuRef = useRef(null);
  const servicesMenuRef = useRef(null);
  const servicesHoverTimeout = useRef(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    const fetchPending = () => {
      Promise.all([
        api.get('/reviews/admin/pending'),
        api.get('/workshops/admin/pending')
      ]).then(([reviews, workshops]) => {
        setPendingCount(reviews.data.length + workshops.data.length);
      }).catch(() => {});
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAccountMenuOpen]);

  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
    setIsServicesMenuOpen(false);
    setIsMobileServicesOpen(false);
  };

  const handleServicesMouseEnter = () => {
    clearTimeout(servicesHoverTimeout.current);
    setIsServicesMenuOpen(true);
  };

  const handleServicesMouseLeave = () => {
    servicesHoverTimeout.current = setTimeout(() => {
      setIsServicesMenuOpen(false);
    }, 150);
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center text-slate-900" aria-label="revHaus">
          <img
            src="/revHaus_logo.png"
            alt="revHaus"
            className="h-9 w-9 object-contain md:h-10 md:w-10"
            style={{ width: '75px', height: '75px' }}
          />
        </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="rounded-md border border-slate-300 p-2 text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={navClass}>
            Home
          </NavLink>

          {/* Services hover dropdown */}
          <div
            ref={servicesMenuRef}
            className="relative"
            onMouseEnter={handleServicesMouseEnter}
            onMouseLeave={handleServicesMouseLeave}
          >
            <button
              type="button"
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Services
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 transition-transform ${isServicesMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isServicesMenuOpen && (
              <div className="absolute left-0 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-50">
                <NavLink
                  to="/towing"
                  onClick={closeMenus}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  
                  Towing
                </NavLink>
              </div>
            )}
          </div>

          {isAuthenticated && (
            <>
              <NavLink to="/favorites" className={navClass}>
                Favorites
              </NavLink>
              <NavLink to="/profile" className={navClass}>
                Profile
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={({ isActive }) =>
                  `relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }>
                  Dashboard
                  {pendingCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold leading-none text-white">
                      {pendingCount}
                    </span>
                  )}
                </NavLink>
              )}
            </>
          )}

          {!isAuthenticated ? (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((current) => !current)}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Account</p>
                  <NavLink
                    to="/login"
                    onClick={closeMenus}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    onClick={closeMenus}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Register
                  </NavLink>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              title={user?.email}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          )}
          </nav>
        </div>

        {isMobileMenuOpen && (
          <nav className="mt-3 grid gap-1 border-t border-slate-200 pt-3 md:hidden">
            <NavLink to="/" onClick={closeMenus} className={navClass}>
              Home
            </NavLink>

            {/* Mobile Services section */}
            <div>
              <button
                type="button"
                onClick={() => setIsMobileServicesOpen((c) => !c)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Services
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 transition-transform ${isMobileServicesOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isMobileServicesOpen && (
                <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-slate-200 pl-3">
                  <NavLink to="/towing" onClick={closeMenus} className={navClass}>
                    Towing
                  </NavLink>
                </div>
              )}
            </div>

            {isAuthenticated && (
              <>
                <NavLink to="/favorites" onClick={closeMenus} className={navClass}>
                  Favorites
                </NavLink>
                <NavLink to="/profile" onClick={closeMenus} className={navClass}>
                  Profile
                </NavLink>
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    onClick={closeMenus}
                    className={({ isActive }) =>
                      `relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ${
                        isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`
                    }
                  >
                    Dashboard
                    {pendingCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold leading-none text-white">
                        {pendingCount}
                      </span>
                    )}
                  </NavLink>
                )}
              </>
            )}

            {!isAuthenticated ? (
              <div className="mt-1 space-y-0.5 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="px-2 pb-1 pt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Account</p>
                <NavLink to="/login" onClick={closeMenus} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login
                </NavLink>
                <NavLink to="/register" onClick={closeMenus} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Register
                </NavLink>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeMenus();
                  logout();
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                title={user?.email}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
