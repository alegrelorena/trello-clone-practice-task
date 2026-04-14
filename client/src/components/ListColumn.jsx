import { useState, useRef, useEffect } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import * as listsApi from '../api/lists.js';
import * as cardsApi from '../api/cards.js';
import CardTile from './CardTile.jsx';
import CardModal from './CardModal.jsx';

export default function ListColumn({ list, index, boardId, onListUpdate, onListDelete, onCardUpdate }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const titleInputRef = useRef(null);
  const newCardInputRef = useRef(null);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (addingCard && newCardInputRef.current) {
      newCardInputRef.current.focus();
    }
  }, [addingCard]);

  async function saveTitle() {
    if (!title.trim()) {
      setTitle(list.title);
      setEditingTitle(false);
      return;
    }
    if (title.trim() !== list.title) {
      try {
        await listsApi.updateList(boardId, list.id, { title: title.trim() });
        onListUpdate(list.id, { title: title.trim() });
      } catch {
        toast.error('Failed to update list title');
        setTitle(list.title);
      }
    }
    setEditingTitle(false);
  }

  async function handleAddCard() {
    if (!newCardTitle.trim()) return;
    try {
      const card = await cardsApi.createCard(list.id, { title: newCardTitle.trim() });
      onCardUpdate(list.id, [...(list.cards || []), card]);
      setNewCardTitle('');
      setAddingCard(false);
    } catch {
      toast.error('Failed to create card');
    }
  }

  async function handleDeleteList() {
    if (!window.confirm(`Delete list "${list.title}" and all its cards?`)) return;
    try {
      await listsApi.deleteList(boardId, list.id);
      onListDelete(list.id);
    } catch {
      toast.error('Failed to delete list');
    }
  }

  function handleCardModalUpdate(updatedCard) {
    const updatedCards = (list.cards || []).map((c) =>
      c.id === updatedCard.id ? { ...c, ...updatedCard } : c
    );
    onCardUpdate(list.id, updatedCards);
  }

  return (
    <>
      <Draggable draggableId={list.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`rounded-xl w-72 flex-shrink-0 flex flex-col max-h-full border border-white/6
              ${snapshot.isDragging ? 'shadow-2xl rotate-1 border-white/15' : ''}`}
            style={{ background: 'var(--bg-surface)' }}
          >
            {/* List header */}
            <div
              {...provided.dragHandleProps}
              className="flex items-center justify-between px-3 py-2.5 cursor-grab border-b border-white/5"
            >
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') { setTitle(list.title); setEditingTitle(false); }
                  }}
                  className="flex-1 text-sm font-semibold rounded-lg px-2 py-0.5 outline-none"
                  style={{
                    background: 'var(--bg-surface-3)',
                    border: '1px solid var(--accent-indigo)',
                    color: 'var(--text-primary)',
                  }}
                />
              ) : (
                <h3
                  onClick={() => setEditingTitle(true)}
                  className="flex-1 font-semibold text-sm cursor-pointer rounded-lg px-2 py-0.5 truncate transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                >
                  {list.title}
                </h3>
              )}

              <button
                onClick={handleDeleteList}
                className="ml-2 p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Cards */}
            <Droppable droppableId={list.id} type="CARD">
              {(droppableProvided, droppableSnapshot) => (
                <div
                  ref={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                  className={`flex-1 overflow-y-auto px-2 pb-1 min-h-[4px] rounded-lg mx-1 transition-colors ${
                    droppableSnapshot.isDraggingOver ? 'bg-indigo-500/5' : ''
                  }`}
                >
                  {(list.cards || []).map((card, cardIndex) => (
                    <CardTile
                      key={card.id}
                      card={card}
                      index={cardIndex}
                      onClick={() => setSelectedCard(card)}
                    />
                  ))}
                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Add card */}
            <div className="px-2 pb-2 pt-1">
              {addingCard ? (
                <div>
                  <textarea
                    ref={newCardInputRef}
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(); }
                      if (e.key === 'Escape') { setAddingCard(false); setNewCardTitle(''); }
                    }}
                    placeholder="Enter a title for this card..."
                    rows={2}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none transition-all"
                    style={{
                      background: 'var(--bg-surface-3)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent-indigo)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                  />
                  <div className="flex gap-2 mt-1.5">
                    <button
                      onClick={handleAddCard}
                      className="btn-glow px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #22d3ee)' }}>
                      Add card
                    </button>
                    <button
                      onClick={() => { setAddingCard(false); setNewCardTitle(''); }}
                      className="p-1.5 rounded transition-colors"
                      style={{ color: 'var(--text-secondary)' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingCard(true)}
                  className="w-full text-left text-sm rounded-lg px-3 py-2 transition-all flex items-center gap-1"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add a card
                </button>
              )}
            </div>
          </div>
        )}
      </Draggable>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          listId={list.id}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardModalUpdate}
        />
      )}
    </>
  );
}
