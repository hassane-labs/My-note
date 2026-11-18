/* ==========================================================================
   My Note - Palette (Palette de commandes Ctrl+K)
   ========================================================================== */

import { store, setCommandPaletteOpen, newTab, closeTab, saveCurrentNote, 
         toggleFocusMode, setEditorMode, updateSettings, openModal, globalSearch,
         loadNote, refreshNotesList } from './store.js';
import { getAllNotes, getAllTags } from './db.js';
import { t } from './i18n.js';
import { fuzzyMatch, formatDate } from './utils.js';

let paletteContainer = null;
let paletteInput = null;
let paletteList = null;
let allCommands = [];

/* ==========================================================================
   Définition des commandes
   ========================================================================== */

function buildCommands() {
  const { tabs, notes, settings } = store.getState();
  
  return [
    // Notes
    { id: 'newNote', title: t('newNote'), desc: t('shortcutNewNote'), shortcut: 'Alt+N', action: () => newTab(), keywords: ['new', 'note', 'create', 'nouveau', 'créer'] },
    { id: 'newTab', title: t('newTab'), desc: t('shortcutNewTab'), shortcut: 'Ctrl+T', action: () => newTab(), keywords: ['tab', 'onglet'] },
    { id: 'closeTab', title: t('closeTab'), desc: t('shortcutCloseTab'), shortcut: 'Ctrl+W', action: () => closeTab(store.getState().activeTabId), keywords: ['close', 'fermer'] },
    { id: 'save', title: t('save'), desc: t('shortcutSave'), shortcut: 'Ctrl+S', action: () => saveCurrentNote(), keywords: ['save', 'enregistrer'] },
    
    // Recherche
    { id: 'find', title: t('find'), desc: t('shortcutFind'), shortcut: 'Ctrl+F', action: () => openModal('find'), keywords: ['find', 'search', 'rechercher', 'chercher'] },
    { id: 'replace', title: t('replace'), desc: t('shortcutReplace'), shortcut: 'Ctrl+H', action: () => openModal('replace'), keywords: ['replace', 'remplacer'] },
    { id: 'globalSearch', title: t('globalSearch'), desc: t('shortcutGlobalSearch'), shortcut: 'Ctrl+Shift+F', action: () => openModal('globalSearch'), keywords: ['global', 'search', 'recherche', 'globale'] },
    { id: 'gotoLine', title: t('gotoLine'), desc: t('shortcutGotoLine'), shortcut: 'Ctrl+G', action: () => openModal('gotoLine'), keywords: ['line', 'ligne', 'goto', 'aller'] },
    
    // Éditeur
    { id: 'focusMode', title: t('focusMode'), desc: t('shortcutFocusMode'), shortcut: 'Ctrl+Shift+.', action: () => toggleFocusMode(), keywords: ['focus', 'zen', 'distraction'] },
    { id: 'modeWrite', title: t('writeMode'), desc: '', shortcut: 'Ctrl+1', action: () => setEditorMode('write'), keywords: ['write', 'écrire', 'edit', 'éditer'] },
    { id: 'modePreview', title: t('previewMode'), desc: '', shortcut: 'Ctrl+2', action: () => setEditorMode('preview'), keywords: ['preview', 'aperçu', 'view', 'voir'] },
    { id: 'modeSplit', title: t('splitMode'), desc: '', shortcut: 'Ctrl+3', action: () => setEditorMode('split'), keywords: ['split', 'côté', 'cote', 'side'] },
    
    // Affichage
    { id: 'zoomIn', title: t('zoomIn'), desc: t('shortcutZoomIn'), shortcut: 'Ctrl++', action: () => { const { zoomLevel } = store.getState(); import('./store.js').then(m => m.setZoomLevel(zoomLevel + 10)); }, keywords: ['zoom', 'in', 'agrandir'] },
    { id: 'zoomOut', title: t('zoomOut'), desc: t('shortcutZoomOut'), shortcut: 'Ctrl+-', action: () => { const { zoomLevel } = store.getState(); import('./store.js').then(m => m.setZoomLevel(zoomLevel - 10)); }, keywords: ['zoom', 'out', 'réduire', 'reduire'] },
    { id: 'zoomReset', title: t('zoomReset'), desc: t('shortcutZoomReset'), shortcut: 'Ctrl+0', action: () => import('./store.js').then(m => m.setZoomLevel(100)), keywords: ['zoom', 'reset', '100'] },
    
    // Thèmes
    { id: 'themeDark', title: t('darkTheme'), desc: '', shortcut: '', action: () => updateSettings({ theme: 'dark' }), keywords: ['theme', 'dark', 'sombre', 'thème'] },
    { id: 'themeLight', title: t('lightTheme'), desc: '', shortcut: '', action: () => updateSettings({ theme: 'light' }), keywords: ['theme', 'light', 'clair', 'thème'] },
    { id: 'themeAuto', title: t('autoTheme'), desc: '', shortcut: '', action: () => updateSettings({ theme: 'auto' }), keywords: ['theme', 'auto', 'system', 'système'] },
    
    // Export/Import
    { id: 'exportMd', title: t('exportMarkdown'), desc: '', shortcut: '', action: () => openModal('export', { format: 'md' }), keywords: ['export', 'markdown', 'md', 'exporter'] },
    { id: 'exportTxt', title: t('exportText'), desc: '', shortcut: '', action: () => openModal('export', { format: 'txt' }), keywords: ['export', 'text', 'txt', 'exporter'] },
    { id: 'exportHtml', title: t('exportHtml'), desc: '', shortcut: '', action: () => openModal('export', { format: 'html' }), keywords: ['export', 'html', 'exporter'] },
    { id: 'exportPdf', title: t('exportPdf'), desc: t('shortcutPrint'), shortcut: 'Ctrl+P', action: () => window.print(), keywords: ['export', 'pdf', 'print', 'imprimer'] },
    { id: 'exportJson', title: t('backupJson'), desc: '', shortcut: '', action: () => openModal('export', { format: 'json' }), keywords: ['export', 'backup', 'json', 'sauvegarde'] },
    { id: 'importFiles', title: t('importFiles'), desc: '', shortcut: '', action: () => openModal('import'), keywords: ['import', 'importer', 'files', 'fichiers'] },
    
    // Réglages
    { id: 'settings', title: t('settings'), desc: '', shortcut: '', action: () => openModal('settings'), keywords: ['settings', 'réglages', 'preferences', 'preferences'] },
    { id: 'shortcuts', title: t('shortcuts'), desc: t('shortcutHelp'), shortcut: '?', action: () => openModal('shortcuts'), keywords: ['shortcuts', 'raccourcis', 'help', 'aide'] },
    
    // Notes récentes (dynamique)
    ...notes.filter(n => !n.deletedAt && !n.archived).slice(0, 10).map(note => ({
      id: `note-${note.id}`,
      title: note.title || t('untitled'),
      desc: formatDate(note.updatedAt, { relative: true }),
      shortcut: '',
      action: () => loadNote(note.id),
      keywords: [note.title, ...note.tags].filter(Boolean)
    })),
    
    // Tags (dynamique)
    ...getAllTags().slice(0, 10).map(tag => ({
      id: `tag-${tag}`,
      title: `#${tag}`,
      desc: t('filterByTag'),
      shortcut: '',
      action: () => { store.set({ searchQuery: `#${tag}` }); refreshNotesList({ tag }); setCommandPaletteOpen(false); },
      keywords: [tag, 'tag', 'filter', 'filtrer']
    }))
  ];
}

