import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header.jsx';
import * as boardsApi from '../api/boards.js';

const PRESET_COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#a855f7'];

export default function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, []);

  async function fetchBoards() {
    try {
      const boards = await boardsApi.getBoards();
      setBoards(boards);
    } catch {
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBoard(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const board = await boardsApi.createBoard({ title: newTitle.trim(), color: newColor });
      setBoards((prev) => [...prev, board]);
      setNewTitle('');
      setNewColor(PRESET_COLORS[0]);
      setShowForm(false);
      toast.success('Board created');
    } catch {
      toast.error('Failed to create board');
    }
  }

  async function handleDeleteBoard(e, boardId, boardTitle) {
    e.stopPropagation();
    if (!window.confirm(`Delete board "${boardTitle}"? This cannot be undone.`)) return;
    try {
      await boardsApi.deleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      toast.success('Board deleted');
    } catch {
      toast.error('Failed to delete board');
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Ambient glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />
      </div>

      <Header />

      <main className="pt-12">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold gradient-text">Your Boards</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {boards.length} {boards.length === 1 ? 'board' : 'boards'}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: 'var(--accent-indigo)', borderRightColor: 'var(--accent-cyan)' }} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => navigate(`/boards/${board.id}`)}
                  className="relative group rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between min-h-32 border border-white/5 hover:border-white/15"
                  style={{
                    background: `linear-gradient(135deg, ${board.color}33 0%, ${board.color}18 100%)`,
                    borderColor: `${board.color}30`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 20px ${board.color}30, 0 4px 20px rgba(0,0,0,0.3)`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Accent line */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
                    style={{ background: `linear-gradient(90deg, ${board.color}, transparent)` }} />

                  <h3 className="text-white font-bold text-sm truncate pr-6">{board.title}</h3>

                  {board.stats && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.75)' }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
                        </svg>
                        {board.stats.listCount} {board.stats.listCount === 1 ? 'list' : 'lists'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.75)' }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {board.stats.taskCount} {board.stats.taskCount === 1 ? 'task' : 'tasks'}
                      </span>
                      {board.stats.overdueCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium text-white"
                          style={{ background: 'rgba(239,68,68,0.55)' }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {board.stats.overdueCount} overdue
                        </span>
                      )}
                      {board.stats.dueSoonCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium text-white"
                          style={{ background: 'rgba(245,158,11,0.55)' }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {board.stats.dueSoonCount} due soon
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    onClick={(e) => handleDeleteBoard(e, board.id, board.title)}
                    className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 rounded-lg p-1.5 transition-all"
                    style={{ background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.7)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                    title="Delete board"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Create new board */}
              {showForm ? (
                <div className="rounded-xl border p-4 shadow-xl"
                  style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                  <form onSubmit={handleCreateBoard}>
                    <input
                      type="text"
                      placeholder="Board title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      autoFocus
                      className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none transition-all"
                      style={{
                        background: 'var(--bg-surface-3)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--accent-indigo)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                    />
                    <div className="flex gap-2 mb-3">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewColor(color)}
                          className={`w-7 h-7 rounded-lg transition-all ${newColor === color ? 'scale-110 ring-2 ring-white/40 ring-offset-1 ring-offset-transparent' : 'hover:scale-105'}`}
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button type="submit"
                        className="btn-glow px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #22d3ee)' }}>
                        Create
                      </button>
                      <button type="button"
                        onClick={() => { setShowForm(false); setNewTitle(''); }}
                        className="px-2 text-sm transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => { e.target.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={(e) => { e.target.style.color = 'var(--text-secondary)'; }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div
                  onClick={() => setShowForm(true)}
                  className="rounded-xl border border-dashed min-h-32 p-4 cursor-pointer transition-all flex items-center justify-center group"
                  style={{ borderColor: 'var(--border)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                    e.currentTarget.style.background = 'rgba(99,102,241,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span className="text-sm flex items-center gap-1.5 font-medium transition-colors"
                    style={{ color: 'var(--text-muted)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create new board
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
