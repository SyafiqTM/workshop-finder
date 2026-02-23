import { Link, NavLink } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.jsx';

const navClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`;

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-slate-900">
          Workshop Finder
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" className={navClass}>
            Home
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
            <>
              <NavLink to="/login" className={navClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={navClass}>
                Register
              </NavLink>
            </>
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
    </header>
  );
}
