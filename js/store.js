/* ==========================================================================
   My Note - Store (État global réactif minimal)
   ========================================================================== */

import { getAllNotes, getAllSettings, getAllTags } from './db.js';
import { deepClone } from './utils.js';

/**
 * Crée un store réactif simple
 * @param {object} initialState
 * @returns {Store}
 */
export function createStore(initialState = {}) {
  let state = deepClone(initialState);
  const listeners = new Set();
  const derived = new Map();

  return {
    /**
     * Obtient l'état actuel (copie)
     * @returns {object}
     */
    getState() {
      return deepClone(state);
    },

    /**
     * Obtient une partie de l'état
     * @param {string} key
     * @returns {any}
     */
    get(key) {
      return state[key];
    },

    /**
     * Met à jour l'état
     * @param {object|Function} partial
     */
    set(partial) {
      const prevState = deepClone(state);
      if (typeof partial === 'function') {
        state = { ...state, ...partial(state) };
      } else {
        state = { ...state, ...partial };
      }
      // Notifie les listeners
      for (const listener of listeners) {
        listener(state, prevState);
      }
    },

    /**
     * S'abonne aux changements
     * @param {Function} listener
     * @returns {Function} unsubscribe
     */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    /**
     * Définit une valeur dérivée (calculée à la demande)
     * @param {string} key
     * @param {Function} selector
     */
    derive(key, selector) {
      derived.set(key, selector);
    },

    /**
     * Obtient une valeur dérivée
     * @param {string} key
     * @returns {any}
     */
    getDerived(key) {
      const selector = derived.get(key);
      return selector ? selector(state) : undefined;
    },

    /**
     * Reset l'état
     */
    reset(newState = {}) {
      state = deepClone(newState);
      for (const listener of listeners) {
        listener(state, {});
      }
    }
  };
}

/* ==========================================================================
   État initial
   ========================================================================== */

const initialState = {
  // Notes
  notes: [],           // Note[] - toutes les notes pour la sidebar
  filteredNotes: [],   // Note[] - notes filtrées
  activeNoteId: null,  // string|null - ID de la note active
  
  // Onglets
  tabs: [],            // Tab[] - onglets ouverts [{id, noteId, title, dirty, pinned, cursorPos, scrollTop}]
  activeTabId: null,   // string|null
  
  // UI
  sidebarOpen: false,          // mobile
  sidebarCollapsed: false,     // desktop
  focusMode: false,
  commandPaletteOpen: false,
  searchQuery: '',
  globalSearchQuery: '',
  globalSearchResults: [],
  globalSearchOpen: false,
  
  // Éditeur
  editorMode: 'write',         // 'write' | 'preview' | 'split'
  editorContent: '',
  editorTitle: '',
  cursorPosition: { start: 0, end: 0 },
  scrollPosition: 0,
  lineNumbers: false,
  wordWrap: true,
  zoomLevel: 100,
  
  // Recherche/remplacement
  findQuery: '',
  replaceQuery: '',
  findOptions: {
    caseSensitive: false,
    wholeWord: false,
    regex: false,
    wrapAround: true
  },
  findMatches: [],
  currentMatchIndex: -1,
  
  // Réglages
  settings: {},
  
  // Tags
  allTags: [],
  
  // Statut
  saveStatus: 'saved',         // 'saved' | 'pending' | 'saving' | 'error'
  lastSavedAt: null,
  isOnline: navigator.onLine,
  
  // Modales
  modals: {
    settings: false,
    revisions: false,
    export: false,
    import: false,
    shortcuts: false,
    confirmDelete: { open: false, noteId: null },
    confirmClearTrash: false
  },
  
  // Toasts
  toasts: [],
  
  // Chargement
  isLoading: true,
  initError: null
};

/* ==========================================================================
   Store principal
   ========================================================================== */

export const store = createStore(initialState);

/* ==========================================================================
   Actions (mutations d'état)
   ========================================================================== */

/**
 * Charge l'état initial depuis la DB
 */
