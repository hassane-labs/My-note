/* ==========================================================================
   My Note - Toasts (Notifications toast)
   ========================================================================== */

import { store } from './store.js';

let toastContainer = null;

/* ==========================================================================
   Rendu container toasts
   ========================================================================== */

export function renderToasts() {
  toastContainer = document.getElementById('toastsContainer');
  if (!toastContainer) return;
  
  toastContainer.innerHTML = '<div class="toast-container" id="toastContainer" role="region" aria-live="polite" aria-label="Notifications"></div>';
  
  // Sync initial toasts
  const { toasts } = store.getState();
  toasts.forEach(toast => renderToast(toast));
}

function renderToast(toast) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const icons = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17.01"></line></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8.01"></line></svg>'
  };
  
  const el = document.createElement('div');
  el.className = `toast ${toast.type}`;
  el.dataset.toastId = toast.id;
  el.innerHTML = `
    ${icons[toast.type] || icons.info}
    <span style="flex: 1;">${escapeHtml(toast.message)}</span>
    <button class="toast-close" aria-label="Fermer">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;
  
  el.querySelector('.toast-close').addEventListener('click', () => {
    removeToast(toast.id);
  });
  
  container.appendChild(el);
  
  // Animation d'entrée
  requestAnimationFrame(() => {
    el.classList.add('visible');
  });
  
  // Auto-remove
  if (toast.duration > 0) {
    setTimeout(() => removeToast(toast.id), toast.duration);
  }
}

function removeToast(id) {
  const el = document.querySelector(`[data-toast-id="${id}"]`);
  if (el) {
    el.classList.add('removing');
    el.addEventListener('animationend', () => el.remove());
  }
  
  // Met à jour le store
  const { toasts } = store.getState();
  store.set({ toasts: toasts.filter(t => t.id !== id) });
}

/* ==========================================================================
   Setup
   ========================================================================== */

export function setupToasts() {
  // Store subscription
  store.subscribe((state, prevState) => {
    if (state.toasts !== prevState.toasts) {
      // Nouveaux toasts
      const newToasts = state.toasts.filter(t => !prevState.toasts.some(pt => pt.id === t.id));
      newToasts.forEach(renderToast);
      
      // Toasts supprimés (géré par removeToast)
    }
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}