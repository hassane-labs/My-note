/* ==========================================================================
   My Note - Revisions (Historique des versions par note)
   ========================================================================== */

import { store, openModal, closeModal, showToast, loadNote } from './store.js';
import { getRevisions, restoreRevision } from './db.js';
import { t } from './i18n.js';
import { formatDate, escapeHtml } from './utils.js';

let revisionsModal = null;
let revisionsList = null;
let currentNoteId = null;

/* ==========================================================================
   Rendu modal révisions
   ========================================================================== */

export function renderRevisionsModal() {
  return `
    <div class="modal-overlay" id="revisionsModal" role="dialog" aria-modal="true" aria-labelledby="revisionsTitle">
      <div class="modal" style="max-width: 720px; max-height: 85vh;">
        <div class="modal-header">
          <h3 class="modal-title" id="revisionsTitle" data-i18n="revisions">${t('revisions')}</h3>
          <button class="modal-close" data-close="revisionsModal" aria-label="${t('close')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="modal-body" style="padding: 0; max-height: 60vh; overflow-y: auto;">
          <div id="revisionsList" style="padding: var(--space-4);"></div>
        </div>
        <div class="modal-footer">
          <span id="revisionsCount" style="font-size: var(--font-size-sm); color: var(--muted);"></span>
        </div>
      </div>
    </div>
  `;
}

function renderRevisionsList(revisions) {
  if (!revisionsList) return;
  
  if (!revisions.length) {
    revisionsList.innerHTML = `
      <div class="empty-state" style="padding: var(--space-8);">
        <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <p class="empty-state-text">${t('noRevisions')}</p>
      </div>
    `;
    return;
  }
  
  revisionsList.innerHTML = revisions.map((rev, index) => {
    const isCurrent = index === revisions.length - 1;
    const dateStr = formatDate(rev.timestamp);
    
    // Calcule les stats de la révision
    const chars = rev.content?.length || 0;
    const words = rev.content ? rev.content.trim().split(/\s+/).length : 0;
    
    return `
      <div class="revision-item ${isCurrent ? 'current' : ''}" 
           data-index="${index}"
           style="padding: var(--space-3); border-bottom: 1px solid var(--border); cursor: pointer; transition: background var(--transition-fast);"
           onmouseover="this.style.background='var(--surface-2)'"
           onmouseout="this.style.background=''"
           tabindex="0"
           role="button"
           aria-label="${isCurrent ? t('currentVersion') : t('revision')} ${index + 1}: ${dateStr}"
      >
        <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1);">
              <span style="font-weight: 500; color: var(--text);">${escapeHtml(rev.title || t('untitled'))}</span>
              ${isCurrent ? `<span class="badge" style="font-size: var(--font-size-xs);">${t('currentVersion')}</span>` : ''}
            </div>
            <div style="font-size: var(--font-size-sm); color: var(--muted);">
              ${dateStr} · ${words} ${t('words')} · ${chars} ${t('chars')}
            </div>
          </div>
          ${!isCurrent ? `
            <button class="btn btn-sm btn-secondary restore-revision-btn" 
                    data-index="${index}"
                    style="flex-shrink: 0;"
                    data-i18n="restoreRevision"
                    aria-label="${t('restoreRevision')}"
            >${t('restoreRevision')}</button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  // Event listeners
  revisionsList.querySelectorAll('.restore-revision-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index, 10);
      restoreRevisionAction(index);
    });
  });
  
  revisionsList.querySelectorAll('.revision-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index, 10);
      showRevisionPreview(index);
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const index = parseInt(item.dataset.index, 10);
        showRevisionPreview(index);
      }
    });
  });
}

function showRevisionPreview(index) {
  const { revisions } = store.getState().modals.revisions?.data || { revisions: [] };
  const rev = revisions[index];
  if (!rev) return;
  
  // Ouvre une modale de comparaison ou affiche dans l'aperçu
  // Pour l'instant, on affiche un toast avec option de restaurer
  showToast(`${t('revision')} ${index + 1}: ${rev.title}`, 'info', 5000);
}

/* ==========================================================================
   Actions
   ========================================================================== */

export async function openRevisionsModal(noteId) {
  currentNoteId = noteId;
  
  const revisions = await getRevisions(noteId);
  
  // Injecte le modal s'il n'existe pas
  let modalContainer = document.getElementById('modalsContainer');
  if (modalContainer && !document.getElementById('revisionsModal')) {
    modalContainer.insertAdjacentHTML('beforeend', renderRevisionsModal());
  }
  
  revisionsModal = document.getElementById('revisionsModal');
  revisionsList = document.getElementById('revisionsList');
  
  if (revisionsModal) {
    revisionsModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  
  renderRevisionsList(revisions);
  
  const countEl = document.getElementById('revisionsCount');
  if (countEl) countEl.textContent = `${revisions.length} ${t('revisions')}`;
  
  store.set({ modals: { ...store.getState().modals, revisions: { open: true, data: { noteId, revisions } } } });
}

export function closeRevisionsModal() {
  if (revisionsModal) {
    revisionsModal.classList.remove('open');
    document.body.style.overflow = '';
  }
  currentNoteId = null;
  store.set({ modals: { ...store.getState().modals, revisions: { open: false } } });
}

async function restoreRevisionAction(index) {
  if (!currentNoteId) return;
  
  const confirmed = confirm(t('confirmRestoreRevision'));
  if (!confirmed) return;
  
  const result = await restoreRevision(currentNoteId, index);
  if (result) {
    closeRevisionsModal();
    showToast(t('restored'), 'success');
    // Recharge la note dans l'éditeur
    loadNote(currentNoteId);
  }
}

/* ==========================================================================
   Setup
   ========================================================================== */

export function setupRevisions() {
  // Ferme au clic extérieur
  document.addEventListener('click', (e) => {
    if (revisionsModal && revisionsModal.classList.contains('open') && !revisionsModal.querySelector('.modal').contains(e.target)) {
      closeRevisionsModal();
    }
  });
  
  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && revisionsModal?.classList.contains('open')) {
      closeRevisionsModal();
    }
  });
}