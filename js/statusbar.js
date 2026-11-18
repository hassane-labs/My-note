/* ==========================================================================
   My Note - Statusbar (Barre d'état)
   ========================================================================== */

import { store } from './store.js';
import { t } from './i18n.js';

/* ==========================================================================
   Rendu de la barre d'état
   ========================================================================== */

export function renderStatusbar() {
  const statusbar = document.getElementById('statusbar');
  if (!statusbar) return;
  
  const { settings, saveStatus, zoomLevel } = store.getState();
  
  // Affiche/masque selon réglages
  if (!settings.statusBar) {
    statusbar.style.display = 'none';
    return;
  }
  statusbar.style.display = 'flex';
  
  // Met à jour le zoom
  document.getElementById('zoomLevel').textContent = `${zoomLevel}%`;
  
  // Met à jour le statut de sauvegarde
  updateSaveStatus(saveStatus);
}

function updateSaveStatus(status) {
  const statusEl = document.getElementById('statusSaveStatus');
  if (!statusEl) return;
  
  const icon = statusEl.querySelector('svg');
  const textEl = statusEl.querySelector('span');
  
  statusEl.className = 'statusbar-item status-saved';
  
  switch (status) {
    case 'saved':
      statusEl.classList.remove('pending');
      if (icon) icon.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
      if (textEl) textEl.textContent = t('statusSaved');
      break;
    case 'pending':
      statusEl.classList.add('pending');
      if (icon) icon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>';
      if (textEl) textEl.textContent = t('statusPending');
      break;
    case 'saving':
      statusEl.classList.add('pending');
      if (icon) icon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>';
      if (textEl) textEl.textContent = t('saving');
      break;
    case 'error':
      statusEl.classList.add('pending');
      if (icon) icon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>';
      if (textEl) textEl.textContent = t('error');
      break;
  }
}

/* ==========================================================================
   Setup
   ========================================================================== */

export function setupStatusbar() {
  // Zoom buttons
  document.getElementById('zoomInBtn')?.addEventListener('click', () => {
    import('./store.js').then(m => {
      const { zoomLevel } = m.store.getState();
      m.setZoomLevel(zoomLevel + 10);
    });
  });
  
  document.getElementById('zoomOutBtn')?.addEventListener('click', () => {
    import('./store.js').then(m => {
      const { zoomLevel } = m.store.getState();
      m.setZoomLevel(zoomLevel - 10);
    });
  });
  
  // Click sur zoom level pour reset
  document.getElementById('zoomLevel')?.addEventListener('click', () => {
    import('./store.js').then(m => m.setZoomLevel(100));
  });
  
  // Store subscription
  store.subscribe((state, prevState) => {
    if (state.saveStatus !== prevState.saveStatus) {
      updateSaveStatus(state.saveStatus);
    }
    if (state.zoomLevel !== prevState.zoomLevel) {
      document.getElementById('zoomLevel').textContent = `${state.zoomLevel}%`;
    }
    if (state.settings.statusBar !== prevState.settings.statusBar) {
      const statusbar = document.getElementById('statusbar');
      if (statusbar) {
        statusbar.style.display = state.settings.statusBar ? 'flex' : 'none';
      }
    }
  });
}

/* ==========================================================================
   Mise à jour stats éditeur (appelé depuis editor.js)
   ========================================================================== */

export function updateEditorStats(stats) {
  document.getElementById('lineNum').textContent = stats.line;
  document.getElementById('colNum').textContent = stats.col;
  document.getElementById('wordCount').textContent = stats.words;
  document.getElementById('charCount').textContent = stats.chars;
  document.getElementById('readTime').textContent = stats.readingTime;
}