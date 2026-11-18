/* ==========================================================================
   My Note - Main (Point d'entrée, initialisation)
   ========================================================================== */

import { initI18n, t, applyTranslations, onLangChange } from './i18n.js';
import { initShortcuts, getShortcutsHelp } from './shortcuts.js';
import { loadInitialState, saveSession, saveCurrentNote, refreshNotesList, 
         setSearchQuery, setSidebarOpen, setSidebarCollapsed, toggleFocusMode,
         setCommandPaletteOpen, setEditorMode, updateSettings, setZoomLevel,
         showToast, openModal, closeModal, setOnline } from './store.js';
import { getAllSettings, setSetting, requestPersistence } from './db.js';
import { applyTheme, initTheme } from './settings.js';
import { renderEditor, updateEditorUI, setupEditor } from './editor.js';
import { renderTabs, setupTabs } from './tabs.js';
import { renderSidebar, setupSidebar } from './sidebar.js';
import { renderStatusbar, setupStatusbar } from './statusbar.js';
import { renderCommandPalette, setupCommandPalette } from './palette.js';
import { renderModals, setupModals } from './modals.js';
import { renderToasts, setupToasts } from './toasts.js';
import { setupGlobalSearch } from './search.js';
import { registerSW } from './sw-register.js';

/* ==========================================================================
   État global de l'app
   ========================================================================== */

let appInitialized = false;
let saveDebounceTimer = null;
let autoSaveInterval = null;

/* ==========================================================================
   Initialisation
   ========================================================================== */

async function init() {
  if (appInitialized) return;
  
  try {
    // 1. Thème (avant paint pour éviter flash)
    initTheme();
    
    // 2. i18n
    const settings = await getAllSettings();
    initI18n(settings.language);
    applyTranslations();
    
    // 3. Charge l'état depuis DB
    await loadInitialState();
    
    // 4. Rend l'UI
    renderApp();
    
    // 5. Setup event listeners
    setupEventListeners();
    
    // 6. Raccourcis clavier
    initShortcuts();
    
    // 7. Service Worker
    registerSW();
    
    // 8. Persistance
    requestPersistence();
    
    // 9. Auto-save interval
    startAutoSave();
    
    // 10. Online/offline
    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));
    
    // 11. Beforeunload / visibilitychange
    setupUnloadHandlers();
    
    // 12. Share target (Android)
    handleShareTarget();
    
    // 13. URL ?new=1
    handleNewNoteParam();
    
    appInitialized = true;
    console.log('[My Note] Initialisé');
    
  } catch (e) {
    console.error('[My Note] Erreur initialisation:', e);
    showToast(t('errorLoadDB'), 'error');
    // Affiche quand même l'UI de base
    renderApp();
    setupEventListeners();
  }
}

/* ==========================================================================
   Rendu de l'app
   ========================================================================== */

