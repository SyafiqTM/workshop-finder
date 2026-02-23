import { Link, NavLink } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '../hooks/useAuth.jsx';

const navClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`;

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

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
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold text-slate-900">
          Workshop Finder
        </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 md:hidden"
            aria-label="Toggle menu"
          >
            Menu
          </button>

          <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={navClass}>
            Home
          </NavLink>
          <NavLink to="/towing" className={navClass}>
            Towing
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/favorites" className={navClass}>
                Favorites
              </NavLink>
              <NavLink to="/create-workshop" className={navClass}>
                Add Workshop
              </NavLink>
              <NavLink to="/profile" className={navClass}>
                Profile
              </NavLink>
            </>
          )}

          {!isAuthenticated ? (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((current) => !current)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Account
              </button>
              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-md border border-slate-200 bg-white p-1 shadow">
                  <NavLink
                    to="/login"
                    onClick={closeMenus}
                    className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    onClick={closeMenus}
                    className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Register
                  </NavLink>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={logout}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              title={user?.email}
            >
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
            <NavLink to="/towing" onClick={closeMenus} className={navClass}>
              Towing
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/favorites" onClick={closeMenus} className={navClass}>
                  Favorites
                </NavLink>
                <NavLink to="/create-workshop" onClick={closeMenus} className={navClass}>
                  Add Workshop
                </NavLink>
                <NavLink to="/profile" onClick={closeMenus} className={navClass}>
                  Profile
                </NavLink>
              </>
            )}

            {!isAuthenticated ? (
              <div className="space-y-1">
                <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Account</p>
                <NavLink to="/login" onClick={closeMenus} className={navClass}>
                  Login
                </NavLink>
                <NavLink to="/register" onClick={closeMenus} className={navClass}>
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
                className="rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                title={user?.email}
              >
                Logout
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
