import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import * as cardDetailsApi from '../api/cardDetails.js';
import * as cardsApi from '../api/cards.js';
import DueDateBadge from './DueDateBadge.jsx';

function relativeTime(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;
}

const LABEL_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#a855f7', '#6366f1'];

export default function CardModal({ card: initialCard, listId, onClose, onUpdate }) {
  const [card, setCard] = useState(initialCard);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(initialCard.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState(initialCard.description || '');
  const [dueDate, setDueDate] = useState(initialCard.dueDate ? initialCard.dueDate.slice(0, 10) : '');
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [labelText, setLabelText] = useState('');
  const [labelColor, setLabelColor] = useState(LABEL_COLORS[0]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [newItemTexts, setNewItemTexts] = useState({});
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const modalRef = useRef(null);
  const titleInputRef = useRef(null);

  async function refreshCard() {
    try {
      const fullCard = await cardDetailsApi.getCard(card.id);
      setCard(fullCard);
      onUpdate(fullCard);
    } catch {
      // keep existing data
    }
  }

  async function loadComments() {
    try {
      const data = await cardDetailsApi.getComments(card.id);
      setComments(data);
    } catch {
      // keep existing
    }
  }

  useEffect(() => { refreshCard(); loadComments(); }, []);

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setSubmittingComment(true);
    try {
      const comment = await cardDetailsApi.addComment(card.id, { text: newCommentText.trim() });
      setComments((prev) => [comment, ...prev]);
      setNewCommentText('');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  }

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    function handleEsc(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  async function saveTitle() {
    if (!title.trim()) { setTitle(card.title); setEditingTitle(false); return; }
    try {
      const updated = await cardsApi.updateCard(listId, card.id, { title: title.trim() });
      setCard((prev) => ({ ...prev, title: updated.title }));
      onUpdate({ ...card, title: updated.title });
    } catch {
      toast.error('Failed to update title');
      setTitle(card.title);
    }
    setEditingTitle(false);
  }

  async function saveDescription() {
    try {
      const updated = await cardsApi.updateCard(listId, card.id, { description });
      setCard((prev) => ({ ...prev, description: updated.description }));
      onUpdate({ ...card, description: updated.description });
    } catch {
      toast.error('Failed to update description');
    }
    setEditingDesc(false);
  }

  async function saveDueDate(value) {
    setDueDate(value);
    try {
      const payload = value ? { dueDate: value } : { dueDate: null };
      const updated = await cardsApi.updateCard(listId, card.id, payload);
      setCard((prev) => ({ ...prev, dueDate: updated.dueDate }));
      onUpdate({ ...card, dueDate: updated.dueDate });
    } catch {
      toast.error('Failed to update due date');
    }
  }

  async function handleAddLabel() {
    if (!labelText.trim()) return;
    try {
      await cardDetailsApi.addLabel(card.id, { text: labelText.trim(), color: labelColor });
      await refreshCard();
      setLabelText('');
      setShowLabelForm(false);
    } catch { toast.error('Failed to add label'); }
  }

  async function handleDeleteLabel(labelId) {
    try {
      await cardDetailsApi.deleteLabel(card.id, labelId);
      await refreshCard();
    } catch { toast.error('Failed to delete label'); }
  }

  async function handleAddChecklist() {
    if (!newChecklistTitle.trim()) return;
    try {
      await cardDetailsApi.addChecklist(card.id, { title: newChecklistTitle.trim() });
      await refreshCard();
      setNewChecklistTitle('');
      setShowChecklistForm(false);
    } catch { toast.error('Failed to add checklist'); }
  }

  async function handleDeleteChecklist(checklistId) {
    try {
      await cardDetailsApi.deleteChecklist(card.id, checklistId);
      await refreshCard();
    } catch { toast.error('Failed to delete checklist'); }
  }

  async function handleAddChecklistItem(checklistId) {
    const text = newItemTexts[checklistId]?.trim();
    if (!text) return;
    try {
      await cardDetailsApi.addChecklistItem(card.id, checklistId, { text });
      await refreshCard();
      setNewItemTexts((prev) => ({ ...prev, [checklistId]: '' }));
    } catch { toast.error('Failed to add item'); }
  }

  async function handleToggleItem(checklistId, itemId) {
    try {
      await cardDetailsApi.toggleChecklistItem(card.id, checklistId, itemId);
      await refreshCard();
    } catch { toast.error('Failed to toggle item'); }
  }

  async function handleDeleteItem(checklistId, itemId) {
    try {
      await cardDetailsApi.deleteChecklistItem(card.id, checklistId, itemId);
      await refreshCard();
    } catch { toast.error('Failed to delete item'); }
  }

  const inputStyle = {
    background: 'var(--bg-surface-3)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  };

  const sectionLabel = {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '10px',
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto py-12 px-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="rounded-2xl w-full max-w-2xl p-6 relative border border-white/8 shadow-2xl"
        style={{ background: 'var(--bg-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <div className="mb-6 pr-10">
          {editingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') { setTitle(card.title); setEditingTitle(false); }
              }}
              className="text-xl font-bold w-full rounded-lg px-3 py-1.5 outline-none"
              style={{ ...inputStyle, borderColor: 'var(--accent-indigo)', boxShadow: '0 0 0 3px rgba(99,102,241,0.15)' }}
            />
          ) : (
            <h2
              onClick={() => setEditingTitle(true)}
              className="text-xl font-bold cursor-pointer rounded-lg px-3 py-1.5 -mx-3 transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
            >
              {card.title}
            </h2>
          )}
        </div>

        {/* Labels */}
        <div className="mb-6">
          <div style={sectionLabel}>Labels</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {card.labels?.map((label) => (
              <span
                key={label.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-semibold"
                style={{ backgroundColor: label.color }}
              >
                {label.text}
                <button
                  onClick={() => handleDeleteLabel(label.id)}
                  className="hover:bg-white/25 rounded-full p-0.5 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>

          {showLabelForm ? (
            <div className="rounded-xl border border-white/8 p-3" style={{ background: 'var(--bg-surface-2)' }}>
              <input
                type="text"
                placeholder="Label text"
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                className="w-full rounded-lg px-3 py-1.5 text-sm mb-2 outline-none"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-indigo)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
              />
              <div className="flex gap-2 mb-2">
                {LABEL_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setLabelColor(color)}
                    className={`w-7 h-7 rounded-lg transition-all ${labelColor === color ? 'scale-110 ring-2 ring-white/40 ring-offset-1' : 'hover:scale-105'}`}
                    style={{ background: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddLabel}
                  className="btn-glow px-3 py-1 rounded-lg text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #22d3ee)' }}>
                  Add
                </button>
                <button onClick={() => setShowLabelForm(false)}
                  className="px-3 py-1 text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLabelForm(true)}
              className="text-sm px-2 py-1 rounded-lg transition-colors"
              style={{ color: 'var(--accent-cyan)' }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(34,211,238,0.07)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
            >
              + Add Label
            </button>
          )}
        </div>

        {/* Due Date */}
        <div className="mb-6">
          <div style={sectionLabel}>Due Date</div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => saveDueDate(e.target.value)}
              className="rounded-lg px-3 py-1.5 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent-indigo)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
            />
            {card.dueDate && (
              <>
                <DueDateBadge date={card.dueDate} />
                <button
                  onClick={() => saveDueDate('')}
                  className="p-1 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <div style={sectionLabel}>Description</div>
          {editingDesc ? (
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                autoFocus
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y transition-all"
                style={{ ...inputStyle, borderColor: 'var(--accent-indigo)', boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' }}
              />
              <div className="flex gap-2 mt-2">
                <button onClick={saveDescription}
                  className="btn-glow px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #22d3ee)' }}>
                  Save
                </button>
                <button onClick={() => { setDescription(card.description || ''); setEditingDesc(false); }}
                  className="px-3 py-1.5 text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setEditingDesc(true)}
              className="min-h-[60px] rounded-lg p-3 text-sm cursor-pointer transition-colors whitespace-pre-wrap border border-white/5"
              style={{ background: 'var(--bg-surface-2)', color: card.description ? 'var(--text-primary)' : 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
            >
              {card.description || 'Add a more detailed description…'}
            </div>
          )}
        </div>

        {/* Checklists */}
        <div className="mb-4">
          <div style={sectionLabel}>Checklists</div>

          {card.checklists?.map((checklist) => {
            const total = checklist.items?.length || 0;
            const checked = checklist.items?.filter((i) => i.checked).length || 0;
            const percent = total > 0 ? Math.round((checked / total) * 100) : 0;

            return (
              <div key={checklist.id} className="mb-4 rounded-xl border border-white/6 p-3"
                style={{ background: 'var(--bg-surface-2)' }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{checklist.title}</h4>
                  <button
                    onClick={() => handleDeleteChecklist(checklist.id)}
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { e.target.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)'; }}
                  >
                    Delete
                  </button>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs w-8" style={{ color: 'var(--text-muted)' }}>{percent}%</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-3)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percent}%`,
                        background: percent === 100
                          ? 'linear-gradient(90deg, #10b981, #22d3ee)'
                          : 'linear-gradient(90deg, #6366f1, #22d3ee)',
                      }}
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 mb-2">
                  {checklist.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 group rounded-lg px-2 py-1 transition-colors"
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleItem(checklist.id, item.id)}
                        className="cursor-pointer accent-indigo-500"
                        style={{ accentColor: 'var(--accent-indigo)' }}
                      />
                      <span className={`flex-1 text-sm ${item.checked ? 'line-through' : ''}`}
                        style={{ color: item.checked ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        {item.text}
                      </span>
                      <button
                        onClick={() => handleDeleteItem(checklist.id, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add item */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an item…"
                    value={newItemTexts[checklist.id] || ''}
                    onChange={(e) => setNewItemTexts((prev) => ({ ...prev, [checklist.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem(checklist.id)}
                    className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent-indigo)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                  />
                  <button
                    onClick={() => handleAddChecklistItem(checklist.id)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-white/10"
                    style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-3)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })}

          {showChecklistForm ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Checklist title…"
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                autoFocus
                className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-indigo)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
              />
              <button onClick={handleAddChecklist}
                className="btn-glow px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #22d3ee)' }}>
                Add
              </button>
              <button onClick={() => { setShowChecklistForm(false); setNewChecklistTitle(''); }}
                className="px-2 py-1.5 text-sm transition-colors"
                style={{ color: 'var(--text-secondary)' }}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowChecklistForm(true)}
              className="text-sm px-2 py-1 rounded-lg transition-colors"
              style={{ color: 'var(--accent-cyan)' }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(34,211,238,0.07)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
            >
              + Add Checklist
            </button>
          )}
        </div>

        {/* Comments */}
        <div className="mt-6 pt-6 border-t border-white/5">
          <div style={sectionLabel}>Comments</div>

          {/* New comment form */}
          <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Write a comment…"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent-indigo)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
            <button
              type="submit"
              disabled={submittingComment || !newCommentText.trim()}
              className="btn-glow px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #6366f1, #22d3ee)' }}
            >
              Post
            </button>
          </form>

          {/* Comment list */}
          {comments.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #22d3ee)' }}>
                    {comment.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {comment.user.name}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {relativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