export async function loadInitialState() {
  store.set({ isLoading: true, initError: null });
  
  try {
    const [notes, settings, tags] = await Promise.all([
      getAllNotes({ includeArchived: true, includeDeleted: true }),
      getAllSettings(),
      getAllTags()
    ]);
    
    // Récupère la session précédente (onglets ouverts)
    const lastSession = settings.lastSession || { tabs: [], activeTabId: null };
    
    store.set({
      notes,
      filteredNotes: notes,
      allTags: tags,
      settings,
      tabs: lastSession.tabs || [],
      activeTabId: lastSession.activeTabId || null,
      isLoading: false
    });
    
    // Si pas d'onglets, ouvre une nouvelle note
    if (!lastSession.tabs?.length) {
      await newTab();
    }
  } catch (e) {
    console.error('[Store] Erreur chargement:', e);
    store.set({ 
      isLoading: false, 
      initError: e.message,
      // Fallback: note vide
      tabs: [{ id: 'tab-' + Date.now(), noteId: null, title: 'Nouvelle note', dirty: false, pinned: false }],
      activeTabId: 'tab-' + Date.now()
    });
  }
}

/**
 * Sauvegarde la session courante
 */
export async function saveSession() {
  const { tabs, activeTabId } = store.getState();
  await import('./db.js').then(m => m.setSetting('lastSession', { tabs, activeTabId }));
}

/**
 * Crée un nouvel onglet
 * @param {string|null} noteId
 * @returns {Promise<string>} tabId
 */
export async function newTab(noteId = null) {
  const { tabs } = store.getState();
  const tabId = 'tab-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  
  let note;
  if (noteId) {
    note = await import('./db.js').then(m => m.getNote(noteId));
  } else {
    note = await import('./db.js').then(m => m.createNote());
  }
  
  const newTab = {
    id: tabId,
    noteId: note.id,
    title: note.title || 'Nouvelle note',
    dirty: false,
    pinned: false,
    cursorPosition: { start: 0, end: 0 },
    scrollTop: 0
  };
  
  store.set({
    tabs: [...tabs, newTab],
    activeTabId: tabId
  });
  
  await saveSession();
  return tabId;
}

/**
 * Ferme un onglet
 * @param {string} tabId
 */
export async function closeTab(tabId) {
  const { tabs, activeTabId } = store.getState();
  const index = tabs.findIndex(t => t.id === tabId);
  if (index === -1) return;
  
  const newTabs = tabs.filter(t => t.id !== tabId);
  let newActiveId = activeTabId;
  
  if (activeTabId === tabId) {
    // Active l'onglet précédent ou suivant
    newActiveId = newTabs[index]?.id || newTabs[index - 1]?.id || null;
  }
  
  // Si plus d'onglets, en crée un nouveau
  if (newTabs.length === 0) {
    await newTab();
    return;
  }
  
  store.set({ tabs: newTabs, activeTabId: newActiveId });
  await saveSession();
}

/**
 * Change l'onglet actif
 * @param {string} tabId
 */
export function setActiveTab(tabId) {
  store.set({ activeTabId: tabId });
  saveSession();
}

/**
 * Change d'onglet (suivant/précédent)
 * @param {number} direction - 1 pour suivant, -1 pour précédent
 */
export function switchTab(direction) {
  const { tabs, activeTabId } = store.getState();
  if (!tabs.length) return;
  
  const currentIndex = tabs.findIndex(t => t.id === activeTabId);
  if (currentIndex === -1) return;
  
  let newIndex = currentIndex + direction;
  if (newIndex >= tabs.length) newIndex = 0;
  if (newIndex < 0) newIndex = tabs.length - 1;
  
  setActiveTab(tabs[newIndex].id);
}

/**
 * Met à jour les infos d'un onglet
 * @param {string} tabId
 * @param {Partial<Tab>} updates
 */
export function updateTab(tabId, updates) {
  const { tabs } = store.getState();
  store.set({
    tabs: tabs.map(t => t.id === tabId ? { ...t, ...updates } : t)
  });
}

