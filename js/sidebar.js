/* ==========================================================================
   My Note - Sidebar (Liste des notes, filtres, tags)
   ========================================================================== */

import { store, loadNote, refreshNotesList, setSearchQuery, showToast, openModal } from './store.js';
import { deleteNote, restoreNote, togglePin, toggleArchive, addTag, removeTag, 
         setNoteColor, duplicateNote, getAllTags } from './db.js';
import { t } from './i18n.js';
import { formatDate, extractTitle } from './utils.js';

let notesList = null;
let sidebar = null;

/* ==========================================================================
   Rendu de la sidebar
   ========================================================================== */

export function renderSidebar() {
  sidebar = document.getElementById('sidebar');
  notesList = document.getElementById('notesList');
  if (!notesList) return;
  
  const { filteredNotes, searchQuery, activeNoteId, settings } = store.getState();
  
  if (filteredNotes.length === 0) {
    notesList.innerHTML = `
      <div class="empty-state" style="padding: var(--space-6) var(--space-4); text-align: center;">
        <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <rect width="64" height="64" rx="12" fill="#0A0A0B"/>
          <path d="M46.5 17.5 Q42 15 38 17 Q34 19 31 22 Q27 26 25 31 Q23 36 22.5 41 Q22 46 23 51 Q24 56 26.5 59.5" stroke="#E11D2E" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="empty-state-text" data-i18n="emptyStateTitle">${t('emptyStateTitle')}</p>
        <p class="empty-state-hint" data-i18n="emptyStateHint">${t('emptyStateHint')}</p>
      </div>
    `;
    return;
  }
  
  notesList.innerHTML = filteredNotes.map(note => {
    const isActive = note.id === activeNoteId;
    const isPinned = note.pinned;
    const isArchived = note.archived;
    const isDeleted = !!note.deletedAt;
    const isTrashed = isDeleted;
    
    let statusClass = '';
    let statusIcon = '';
    if (isTrashed) {
      statusClass = 'trashed';
      statusIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
    } else if (isArchived) {
      statusClass = 'archived';
      statusIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 12 18 3 8"></polyline><rect x="1" y="3" width="22" height="18" rx="2"></rect></svg>';
    } else if (isPinned) {
      statusIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17v5"></path><path d="M17 11a5 5 0 0 1-10 0v-3"></path></svg>';
    }
    
    const tagsHtml = note.tags.length > 0 ? `
      <div class="note-tags">
        ${note.tags.slice(0, 3).map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}
        ${note.tags.length > 3 ? `<span class="tag">+${note.tags.length - 3}</span>` : ''}
      </div>
    ` : '';
    
    const colorIndicator = note.color ? `
      <span class="color-dot" style="background: ${note.color};" title="${t('noteColor')}"></span>
    ` : '';
    
    return `
      <div class="note-item ${isActive ? 'active' : ''} ${isPinned ? 'pinned' : ''} ${statusClass}" 
           data-note-id="${note.id}"
           role="option"
           aria-selected="${isActive}"
           tabindex="0">
        <div class="note-icon">
          ${statusIcon}
        </div>
        <div class="note-content">
          <div class="note-title">${escapeHtml(note.title || t('untitled'))}</div>
          <div class="note-meta">
            ${colorIndicator}
            <span>${formatDate(note.updatedAt, { relative: true })}</span>
          </div>
          ${tagsHtml}
        </div>
        <button class="note-menu-btn" aria-label="${t('moreActions')}" data-note-menu="${note.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
          </svg>
        </button>
      </div>
    `;
  }).join('');
  
  // Applique les traductions
  import('./i18n.js').then(m => m.applyTranslations(notesList));
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   Setup event listeners
   ========================================================================== */

export function setupSidebar() {
  notesList = document.getElementById('notesList');
  if (!notesList) return;
  
  // Click sur note
  notesList.addEventListener('click', (e) => {
    const noteItem = e.target.closest('.note-item');
    const menuBtn = e.target.closest('[data-note-menu]');
    
    if (menuBtn) {
      e.stopPropagation();
      showNoteMenu(menuBtn, menuBtn.dataset.noteMenu);
      return;
    }
    
    if (noteItem) {
      const noteId = noteItem.dataset.noteId;
      loadNote(noteId);
      // Ferme sidebar sur mobile
      const { sidebarOpen } = store.getState();
      if (sidebarOpen) {
        import('./store.js').then(m => m.setSidebarOpen(false));
      }
    }
  });
  
  // Double-click pour renommer
  notesList.addEventListener('dblclick', (e) => {
    const noteItem = e.target.closest('.note-item');
    if (noteItem && !e.target.closest('.note-menu-btn')) {
      const noteId = noteItem.dataset.noteId;
      openRenameModal(noteId);
    }
  });
  
  // Navigation clavier
  notesList.addEventListener('keydown', (e) => {
    const items = notesList.querySelectorAll('.note-item');
    const activeItem = notesList.querySelector('.note-item.active');
    const currentIndex = Array.from(items).findIndex(el => el === activeItem);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusItem(items, currentIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusItem(items, currentIndex - 1);
        break;
      case 'Enter':
      case ' ':
        if (activeItem) {
          e.preventDefault();
          loadNote(activeItem.dataset.noteId);
        }
        break;
      case 'Delete':
        if (activeItem && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          deleteNoteAction(activeItem.dataset.noteId);
        }
        break;
      case 'p':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (activeItem) togglePinAction(activeItem.dataset.noteId);
        }
        break;
    }
  });
  
  // Context menu (clic droit)
  notesList.addEventListener('contextmenu', (e) => {
    const noteItem = e.target.closest('.note-item');
    if (noteItem) {
      e.preventDefault();
      showNoteMenu(noteItem, noteItem.dataset.noteId);
    }
  });
  
  // Drag & drop pour réordonner (optionnel, seulement notes épinglées)
  let draggedItem = null;
  
  notesList.addEventListener('dragstart', (e) => {
    const noteItem = e.target.closest('.note-item');
    if (noteItem) {
      draggedItem = noteItem;
      noteItem.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    }
  });
  
  notesList.addEventListener('dragend', () => {
    if (draggedItem) {
      draggedItem.classList.remove('dragging');
      draggedItem = null;
    }
  });
  
  notesList.addEventListener('dragover', (e) => {
    e.preventDefault();
    const noteItem = e.target.closest('.note-item');
    if (noteItem && noteItem !== draggedItem) {
      const rect = noteItem.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      noteItem.style.borderTop = e.clientY < mid ? '2px solid var(--accent)' : '';
      noteItem.style.borderBottom = e.clientY >= mid ? '2px solid var(--accent)' : '';
    }
  });
  
  notesList.addEventListener('drop', (e) => {
    e.preventDefault();
    const targetItem = e.target.closest('.note-item');
    if (draggedItem && targetItem && draggedItem !== targetItem) {
      // Réordonne seulement les notes épinglées entre elles
      const { notes } = store.getState();
      const pinnedNotes = notes.filter(n => n.pinned && !n.deletedAt && !n.archived);
      const fromIndex = pinnedNotes.findIndex(n => n.id === draggedItem.dataset.noteId);
      const toIndex = pinnedNotes.findIndex(n => n.id === targetItem.dataset.noteId);
      
      if (fromIndex !== -1 && toIndex !== -1) {
        // Met à jour l'ordre (via createdAt ou champ order)
        // Pour l'instant, on ne fait rien car pas de champ order
      }
    }
    notesList.querySelectorAll('.note-item').forEach(el => {
      el.style.borderTop = '';
      el.style.borderBottom = '';
    });
  });
  
  // Store subscription
  store.subscribe((state, prevState) => {
    if (state.filteredNotes !== prevState.filteredNotes || 
        state.activeNoteId !== prevState.activeNoteId ||
        state.searchQuery !== prevState.searchQuery) {
      renderSidebar();
    }
  });
}