/* ==========================================================================
   Rendu de la palette
   ========================================================================== */

export function renderCommandPalette() {
  paletteContainer = document.getElementById('commandPaletteContainer');
  if (!paletteContainer) return;
  
  const { commandPaletteOpen } = store.getState();
  
  paletteContainer.innerHTML = `
    <div class="command-palette ${commandPaletteOpen ? 'open' : ''}" id="commandPalette" role="dialog" aria-label="${t('commandPalette')}" aria-modal="true">
      <div class="command-palette-input-wrapper">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted);">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          class="command-palette-input" 
          id="commandPaletteInput"
          placeholder="${t('typeCommand')}"
          data-i18n-placeholder="typeCommand"
          autocomplete="off"
          spellcheck="false"
          aria-label="${t('commandPalette')}"
        >
        <kbd style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: var(--font-size-xs); color: var(--muted);">⌘K</kbd>
      </div>
      <div class="command-palette-list" id="commandPaletteList" role="listbox"></div>
    </div>
  `;
  
  paletteInput = document.getElementById('commandPaletteInput');
  paletteList = document.getElementById('commandPaletteList');
  
  if (commandPaletteOpen) {
    setTimeout(() => paletteInput?.focus(), 50);
    updatePaletteList('');
  }
}

function updatePaletteList(query) {
  if (!paletteList) return;
  
  allCommands = buildCommands();
  const normalizedQuery = query.toLowerCase().trim();
  
  let filtered = allCommands;
  if (normalizedQuery) {
    filtered = allCommands
      .map(cmd => {
        const searchText = `${cmd.title} ${cmd.desc} ${cmd.keywords.join(' ')} ${cmd.shortcut}`.toLowerCase();
        const score = fuzzyMatch(normalizedQuery, searchText);
        return { ...cmd, score };
      })
      .filter(cmd => cmd.score > 0)
      .sort((a, b) => b.score - a.score);
  }
  
  if (filtered.length === 0) {
    paletteList.innerHTML = `
      <div class="command-item" style="justify-content: center; padding: var(--space-6); color: var(--muted);">
        ${t('noCommands')}
      </div>
    `;
    return;
  }
  
  paletteList.innerHTML = filtered.map((cmd, index) => `
    <div class="command-item ${index === 0 ? 'selected' : ''}" 
         role="option" 
         data-command-id="${cmd.id}"
         aria-selected="${index === 0}">
      <div class="command-item-content">
        <div class="command-item-title">${escapeHtml(cmd.title)}</div>
        ${cmd.desc ? `<div class="command-item-desc">${escapeHtml(cmd.desc)}</div>` : ''}
      </div>
      ${cmd.shortcut ? `<kbd class="command-item-shortcut">${escapeHtml(cmd.shortcut)}</kbd>` : ''}
    </div>
  `).join('');
  
  // Sélectionne le premier
  const firstItem = paletteList.querySelector('.command-item');
  if (firstItem) {
    firstItem.scrollIntoView({ block: 'nearest' });
  }
}

