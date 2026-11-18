/* ==========================================================================
   My Note - Modals (Modales génériques: rename, confirm, addTag, etc.)
   ========================================================================== */

import { store, closeModal, showToast, loadNote } from './store.js';
import { updateNote, getNote } from './db.js';
import { t } from './i18n.js';

/* ==========================================================================
   Rendu modales génériques
   ========================================================================== */

export function renderModals() {
  const container = document.getElementById('modalsContainer');
  if (!container) return;
  
  // Les modales sont injectées dynamiquement par les modules qui en ont besoin
  // Ici on ne fait que le container
  container.innerHTML = '';
}

export function renderRenameModal(noteId, currentTitle) {
  return `
    <div class="modal-overlay" id="renameModal" role="dialog" aria-modal="true" aria-labelledby="renameTitle">
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title" id="renameTitle" data-i18n="rename">${t('rename')}</h3>
          <button class="modal-close" data-close="renameModal" aria-label="${t('close')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="modal-body">
          <div class="input-wrapper">
            <input type="text" class="find-input" id="renameInput" value="${escapeHtml(currentTitle)}" aria-label="${t('title')}" autocomplete="off" spellcheck="false">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-close="renameModal" data-i18n="cancel">${t('cancel')}</button>
          <button class="btn btn-primary" id="renameConfirmBtn" data-i18n="save">${t('save')}</button>
        </div>
      </div>
    </div>
  `;
}

export function renderAddTagModal(noteId) {
  return `
    <div class="modal-overlay" id="addTagModal" role="dialog" aria-modal="true" aria-labelledby="addTagTitle">
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title" id="addTagTitle" data-i18n="addTag">${t('addTag')}</h3>
          <button class="modal-close" data-close="addTagModal" aria-label="${t('close')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="modal-body">
          <div class="input-wrapper">
            <input type="text" class="find-input" id="addTagInput" placeholder="${t('tagPlaceholder')}" data-i18n-placeholder="tagPlaceholder" aria-label="${t('addTag')}" autocomplete="off" spellcheck="false">
          </div>
          <p style="font-size: var(--font-size-xs); color: var(--muted); margin-top: var(--space-2);" data-i18n="tagHint">${t('tagHint')}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-close="addTagModal" data-i18n="cancel">${t('cancel')}</button>
          <button class="btn btn-primary" id="addTagConfirmBtn" data-i18n="add">${t('add')}</button>
        </div>
      </div>
    </div>
  `;
}

