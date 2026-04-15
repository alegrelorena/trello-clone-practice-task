import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const dropdownRef = useRef(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="glass h-12 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50">
      <Link
        to="/boards"
        className="flex items-center gap-2 group"
      >
        <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg">
          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="18" rx="1" />
            <rect x="14" y="3" width="7" height="11" rx="1" />
          </svg>
        </div>
        <span className="text-sm font-bold gradient-text tracking-wide">Trello Clone</span>
      </Link>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

      {user && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2.5 py-1.5 transition-colors group"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white shadow">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)]">{user.name}</span>
            <svg
              className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-52 rounded-xl shadow-2xl border border-white/10 py-1 overflow-hidden"
              style={{ background: 'var(--bg-surface-2)' }}>
              <div className="px-4 py-2.5 border-b border-white/5">
                <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </header>
  );
}