/**
 * Marque un onglet comme modifié/sauvegardé
 * @param {string} tabId
 * @param {boolean} dirty
 */
export function setTabDirty(tabId, dirty) {
  updateTab(tabId, { dirty });
  if (!dirty) {
    store.set({ saveStatus: 'saved', lastSavedAt: new Date().toISOString() });
  } else {
    store.set({ saveStatus: 'pending' });
  }
}

/**
 * Charge une note dans l'éditeur
 * @param {string} noteId
 */
export async function loadNote(noteId) {
  const note = await import('./db.js').then(m => m.getNote(noteId));
  if (!note) return;
  
  const { tabs, activeTabId } = store.getState();
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  
  // Met à jour l'onglet
  updateTab(activeTabId, { 
    noteId, 
    title: note.title || 'Nouvelle note',
    dirty: false
  });
  
  // Charge le contenu
  store.set({
    activeNoteId: noteId,
    editorContent: note.content,
    editorTitle: note.title,
    cursorPosition: tab.cursorPosition || { start: 0, end: 0 },
    scrollPosition: tab.scrollTop || 0,
    saveStatus: 'saved'
  });
}

/**
 * Met à jour le contenu de l'éditeur
 * @param {string} content
 * @param {object} cursorPos
 * @param {number} scrollTop
 */
export function updateEditorContent(content, cursorPos, scrollTop) {
  const { activeTabId } = store.getState();
  store.set({
    editorContent: content,
    cursorPosition: cursorPos,
    scrollPosition: scrollTop
  });
  
  if (activeTabId) {
    updateTab(activeTabId, { 
      dirty: true,
      cursorPosition: cursorPos,
      scrollTop
    });
  }
  
  store.set({ saveStatus: 'pending' });
}

/**
 * Sauvegarde la note courante
 */
export async function saveCurrentNote() {
  const { activeTabId, editorContent, editorTitle, tabs } = store.getState();
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  
  store.set({ saveStatus: 'saving' });
  
  try {
    const { saveNoteContent } = await import('./db.js');
    const note = await saveNoteContent(tab.noteId, editorContent, editorTitle);
    
    if (note) {
      updateTab(activeTabId, { 
        title: note.title,
        dirty: false 
      });
      store.set({ 
        editorTitle: note.title,
        saveStatus: 'saved',
        lastSavedAt: new Date().toISOString()
      });
      // Met à jour la liste des notes
      refreshNotesList();
    }
  } catch (e) {
    console.error('[Store] Erreur sauvegarde:', e);
    store.set({ saveStatus: 'error' });
    showToast('Erreur lors de la sauvegarde', 'error');
  }
}

/**
 * Rafraîchit la liste des notes
 * @param {object} filters
 */
export async function refreshNotesList(filters = {}) {
  const { getNotesForSidebar } = await import('./db.js');
  const notes = await getNotesForSidebar(filters);
  const { searchQuery } = store.getState();
  
  store.set({ 
    notes,
    filteredNotes: notes,
    searchQuery: filters.search || searchQuery
  });
  
  // Met à jour les titres des onglets
  const { tabs } = store.getState();
  const updatedTabs = tabs.map(tab => {
    const note = notes.find(n => n.id === tab.noteId);
    return note ? { ...tab, title: note.title || 'Nouvelle note' } : tab;
  });
  store.set({ tabs: updatedTabs });
}

/**
 * Recherche dans les notes (sidebar)
 * @param {string} query
 */
export function setSearchQuery(query) {
  const { notes } = store.getState();
  const normalized = query.toLowerCase().trim();
  
  let filtered = notes;
  if (normalized) {
    filtered = notes.filter(n => 
      n.title.toLowerCase().includes(normalized) ||
      n.content.toLowerCase().includes(normalized) ||
      n.tags.some(t => t.toLowerCase().includes(normalized))
    );
  }
  
  store.set({ searchQuery: query, filteredNotes: filtered });
}