function renderApp() {
  const app = document.getElementById('app');
  if (!app) return;
  
  app.innerHTML = `
    <a href="#editor" class="skip-link" data-i18n="skipToEditor">Aller à l'éditeur</a>
    
    <header class="header" role="banner">
      <div class="header-left">
        <button class="btn btn-icon mobile-menu-btn" id="menuBtn" aria-label="${t('menu')}" data-i18n-title="menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="header-title">
          <span data-i18n="appName">My Note</span>
        </div>
      </div>
      <div class="header-center" id="headerSearch">
        <div class="search-input-wrapper" style="max-width: 360px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="search" class="search-input" id="headerSearchInput" 
                 placeholder="${t('searchNotes')}" 
                 aria-label="${t('searchNotes')}"
                 data-i18n-placeholder="searchNotes"
                 data-i18n-title="searchNotes">
        </div>
      </div>
      <div class="header-right">
        <button class="btn btn-icon" id="newNoteBtn" aria-label="${t('newNote')}" data-i18n-title="newNote">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button class="btn btn-icon" id="paletteBtn" aria-label="${t('commandPalette')}" data-i18n-title="commandPalette">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        <button class="btn btn-icon" id="settingsBtn" aria-label="${t('settings')}" data-i18n-title="settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
        <div class="divider-vertical" style="margin: 0 var(--space-2);"></div>
        <div class="header-user" style="display: flex; align-items: center; gap: var(--space-2);">
          <span class="status-saved" id="headerSaveStatus" aria-live="polite">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span data-i18n="statusSaved">Enregistré</span>
          </span>
        </div>
      </div>
    </header>
    
    <div class="sidebar-overlay" id="sidebarOverlay" aria-hidden="true"></div>
    
    <aside class="sidebar" id="sidebar" role="complementary" aria-label="${t('notesList')}">
      <div class="sidebar-header">
        <h2 class="sidebar-title" data-i18n="notes">Notes</h2>
        <div class="sidebar-actions">
          <button class="btn btn-icon" id="sidebarNewBtn" aria-label="${t('newNote')}" data-i18n-title="newNote">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button class="btn btn-icon" id="sidebarCollapseBtn" aria-label="${t('collapseSidebar')}" data-i18n-title="collapseSidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
      <div class="sidebar-search" id="sidebarSearch">
        <div class="search-input-wrapper">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="search" class="search-input" id="sidebarSearchInput" 
                 placeholder="${t('searchNotes')}" 
                 aria-label="${t('searchNotes')}"
                 data-i18n-placeholder="searchNotes">
        </div>
      </div>
      <div class="sidebar-divider"></div>
      <div class="notes-list" id="notesList" role="listbox" aria-label="${t('notesList')}"></div>
      <div class="sidebar-footer">
        <div class="sync-status" id="syncStatus">
          <span class="sync-indicator" id="syncIndicator"></span>
          <span id="syncText" data-i18n="statusSaved">Enregistré</span>
        </div>
      </div>
    </aside>
    
    <main class="editor-pane" id="editorPane" role="main">
      <div class="tab-bar" id="tabBar" role="tablist" aria-label="${t('openTabs')}"></div>
      <div class="editor-content" id="editorContent"></div>
    </main>
    
    <footer class="statusbar" id="statusbar" role="status" aria-live="polite">
      <div class="statusbar-left">
        <span class="statusbar-item" id="statusLineCol">
          <span data-i18n="line">Ln</span> <span id="lineNum">1</span>, 
          <span data-i18n="col">Col</span> <span id="colNum">1</span>
        </span>
        <span class="statusbar-divider"></span>
        <span class="statusbar-item" id="statusWords">
          <span id="wordCount">0</span> <span data-i18n="words">Mots</span>
        </span>
        <span class="statusbar-divider"></span>
        <span class="statusbar-item" id="statusChars">
          <span id="charCount">0</span> <span data-i18n="chars">Caractères</span>
        </span>
        <span class="statusbar-divider"></span>
        <span class="statusbar-item" id="statusReadTime">
          <span id="readTime">1</span> <span data-i18n="readingTime">min</span>
        </span>
      </div>
      <div class="statusbar-center">
        <span class="statusbar-item" id="statusEncoding" data-i18n="encoding">UTF-8</span>
      </div>
      <div class="statusbar-right">
        <span class="statusbar-item" id="statusZoom">
          <button class="zoom-btn" id="zoomOutBtn" aria-label="${t('zoomOut')}" data-i18n-title="zoomOut">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <span class="zoom-level" id="zoomLevel">100%</span>
          <button class="zoom-btn" id="zoomInBtn" aria-label="${t('zoomIn')}" data-i18n-title="zoomIn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
        </span>
        <span class="statusbar-divider"></span>
        <span class="statusbar-item status-saved" id="statusSaveStatus">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span data-i18n="statusSaved">Enregistré</span>
        </span>
      </div>
    </footer>
    
    <!-- Modales, palette, toasts seront injectés ici -->
    <div id="modalsContainer"></div>
    <div id="commandPaletteContainer"></div>
    <div id="toastsContainer"></div>
  `;
  
  // Rend les composants dynamiques
  renderTabs();
  renderSidebar();
  renderEditor();
  renderStatusbar();
  renderCommandPalette();
  renderModals();
  renderToasts();
  
  // Applique les traductions
  applyTranslations();
}

/* ==========================================================================
   Event Listeners
   ========================================================================== */