export function renderConfirmModal(id, title, message, confirmText, confirmClass = 'btn-danger') {
  return `
    <div class="modal-overlay" id="${id}" role="dialog" aria-modal="true" aria-labelledby="${id}Title">
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title" id="${id}Title">${escapeHtml(title)}</h3>
          <button class="modal-close" data-close="${id}" aria-label="${t('close')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="modal-body">
          <p style="color: var(--text);">${escapeHtml(message)}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-close="${id}" data-i18n="cancel">${t('cancel')}</button>
          <button class="btn ${confirmClass}" id="${id}ConfirmBtn">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   Setup modales génériques
   ========================================================================== */

export function setupModals() {
  const container = document.getElementById('modalsContainer');
  if (!container) return;
  
  // Delegation pour fermetures
  container.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('[data-close]');
    if (closeBtn) {
      const modalId = closeBtn.dataset.close;
      closeModal(modalId);
      // Supprime le modal du DOM
      const modal = document.getElementById(modalId);
      if (modal) modal.remove();
    }
    
    // Boutons de confirmation génériques
    const confirmBtn = e.target.closest('[id$="ConfirmBtn"]');
    if (confirmBtn) {
      const modalId = confirmBtn.id.replace('ConfirmBtn', '');
      handleModalConfirm(modalId);
    }
  });
  
  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal-overlay.open');
      if (openModal) {
        const modalId = openModal.id;
        closeModal(modalId);
        openModal.remove();
      }
    }
  });
}

function handleModalConfirm(modalId) {
  const input = document.getElementById(`${modalId}Input`);
  
  switch (modalId) {
    case 'renameModal':
      handleRename(input?.value);
      break;
    case 'addTagModal':
      handleAddTag(input?.value);
      break;
    case 'confirmDelete':
      handleConfirmDelete();
      break;
    case 'confirmClearTrash':
      handleConfirmClearTrash();
      break;
  }
}

async function handleRename(newTitle) {
  const { modals } = store.getState();
  const data = modals.rename?.data;
  if (!data?.noteId || !newTitle?.trim()) return;
  
  await updateNote(data.noteId, { title: newTitle.trim() });
  showToast(t('renamed'), 'success');
  closeModal('renameModal');
  document.getElementById('renameModal')?.remove();
  
  // Recharge si note active
  const { activeNoteId } = store.getState();
  if (activeNoteId === data.noteId) {
    loadNote(data.noteId);
  }
}

async function handleAddTag(tag) {
  const { modals } = store.getState();
  const data = modals.addTag?.data;
  if (!data?.noteId || !tag?.trim()) return;
  
  const normalized = tag.trim().toLowerCase().replace(/^#/, '');
  await import('./db.js').then(m => m.addTag(data.noteId, normalized));
  showToast(t('tagAdded'), 'success');
  closeModal('addTagModal');
  document.getElementById('addTagModal')?.remove();
}

async function handleConfirmDelete() {
  const { modals } = store.getState();
  const noteId = modals.confirmDelete?.data?.noteId;
  if (!noteId) return;
  
  await import('./db.js').then(m => m.deleteNote(noteId));
  showToast(t('deleted'), 'success');
  closeModal('confirmDelete');
  document.getElementById('confirmDelete')?.remove();
  import('./store.js').then(m => m.refreshNotesList());
}

async function handleConfirmClearTrash() {
  const { emptyTrash } = await import('./db.js');
  const count = await emptyTrash();
  showToast(`${count} ${t('notesDeletedPermanently')}`, 'success');
  closeModal('confirmClearTrash');
  document.getElementById('confirmClearTrash')?.remove();
  import('./store.js').then(m => m.refreshNotesList());
}

/* ==========================================================================
   Helpers pour ouvrir modales
   ========================================================================== */

export function openRenameModal(noteId, currentTitle) {
  const container = document.getElementById('modalsContainer');
  if (!container) return;
  
  container.insertAdjacentHTML('beforeend', renderRenameModal(noteId, currentTitle));
  
  const modal = document.getElementById('renameModal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const input = document.getElementById('renameInput');
      input?.focus();
      input?.select();
    }, 50);
  }
  
  store.set({ modals: { ...store.getState().modals, rename: { open: true, data: { noteId, currentTitle } } } });
}

export function openAddTagModal(noteId) {
  const container = document.getElementById('modalsContainer');
  if (!container) return;
  
  container.insertAdjacentHTML('beforeend', renderAddTagModal(noteId));
  
  const modal = document.getElementById('addTagModal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const input = document.getElementById('addTagInput');
      input?.focus();
    }, 50);
  }
  
  store.set({ modals: { ...store.getState().modals, addTag: { open: true, data: { noteId } } } });
}

export function openConfirmDeleteModal(noteId) {
  const container = document.getElementById('modalsContainer');
  if (!container) return;
  
  container.insertAdjacentHTML('beforeend', renderConfirmModal(
    'confirmDelete',
    t('delete'),
    t('confirmDeleteNote'),
    t('delete'),
    'btn-danger'
  ));
  
  const modal = document.getElementById('confirmDelete');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  
  store.set({ modals: { ...store.getState().modals, confirmDelete: { open: true, data: { noteId } } } });
}

export function openConfirmClearTrashModal() {
  const container = document.getElementById('modalsContainer');
  if (!container) return;
  
  container.insertAdjacentHTML('beforeend', renderConfirmModal(
    'confirmClearTrash',
    t('emptyTrash'),
    t('confirmClearTrash').replace('{{count}}', 'X'), // Sera mis à jour
    t('emptyTrash'),
    'btn-danger'
  ));
  
  const modal = document.getElementById('confirmClearTrash');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  
  store.set({ modals: { ...store.getState().modals, confirmClearTrash: { open: true } } });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}