/**
 * Recherche globale
 * @param {string} query
 */
export async function globalSearch(query) {
  if (!query.trim()) {
    store.set({ globalSearchQuery: '', globalSearchResults: [], globalSearchOpen: false });
    return;
  }
  
  const { notes } = store.getState();
  const normalized = query.toLowerCase();
  
  const results = notes
    .filter(n => !n.deletedAt)
    .map(note => {
      // Score simple
      let score = 0;
      if (note.title.toLowerCase().includes(normalized)) score += 10;
      if (note.content.toLowerCase().includes(normalized)) score += 5;
      if (note.tags.some(t => t.includes(normalized))) score += 3;
      
      // Extraits
      const snippets = [];
      const contentLower = note.content.toLowerCase();
      let idx = contentLower.indexOf(normalized);
      while (idx !== -1 && snippets.length < 3) {
        const start = Math.max(0, idx - 50);
        const end = Math.min(note.content.length, idx + normalized.length + 50);
        let snippet = note.content.slice(start, end);
        if (start > 0) snippet = '…' + snippet;
        if (end < note.content.length) snippet = snippet + '…';
        snippets.push(snippet);
        idx = contentLower.indexOf(normalized, idx + 1);
      }
      
      return { note, score, snippets };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
  
  store.set({
    globalSearchQuery: query,
    globalSearchResults: results,
    globalSearchOpen: true
  });
}

/**
 * Bascule la sidebar (mobile)
 * @param {boolean} open
 */
export function setSidebarOpen(open) {
  store.set({ sidebarOpen: open });
}

/**
 * Bascule la sidebar collapsed (desktop)
 * @param {boolean} collapsed
 */
export function setSidebarCollapsed(collapsed) {
  store.set({ sidebarCollapsed: collapsed });
}

/**
 * Bascule le mode focus
 */
export function toggleFocusMode() {
  const { focusMode } = store.getState();
  store.set({ focusMode: !focusMode });
}

/**
 * Ouvre/ferme la palette de commandes
 * @param {boolean} open
 */
export function setCommandPaletteOpen(open) {
  store.set({ commandPaletteOpen: open });
}

/**
 * Change le mode éditeur
 * @param {'write'|'preview'|'split'} mode
 */
export function setEditorMode(mode) {
  store.set({ editorMode: mode });
}

/**
 * Met à jour les réglages
 * @param {object} settings
 */
export function updateSettings(settings) {
  const { settings: current } = store.getState();
  store.set({ settings: { ...current, ...settings } });
}

/**
 * Ajoute un toast
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} duration
 */
export function showToast(message, type = 'info', duration = 3000) {
  const { toasts } = store.getState();
  const id = Date.now() + Math.random();
  const toast = { id, message, type, duration };
  
  store.set({ toasts: [...toasts, toast] });
  
  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }
}

/**
 * Retire un toast
 * @param {number} id
 */
export function removeToast(id) {
  const { toasts } = store.getState();
  store.set({ toasts: toasts.filter(t => t.id !== id) });
}

/**
 * Ouvre une modale
 * @param {string} name
 * @param {any} data
 */
export function openModal(name, data = {}) {
  const { modals } = store.getState();
  store.set({ modals: { ...modals, [name]: { open: true, ...data } } });
}

/**
 * Ferme une modale
 * @param {string} name
 */
export function closeModal(name) {
  const { modals } = store.getState();
  store.set({ modals: { ...modals, [name]: { open: false } } });
}

/**
 * Définit le statut en ligne/hors ligne
 * @param {boolean} online
 */
export function setOnline(online) {
  store.set({ isOnline: online });
}

/**
 * Met à jour le zoom
 * @param {number} level
 */
export function setZoomLevel(level) {
  store.set({ zoomLevel: Math.max(50, Math.min(200, level)) });
}

/**
 * Met à jour les tags disponibles
 */
export async function refreshTags() {
  const tags = await getAllTags();
  store.set({ allTags: tags });
}

/**
 * Recherche/remplacement : met à jour les options
 * @param {object} options
 */
export function setFindOptions(options) {
  const { findOptions } = store.getState();
  store.set({ findOptions: { ...findOptions, ...options } });
}

/**
 * Recherche/remplacement : lance la recherche
 * @param {string} query
 */
export function doFind(query) {
  const { editorContent, findOptions } = store.getState();
  if (!query) {
    store.set({ findQuery: '', findMatches: [], currentMatchIndex: -1 });
    return;
  }
  
  let flags = 'g';
  if (!findOptions.caseSensitive) flags += 'i';
  
  let pattern = query;
  if (!findOptions.regex) {
    pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  if (findOptions.wholeWord) {
    pattern = '\\b' + pattern + '\\b';
  }
  
  try {
    const regex = new RegExp(pattern, flags);
    const matches = [];
    let match;
    
    while ((match = regex.exec(editorContent)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length });
      if (!flags.includes('g')) break;
    }
    
    store.set({ 
      findQuery: query, 
      findMatches: matches, 
      currentMatchIndex: matches.length > 0 ? 0 : -1 
    });
  } catch (e) {
    store.set({ findQuery: query, findMatches: [], currentMatchIndex: -1 });
  }
}

/**
 * Va à la correspondance suivante/précédente
 * @param {number} direction
 */
export function gotoMatch(direction) {
  const { findMatches, currentMatchIndex, findOptions } = store.getState();
  if (!findMatches.length) return;
  
  let newIndex = currentMatchIndex + direction;
  if (newIndex >= findMatches.length) {
    newIndex = findOptions.wrapAround ? 0 : findMatches.length - 1;
  }
  if (newIndex < 0) {
    newIndex = findOptions.wrapAround ? findMatches.length - 1 : 0;
  }
  
  store.set({ currentMatchIndex: newIndex });
}

/**
 * Remplace la correspondance courante
 * @param {string} replacement
 */
export function replaceCurrent(replacement) {
  const { editorContent, findMatches, currentMatchIndex, activeTabId } = store.getState();
  if (currentMatchIndex < 0 || currentMatchIndex >= findMatches.length) return;
  
  const match = findMatches[currentMatchIndex];
  const newContent = 
    editorContent.slice(0, match.start) + 
    replacement + 
    editorContent.slice(match.end);
  
  const offset = replacement.length - (match.end - match.start);
  
  // Met à jour les matches suivants
  const updatedMatches = findMatches.map((m, i) => {
    if (i <= currentMatchIndex) return m;
    return { start: m.start + offset, end: m.end + offset };
  });
  
  // Met à jour le contenu
  const { tabs } = store.getState();
  const tab = tabs.find(t => t.id === activeTabId);
  const cursorPos = tab?.cursorPosition || { start: match.start + replacement.length, end: match.start + replacement.length };
  
  updateEditorContent(newContent, cursorPos, tab?.scrollTop || 0);
  
  store.set({ 
    findMatches: updatedMatches,
    editorContent: newContent
  });
}

/**
 * Remplace toutes les correspondances
 * @param {string} replacement
 * @returns {number} nombre de remplacements
 */
export function replaceAll(replacement) {
  const { editorContent, findMatches, activeTabId } = store.getState();
  if (!findMatches.length) return 0;
  
  let newContent = editorContent;
  let offset = 0;
  
  for (const match of findMatches) {
    const start = match.start + offset;
    const end = match.end + offset;
    newContent = newContent.slice(0, start) + replacement + newContent.slice(end);
    offset += replacement.length - (match.end - match.start);
  }
  
  const { tabs } = store.getState();
  const tab = tabs.find(t => t.id === activeTabId);
  const cursorPos = tab?.cursorPosition || { start: 0, end: 0 };
  
  updateEditorContent(newContent, cursorPos, tab?.scrollTop || 0);
  
  store.set({ 
    findMatches: [], 
    currentMatchIndex: -1,
    editorContent: newContent
  });
  
  return findMatches.length;
}