function focusItem(items, index) {
  if (index < 0) index = items.length - 1;
  if (index >= items.length) index = 0;
  items[index]?.focus();
}

/* ==========================================================================
   Menu contextuel note
   ========================================================================== */

function showNoteMenu(trigger, noteId) {
  // Supprime menu existant
  document.querySelectorAll('.note-context-menu').forEach(m => m.remove());
  
  const { notes } = store.getState();
  const note = notes.find(n => n.id === noteId);
  if (!note) return;
  
  const isPinned = note.pinned;
  const isArchived = note.archived;
  const isTrashed = !!note.deletedAt;
  
  const menu = document.createElement('div');
  menu.className = 'dropdown-menu note-context-menu open';
  menu.style.position = 'fixed';
  menu.style.zIndex = '1000';
  
  const rect = trigger.getBoundingClientRect();
  menu.style.left = `${rect.right}px`;
  menu.style.top = `${rect.top}px`;
  
  menu.innerHTML = `
    <button class="dropdown-item" data-action="open">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      ${t('open')}
    </button>
    <button class="dropdown-item" data-action="rename">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
      ${t('rename')}
    </button>
    <button class="dropdown-item" data-action="duplicate">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      ${t('duplicate')}
    </button>
    <div class="dropdown-divider"></div>
    <button class="dropdown-item" data-action="pin">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17v5"></path><path d="M17 11a5 5 0 0 1-10 0v-3"></path></svg>
      ${isPinned ? t('unpin') : t('pin')}
    </button>
    <button class="dropdown-item" data-action="archive">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 12 18 3 8"></polyline><rect x="1" y="3" width="22" height="18" rx="2"></rect></svg>
      ${isArchived ? t('unarchive') : t('archive')}
    </button>
    ${!isTrashed ? `
      <button class="dropdown-item danger" data-action="delete">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        ${t('delete')}
      </button>
    ` : `
      <button class="dropdown-item" data-action="restore">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"></path><path d="M7 15l5 5 10-10"></path></svg>
        ${t('restore')}
      </button>
      <button class="dropdown-item danger" data-action="permanentDelete">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        ${t('permanentlyDelete')}
      </button>
    `}
    <div class="dropdown-divider"></div>
    <div class="dropdown-item" style="padding: var(--space-2) var(--space-3);">
      <span style="font-size: var(--font-size-xs); color: var(--muted);">${t('noteColor')}</span>
      <div class="color-picker" style="margin-top: var(--space-2);">
        ${['#E11D2E', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', ''].map(color => `
          <button class="color-option ${note.color === color ? 'selected' : ''}" 
                  data-color="${color}"
                  style="${color ? `background: ${color}` : 'background: repeating-linear-gradient(45deg, var(--surface-2), var(--surface-2) 4px, var(--border) 4px, var(--border) 8px)'}"
                  title="${color || t('noColor')}"
                  aria-label="${color || t('noColor')}"></button>
        `).join('')}
      </div>
    </div>
    <div class="dropdown-divider"></div>
    <div class="dropdown-item" style="padding: var(--space-2) var(--space-3);">
      <span style="font-size: var(--font-size-xs); color: var(--muted);">${t('tags')}</span>
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-1); margin-top: var(--space-2);">
        ${note.tags.map(tag => `
          <span class="tag" style="cursor: pointer;" data-tag="${tag}">
            #${escapeHtml(tag)}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 4px;">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
        `).join('')}
        <button class="btn btn-sm" style="padding: 2px 8px; font-size: var(--font-size-xs);" data-action="addTag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          ${t('addTag')}
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(menu);
  
  // Position correction
  const menuRect = menu.getBoundingClientRect();
  if (menuRect.right > window.innerWidth) {
    menu.style.left = `${rect.left - menuRect.width}px`;
  }
  if (menuRect.bottom > window.innerHeight) {
    menu.style.top = `${window.innerHeight - menuRect.height - 8}px`;
  }
  
  // Event listeners
  menu.addEventListener('click', async (e) => {
    const item = e.target.closest('[data-action]');
    const colorBtn = e.target.closest('[data-color]');
    const tagEl = e.target.closest('[data-tag]');
    
    if (colorBtn) {
      const color = colorBtn.dataset.color || null;
      await setNoteColor(noteId, color);
      menu.remove();
      return;
    }
    
    if (tagEl) {
      await removeTag(noteId, tagEl.dataset.tag);
      menu.remove();
      return;
    }
    
    if (item) {
      const action = item.dataset.action;
      menu.remove();
      
      switch (action) {
        case 'open':
          loadNote(noteId);
          break;
        case 'rename':
          openRenameModal(noteId);
          break;
        case 'duplicate':
          await duplicateNoteAction(noteId);
          break;
        case 'pin':
          await togglePinAction(noteId);
          break;
        case 'archive':
          await toggleArchiveAction(noteId);
          break;
        case 'delete':
          await deleteNoteAction(noteId);
          break;
        case 'restore':
          await restoreNoteAction(noteId);
          break;
        case 'permanentDelete':
          await permanentDeleteAction(noteId);
          break;
        case 'addTag':
          openAddTagModal(noteId);
          break;
      }
    }
  });
  
  // Ferme au clic extérieur
  const closeMenu = (e) => {
    if (!menu.contains(e.target) && e.target !== trigger) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

/* ==========================================================================
   Actions
   ========================================================================== */

async function togglePinAction(noteId) {
  const { notes } = store.getState();
  const note = notes.find(n => n.id === noteId);
  if (!note) return;
  await togglePin(noteId, !note.pinned);
  showToast(note.pinned ? t('unpinned') : t('pinned'), 'success');
}

async function toggleArchiveAction(noteId) {
  const { notes } = store.getState();
  const note = notes.find(n => n.id === noteId);
  if (!note) return;
  await toggleArchive(noteId, !note.archived);
  showToast(note.archived ? t('unarchived') : t('archived'), 'success');
}

async function deleteNoteAction(noteId) {
  const confirmed = confirm(t('confirmDeleteNote'));
  if (!confirmed) return;
  await deleteNote(noteId);
  showToast(t('deleted'), 'success');
}

async function restoreNoteAction(noteId) {
  await restoreNote(noteId);
  showToast(t('restored'), 'success');
}

async function permanentDeleteAction(noteId) {
  const confirmed = confirm(t('confirmDeletePermanent'));
  if (!confirmed) return;
  await import('./db.js').then(m => m.del('notes', noteId));
  showToast(t('permanentlyDeleted'), 'success');
}

async function duplicateNoteAction(noteId) {
  const newNote = await duplicateNote(noteId);
  if (newNote) {
    showToast(t('duplicated'), 'success');
    loadNote(newNote.id);
  }
}

function openRenameModal(noteId) {
  const { notes } = store.getState();
  const note = notes.find(n => n.id === noteId);
  if (!note) return;
  
  openModal('rename', { noteId, currentTitle: note.title });
}

function openAddTagModal(noteId) {
  openModal('addTag', { noteId });
}

/* ==========================================================================
   Raccourci pour nouvelle note
   ========================================================================== */

export function handleNewNoteShortcut() {
  import('./store.js').then(m => m.newTab());
}