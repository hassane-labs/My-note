/* ==========================================================================
   My Note - Tabs (Gestion des onglets)
   ========================================================================== */

import { store, setActiveTab, closeTab, switchTab, updateTab, newTab, loadNote, saveCurrentNote } from './store.js';
import { t } from './i18n.js';

let tabBar = null;

/* ==========================================================================
   Rendu de la barre d'onglets
   ========================================================================== */

export function renderTabs() {
  tabBar = document.getElementById('tabBar');
  if (!tabBar) return;
  
  const { tabs, activeTabId } = store.getState();
  
  tabBar.innerHTML = `
    ${tabs.map(tab => `
      <button 
        class="tab ${tab.id === activeTabId ? 'active' : ''} ${tab.dirty ? 'dirty' : ''} ${tab.pinned ? 'pinned' : ''}"
        role="tab"
        aria-selected="${tab.id === activeTabId}"
        aria-label="${tab.title}${tab.dirty ? ' · ' + t('unsavedChanges') : ''}"
        data-tab-id="${tab.id}"
        title="${tab.title}${tab.dirty ? ' · ' + t('unsavedChanges') : ''}"
      >
        <span class="tab-title" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px;">${escapeHtml(tab.title || t('untitled'))}</span>
        <button class="tab-close" aria-label="${t('closeTab')}" data-tab-close="${tab.id}" tabindex="-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </button>
    `).join('')}
    <button class="new-tab-btn" id="newTabBtn" aria-label="${t('newTab')}" data-i18n-title="newTab">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  `;
  
  setupTabs();
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

export function setupTabs() {
  tabBar = document.getElementById('tabBar');
  if (!tabBar) return;
  
  // Click sur onglet
  tabBar.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.tab');
    if (tabBtn) {
      const tabId = tabBtn.dataset.tabId;
      if (tabId) {
        setActiveTab(tabId);
        loadNote(tabId);
      }
    }
    
    // Fermer onglet
    const closeBtn = e.target.closest('[data-tab-close]');
    if (closeBtn) {
      e.stopPropagation();
      const tabId = closeBtn.dataset.tabClose;
      closeTab(tabId);
    }
    
    // Nouveau onglet
    if (e.target.closest('#newTabBtn')) {
      newTab();
    }
  });
  
  // Double-click pour renommer (optionnel)
  tabBar.addEventListener('dblclick', (e) => {
    const tabBtn = e.target.closest('.tab');
    if (tabBtn && !e.target.closest('.tab-close')) {
      const tabId = tabBtn.dataset.tabId;
      // TODO: ouvrir modale renommer
    }
  });
  
  // Drag & drop pour réordonner
  let draggedTab = null;
  
  tabBar.addEventListener('dragstart', (e) => {
    const tabBtn = e.target.closest('.tab');
    if (tabBtn) {
      draggedTab = tabBtn;
      tabBtn.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    }
  });
  
  tabBar.addEventListener('dragend', (e) => {
    if (draggedTab) {
      draggedTab.classList.remove('dragging');
      draggedTab = null;
    }
  });
  
  tabBar.addEventListener('dragover', (e) => {
    e.preventDefault();
    const tabBtn = e.target.closest('.tab');
    if (tabBtn && tabBtn !== draggedTab) {
      const rect = tabBtn.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      if (e.clientX < mid) {
        tabBtn.style.borderLeft = '2px solid var(--accent)';
        tabBtn.style.borderRight = '';
      } else {
        tabBtn.style.borderRight = '2px solid var(--accent)';
        tabBtn.style.borderLeft = '';
      }
    }
  });
  
  tabBar.addEventListener('dragleave', (e) => {
    if (!tabBar.contains(e.relatedTarget)) {
      tabBar.querySelectorAll('.tab').forEach(t => {
        t.style.borderLeft = '';
        t.style.borderRight = '';
      });
    }
  });
  
  tabBar.addEventListener('drop', (e) => {
    e.preventDefault();
    const targetTab = e.target.closest('.tab');
    if (draggedTab && targetTab && draggedTab !== targetTab) {
      const { tabs } = store.getState();
      const fromIndex = tabs.findIndex(t => t.id === draggedTab.dataset.tabId);
      const toIndex = tabs.findIndex(t => t.id === targetTab.dataset.tabId);
      
      if (fromIndex !== -1 && toIndex !== -1) {
        const newTabs = [...tabs];
        const [removed] = newTabs.splice(fromIndex, 1);
        newTabs.splice(toIndex, 0, removed);
        store.set({ tabs: newTabs });
        import('./store.js').then(m => m.saveSession());
      }
    }
    tabBar.querySelectorAll('.tab').forEach(t => {
      t.style.borderLeft = '';
      t.style.borderRight = '';
    });
  });
  
  // Scroll horizontal avec molette
  tabBar.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      tabBar.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });
  
  // Raccourcis clavier sur la barre d'onglets
  tabBar.addEventListener('keydown', (e) => {
    const { tabs, activeTabId } = store.getState();
    const currentIndex = tabs.findIndex(t => t.id === activeTabId);
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) {
          setActiveTab(tabs[currentIndex - 1].id);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < tabs.length - 1) {
          setActiveTab(tabs[currentIndex + 1].id);
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          closeTab(activeTabId);
        }
        break;
    }
  });
  
  // Store subscription
  store.subscribe((state, prevState) => {
    if (state.tabs !== prevState.tabs || state.activeTabId !== prevState.activeTabId) {
      renderTabs();
    }
  });
}

/* ==========================================================================
   Helpers
   ========================================================================== */

export function getActiveTab() {
  const { tabs, activeTabId } = store.getState();
  return tabs.find(t => t.id === activeTabId);
}

export function updateTabTitle(tabId, title) {
  updateTab(tabId, { title });
}