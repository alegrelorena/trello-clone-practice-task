import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/boards');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-glow flex items-center justify-center px-4"
      style={{ background: 'var(--bg-base)' }}>
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-white/8 p-8 shadow-2xl"
          style={{ background: 'var(--bg-surface)' }}>
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="11" rx="1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold gradient-text">Welcome back</h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
              Log in to your Trello Clone account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: 'var(--bg-surface-3)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-indigo)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: 'var(--bg-surface-3)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-indigo)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-glow w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              style={{ background: 'linear-gradient(135deg, #6366f1, #22d3ee)' }}
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium hover:text-white transition-colors"
              style={{ color: 'var(--accent-cyan)' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