/* ==========================================================================
   Setup
   ========================================================================== */

export function setupCommandPalette() {
  paletteContainer = document.getElementById('commandPaletteContainer');
  paletteInput = document.getElementById('commandPaletteInput');
  paletteList = document.getElementById('commandPaletteList');
  if (!paletteContainer) return;
  
  // Input events
  paletteInput?.addEventListener('input', (e) => {
    updatePaletteList(e.target.value);
  });
  
  paletteInput?.addEventListener('keydown', (e) => {
    const items = paletteList?.querySelectorAll('.command-item');
    if (!items?.length) return;
    
    const selectedIndex = Array.from(items).findIndex(el => el.classList.contains('selected'));
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectItem(items, selectedIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectItem(items, selectedIndex - 1);
        break;
      case 'Enter':
        e.preventDefault();
        executeSelectedCommand(items, selectedIndex);
        break;
      case 'Escape':
        setCommandPaletteOpen(false);
        break;
    }
  });
  
  // Click sur item
  paletteList?.addEventListener('click', (e) => {
    const item = e.target.closest('.command-item');
    if (item) {
      const index = Array.from(paletteList.querySelectorAll('.command-item')).indexOf(item);
      executeSelectedCommand(paletteList.querySelectorAll('.command-item'), index);
    }
  });
  
  // Ferme au clic extérieur
  document.addEventListener('click', (e) => {
    const palette = document.getElementById('commandPalette');
    if (palette && !palette.contains(e.target) && store.getState().commandPaletteOpen) {
      setCommandPaletteOpen(false);
    }
  });
  
  // Store subscription
  store.subscribe((state, prevState) => {
    if (state.commandPaletteOpen !== prevState.commandPaletteOpen) {
      const palette = document.getElementById('commandPalette');
      if (palette) {
        palette.classList.toggle('open', state.commandPaletteOpen);
      }
      if (state.commandPaletteOpen) {
        setTimeout(() => paletteInput?.focus(), 50);
        paletteInput.value = '';
        updatePaletteList('');
      }
    }
  });
}

function selectItem(items, index) {
  if (index < 0) index = items.length - 1;
  if (index >= items.length) index = 0;
  
  items.forEach((el, i) => {
    el.classList.toggle('selected', i === index);
    el.setAttribute('aria-selected', i === index);
  });
  
  items[index]?.scrollIntoView({ block: 'nearest' });
}

function executeSelectedCommand(items, index) {
  if (index < 0 || index >= items.length) return;
  
  const commandId = items[index].dataset.commandId;
  const command = allCommands.find(c => c.id === commandId);
  
  if (command) {
    command.action();
    setCommandPaletteOpen(false);
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}