function setupEventListeners() {
  // Header
  document.getElementById('newNoteBtn')?.addEventListener('click', () => {
    import('./store.js').then(m => m.newTab());
  });
  
  document.getElementById('paletteBtn')?.addEventListener('click', () => {
    const { commandPaletteOpen } = store.getState();
    setCommandPaletteOpen(!commandPaletteOpen);
  });
  
  document.getElementById('settingsBtn')?.addEventListener('click', () => {
    openModal('settings');
  });
  
  // Header search
  const headerSearchInput = document.getElementById('headerSearchInput');
  if (headerSearchInput) {
    headerSearchInput.addEventListener('input', debounce((e) => {
      setSearchQuery(e.target.value);
    }, 150));
    
    headerSearchInput.addEventListener('focus', () => {
      headerSearchInput.parentElement.classList.add('focused');
    });
    headerSearchInput.addEventListener('blur', () => {
      headerSearchInput.parentElement.classList.remove('focused');
    });
  }
  
  // Sidebar mobile
  document.getElementById('menuBtn')?.addEventListener('click', () => {
    const { sidebarOpen } = store.getState();
    setSidebarOpen(!sidebarOpen);
  });
  
  document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
    setSidebarOpen(false);
  });
  
  // Sidebar collapse
  document.getElementById('sidebarCollapseBtn')?.addEventListener('click', () => {
    const { sidebarCollapsed } = store.getState();
    setSidebarCollapsed(!sidebarCollapsed);
  });
  
  // Sidebar new note
  document.getElementById('sidebarNewBtn')?.addEventListener('click', () => {
    import('./store.js').then(m => m.newTab());
    setSidebarOpen(false);
  });
  
  // Sidebar search
  const sidebarSearchInput = document.getElementById('sidebarSearchInput');
  if (sidebarSearchInput) {
    sidebarSearchInput.addEventListener('input', debounce((e) => {
      setSearchQuery(e.target.value);
    }, 150));
  }
  
  // Zoom buttons
  document.getElementById('zoomInBtn')?.addEventListener('click', () => {
    const { zoomLevel } = store.getState();
    setZoomLevel(zoomLevel + 10);
  });
  
  document.getElementById('zoomOutBtn')?.addEventListener('click', () => {
    const { zoomLevel } = store.getState();
    setZoomLevel(zoomLevel - 10);
  });
  
  // Setup des modules
  setupTabs();
  setupSidebar();
  setupEditor();
  setupStatusbar();
  setupCommandPalette();
  setupModals();
  setupToasts();
  setupGlobalSearch();
  
  // Écoute changements de langue
  onLangChange(() => {
    applyTranslations();
    // Re-rend les composants avec du texte
    renderTabs();
    renderSidebar();
    renderStatusbar();
    renderCommandPalette();
    renderModals();
  });
  
  // Écoute changements de thème
  window.addEventListener('themechange', (e) => {
    applyTheme(e.detail.theme);
  });
}

/* ==========================================================================
   Auto-save
   ========================================================================== */

function startAutoSave() {
  // Sauvegarde immédiate au débounce
  store.subscribe((state, prevState) => {
    if (state.saveStatus === 'pending' && prevState.saveStatus !== 'saving') {
      clearTimeout(saveDebounceTimer);
      saveDebounceTimer = setTimeout(() => {
        saveCurrentNote();
      }, 400);
    }
  });
  
  // Sauvegarde forcée toutes les 30s si en attente
  autoSaveInterval = setInterval(() => {
    const { saveStatus } = store.getState();
    if (saveStatus === 'pending') {
      saveCurrentNote();
    }
  }, 30000);
}

function setupUnloadHandlers() {
  // Sauvegarde avant déchargement
  window.addEventListener('beforeunload', (e) => {
    const { saveStatus, tabs } = store.getState();
    if (saveStatus === 'pending' || tabs.some(t => t.dirty)) {
      saveCurrentNote();
      // Note: on ne peut pas empêcher le déchargement de façon asynchrone
      // La sauvegarde se fait en best-effort
    }
    
    // Avertissement si modifications non sauvegardées
    if (tabs.some(t => t.dirty)) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  });
  
  // Sauvegarde quand l'onglet devient invisible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveCurrentNote();
      saveSession();
    }
  });
}

/* ==========================================================================
   Share Target & URL params
   ========================================================================== */

function handleShareTarget() {
  // Gère ?title=...&text=...&url=... depuis share_target
  const params = new URLSearchParams(window.location.search);
  const sharedText = params.get('text') || params.get('url') || '';
  const sharedTitle = params.get('title') || '';
  
  if (sharedText || sharedTitle) {
    // Nettoie l'URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Crée une note avec le contenu partagé
    setTimeout(async () => {
      const { createNote } = await import('./db.js');
      const note = await createNote({
        title: sharedTitle || 'Note partagée',
        content: sharedText
      });
      await import('./store.js').then(m => m.newTab(note.id));
      showToast(t('importedFromShare'), 'success');
    }, 500);
  }
}

function handleNewNoteParam() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('new') === '1') {
    window.history.replaceState({}, document.title, window.location.pathname);
    setTimeout(() => {
      import('./store.js').then(m => m.newTab());
    }, 100);
  }
}

/* ==========================================================================
   Debounce helper
   ========================================================================== */

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ==========================================================================
   Démarrage
   ========================================================================== */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export pour tests
export { init, appInitialized };