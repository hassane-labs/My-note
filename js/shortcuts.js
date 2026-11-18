/* ==========================================================================
   My Note - Shortcuts (Gestionnaire raccourcis clavier global)
   ========================================================================== */

import { store, saveCurrentNote, newTab, closeTab, switchTab, setActiveTab, 
         loadNote, toggleFocusMode, setCommandPaletteOpen, globalSearch,
         setSearchQuery, refreshNotesList, showToast, openModal, closeModal,
         setEditorMode, setZoomLevel, doFind, gotoMatch, replaceCurrent, replaceAll,
         setFindOptions } from './store.js';
import { t } from './i18n.js';

/**
 * Normalise un raccourci en chaîne canonique
 * @param {KeyboardEvent} e
 * @returns {string}
 */
export function normalizeShortcut(e) {
  const parts = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  if (e.key.length === 1) {
    parts.push(e.key.toUpperCase());
  } else {
    const keyMap = {
      'Escape': 'Esc',
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right',
      'Enter': 'Enter',
      'Tab': 'Tab',
      'Backspace': 'Backspace',
      'Delete': 'Del',
      'Insert': 'Ins',
      'Home': 'Home',
      'End': 'End',
      'PageUp': 'PgUp',
      'PageDown': 'PgDn',
      'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5',
      'F6': 'F6', 'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10',
      'F11': 'F11', 'F12': 'F12',
      ' ': 'Space',
      '+': '+',
      '-': '-',
      '=': '=',
      '/': '/',
      '.': '.',
      ',': ',',
      ';': ';',
      "'": "'",
      '`': '`',
      '[': '[',
      ']': ']',
      '\\': '\\'
    };
    parts.push(keyMap[e.key] || e.key);
  }
  return parts.join('+');
}

/**
 * Vérifie si un raccourci correspond
 * @param {string} shortcut - ex: "Ctrl+K"
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function matchShortcut(shortcut, e) {
  const normalized = normalizeShortcut(e);
  return normalized.toLowerCase() === shortcut.toLowerCase();
}

/* ==========================================================================
   Définition des raccourcis
   ========================================================================== */

const shortcuts = [
  // Fichier / Notes
  { keys: ['Alt+N'], action: 'newNote', description: 'shortcutNewNote', global: true },
  { keys: ['Ctrl+T'], action: 'newTab', description: 'shortcutNewTab', global: true },
  { keys: ['Ctrl+W'], action: 'closeTab', description: 'shortcutCloseTab', global: true },
  { keys: ['Ctrl+Tab'], action: 'nextTab', description: 'shortcutNextTab', global: true },
  { keys: ['Ctrl+Shift+Tab'], action: 'prevTab', description: 'shortcutPrevTab', global: true },
  { keys: ['Ctrl+S'], action: 'save', description: 'save', global: true, preventDefault: true },
  { keys: ['Ctrl+P'], action: 'print', description: 'shortcutPrint', global: true },
  
  // Recherche / Navigation
  { keys: ['Ctrl+K'], action: 'commandPalette', description: 'shortcutCommandPalette', global: true },
  { keys: ['Ctrl+F'], action: 'find', description: 'shortcutFind', global: true },
  { keys: ['Ctrl+H'], action: 'replace', description: 'shortcutReplace', global: true },
  { keys: ['F3'], action: 'findNext', description: 'shortcutFindNext', global: true },
  { keys: ['Shift+F3'], action: 'findPrev', description: 'shortcutFindPrev', global: true },
  { keys: ['Ctrl+G'], action: 'gotoLine', description: 'shortcutGotoLine', global: true },
  { keys: ['Ctrl+Shift+F'], action: 'globalSearch', description: 'shortcutGlobalSearch', global: true },
  
  // Édition
  { keys: ['Ctrl+B'], action: 'bold', description: 'shortcutBold', editor: true },
  { keys: ['Ctrl+I'], action: 'italic', description: 'shortcutItalic', editor: true },
  { keys: ['Ctrl+K'], action: 'link', description: 'shortcutLink', editor: true }, // Conflit avec palette
  { keys: ['Ctrl+Enter'], action: 'checkTask', description: 'shortcutCheckTask', editor: true },
  { keys: ['F5'], action: 'insertDate', description: 'shortcutInsertDate', editor: true, global: true },
  { keys: ['Ctrl+Shift+V'], action: 'pastePlain', description: 'shortcutPastePlain', editor: true },
  { keys: ['Ctrl+Z'], action: 'undo', description: 'undo', editor: true },
  { keys: ['Ctrl+Y'], action: 'redo', description: 'redo', editor: true },
  { keys: ['Ctrl+Shift+Z'], action: 'redo', description: 'redo', editor: true },
  
  // Affichage
  { keys: ['Ctrl+Shift+.'], action: 'focusMode', description: 'shortcutFocusMode', global: true },
  { keys: ['Ctrl+='], action: 'zoomIn', description: 'shortcutZoomIn', global: true },
  { keys: ['Ctrl+-'], action: 'zoomOut', description: 'shortcutZoomOut', global: true },
  { keys: ['Ctrl+0'], action: 'zoomReset', description: 'shortcutZoomReset', global: true },
  { keys: ['Ctrl++'], action: 'zoomIn', description: 'shortcutZoomIn', global: true }, // Alternative
  
  // Aide
  { keys: ['?'], action: 'shortcuts', description: 'shortcutHelp', global: true },
  { keys: ['Ctrl+/'], action: 'shortcuts', description: 'shortcutHelp', global: true },
  
  // Mode éditeur
  { keys: ['Ctrl+1'], action: 'modeWrite', description: 'writeMode', global: true },
  { keys: ['Ctrl+2'], action: 'modePreview', description: 'previewMode', global: true },
  { keys: ['Ctrl+3'], action: 'modeSplit', description: 'splitMode', global: true }
];

/* ==========================================================================
   Handlers d'actions
   ========================================================================== */

const handlers = {
  newNote: () => newTab(),
  newTab: () => newTab(),
  closeTab: () => {
    const { activeTabId, tabs } = store.getState();
    if (tabs.length <= 1) return;
    closeTab(activeTabId);
  },
  nextTab: () => switchTab(1),
  prevTab: () => switchTab(-1),
  save: () => saveCurrentNote(),
  print: () => window.print(),
  
  commandPalette: () => {
    const { commandPaletteOpen } = store.getState();
    setCommandPaletteOpen(!commandPaletteOpen);
  },
  find: () => openModal('find'),
  replace: () => openModal('replace'),
  findNext: () => gotoMatch(1),
  findPrev: () => gotoMatch(-1),
  gotoLine: () => openModal('gotoLine'),
  globalSearch: () => {
    const { globalSearchOpen } = store.getState();
    if (globalSearchOpen) {
      store.set({ globalSearchOpen: false });
    } else {
      // Ouvre une modale ou focus l'input de recherche globale
      openModal('globalSearch');
    }
  },
  
  bold: () => insertMarkdown('**', '**'),
  italic: () => insertMarkdown('*', '*'),
  link: () => insertMarkdown('[', '](url)'),
  checkTask: () => toggleTaskAtCursor(),
  insertDate: () => insertAtCursor(formatDateTime()),
  pastePlain: () => pasteAsPlainText(),
  undo: () => document.execCommand('undo'),
  redo: () => document.execCommand('redo'),
  
  focusMode: () => toggleFocusMode(),
  zoomIn: () => {
    const { zoomLevel } = store.getState();
    setZoomLevel(zoomLevel + 10);
  },
  zoomOut: () => {
    const { zoomLevel } = store.getState();
    setZoomLevel(zoomLevel - 10);
  },
  zoomReset: () => setZoomLevel(100),
  
  shortcuts: () => openModal('shortcuts'),
  
  modeWrite: () => setEditorMode('write'),
  modePreview: () => setEditorMode('preview'),
  modeSplit: () => setEditorMode('split')
};

/* ==========================================================================
   Helpers éditeur
   ========================================================================== */

function getTextarea() {
  return document.querySelector('.editor-textarea');
}

function insertAtCursor(text) {
  const textarea = getTextarea();
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const content = textarea.value;
  
  textarea.value = content.slice(0, start) + text + content.slice(end);
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
  textarea.focus();
  
  // Déclenche l'event input pour sauvegarde
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertMarkdown(before, after) {
  const textarea = getTextarea();
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const content = textarea.value;
  const selected = content.slice(start, end);
  
  let newText, newStart, newEnd;
  
  if (selected) {
    newText = before + selected + after;
    newStart = start;
    newEnd = start + newText.length;
  } else {
    newText = before + after;
    newStart = start + before.length;
    newEnd = newStart;
  }
  
  textarea.value = content.slice(0, start) + newText + content.slice(end);
  textarea.selectionStart = newStart;
  textarea.selectionEnd = newEnd;
  textarea.focus();
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function toggleTaskAtCursor() {
  const textarea = getTextarea();
  if (!textarea) return;
  
  const content = textarea.value;
  const cursorPos = textarea.selectionStart;
  
  // Trouve la ligne courante
  const beforeCursor = content.slice(0, cursorPos);
  const lines = beforeCursor.split('\n');
  const currentLineIndex = lines.length - 1;
  const lineStart = content.lastIndexOf('\n', cursorPos - 1) + 1;
  const lineEnd = content.indexOf('\n', cursorPos);
  const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  
  // Vérifie si c'est une tâche
  const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ x])\](.*)$/);
  if (taskMatch) {
    const indent = taskMatch[1];
    const checked = taskMatch[2] === 'x';
    const rest = taskMatch[3];
    const newLine = `${indent}- [${checked ? ' ' : 'x'}]${rest}`;
    
    const newContent = content.slice(0, lineStart) + newLine + content.slice(lineEnd === -1 ? content.length : lineEnd);
    textarea.value = newContent;
    
    // Ajuste le curseur
    const newCursorPos = lineStart + newLine.length;
    textarea.selectionStart = textarea.selectionEnd = newCursorPos;
    textarea.focus();
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function formatDateTime() {
  const now = new Date();
  return now.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', '');
}

async function pasteAsPlainText() {
  const textarea = getTextarea();
  if (!textarea) return;
  
  try {
    const text = await navigator.clipboard.readText();
    insertAtCursor(text);
  } catch (e) {
    // Fallback: l'event paste sera géré par l'éditeur
    showToast(t('error'), 'error');
  }
}

/* ==========================================================================
   Gestionnaire principal
   ========================================================================== */

let isInputFocused = false;

export function initShortcuts() {
  // Track focus sur inputs
  document.addEventListener('focusin', (e) => {
    const target = e.target;
    isInputFocused = target.matches('input, textarea, select, [contenteditable="true"]') ||
                     target.closest('.command-palette-input, .search-input, .find-input, .replace-input') !== null;
  });
  
  document.addEventListener('focusout', () => {
    isInputFocused = false;
  });
  
  // Gestionnaire global
  document.addEventListener('keydown', handleKeydown, true);
  
  // Raccourcis spécifiques à l'éditeur (sur le textarea)
  const textarea = document.querySelector('.editor-textarea');
  if (textarea) {
    textarea.addEventListener('keydown', handleEditorKeydown);
  }
  
  // Molette pour zoom
  document.addEventListener('wheel', handleWheel, { passive: false });
}

function handleKeydown(e) {
  // Ignore si dans un input (sauf raccourcis globaux)
  const target = e.target;
  const isInInput = target.matches('input, textarea, select, [contenteditable="true"]');
  
  for (const shortcut of shortcuts) {
    for (const key of shortcut.keys) {
      if (matchShortcut(key, e)) {
        // Vérifie si le raccourci est autorisé ici
        const isGlobal = shortcut.global;
        const isEditorOnly = shortcut.editor;
        
        if (isEditorOnly && !isInInput) continue;
        if (!isGlobal && isInInput && !isEditorOnly) continue;
        
        // Conflit Ctrl+K : palette globale vs lien dans éditeur
        if (key === 'Ctrl+K' && isInInput) {
          // Dans l'éditeur, Ctrl+K = lien. Palette = Ctrl+K hors éditeur ou Ctrl+Shift+K
          if (target.closest('.editor-textarea')) {
            handlers.link();
            e.preventDefault();
            return;
          }
        }
        
        // Conflit Ctrl+F : recherche navigateur vs recherche dans note
        if (key === 'Ctrl+F' && isInInput && target.closest('.editor-textarea')) {
          handlers.find();
          e.preventDefault();
          return;
        }
        
        // Conflit Ctrl+H : historique navigateur vs remplacer
        if (key === 'Ctrl+H' && isInInput && target.closest('.editor-textarea')) {
          handlers.replace();
          e.preventDefault();
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const handler = handlers[shortcut.action];
        if (handler) handler();
        return;
      }
    }
  }
  
  // Gestion Tab / Shift+Tab pour indentation dans l'éditeur
  if (e.key === 'Tab' && isInInput && target.closest('.editor-textarea')) {
    handleTabIndentation(e, target);
  }
}

function handleEditorKeydown(e) {
  // Raccourcis spécifiques à l'éditeur
  const { findMatches, currentMatchIndex, findOptions } = store.getState();
  
  // Échap : ferme modales, palette, recherche
  if (e.key === 'Escape') {
    const { commandPaletteOpen, globalSearchOpen, modals } = store.getState();
    if (commandPaletteOpen) {
      setCommandPaletteOpen(false);
      e.preventDefault();
    } else if (globalSearchOpen) {
      store.set({ globalSearchOpen: false });
      e.preventDefault();
    } else if (modals.find?.open || modals.replace?.open || modals.gotoLine?.open) {
      closeModal('find');
      closeModal('replace');
      closeModal('gotoLine');
      e.preventDefault();
    } else if (findMatches.length) {
      store.set({ findQuery: '', findMatches: [], currentMatchIndex: -1 });
      e.preventDefault();
    }
  }
  
  // Entrée : continuation listes Markdown
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
    handleMarkdownListContinuation(e);
  }
  
  // Ctrl+Flèches : navigation mots
  if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    // Laissé au navigateur
  }
}

function handleTabIndentation(e, textarea) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  
  if (start !== end) {
    // Sélection : indente/désindente toutes les lignes
    e.preventDefault();
    const content = textarea.value;
    const before = content.slice(0, start);
    const selected = content.slice(start, end);
    const after = content.slice(end);
    
    const lines = selected.split('\n');
    const isIndent = !e.shiftKey;
    const newLines = lines.map(line => 
      isIndent ? '\t' + line : line.startsWith('\t') ? line.slice(1) : line
    );
    
    const newSelected = newLines.join('\n');
    textarea.value = before + newSelected + after;
    
    const newStart = start;
    const newEnd = start + newSelected.length;
    textarea.selectionStart = newStart;
    textarea.selectionEnd = newEnd;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // Pas de sélection : insère tab (comportement par défaut)
    // On laisse le navigateur gérer
  }
}

function handleMarkdownListContinuation(e) {
  const textarea = e.target;
  const content = textarea.value;
  const cursorPos = textarea.selectionStart;
  
  // Ligne courante
  const beforeCursor = content.slice(0, cursorPos);
  const lines = beforeCursor.split('\n');
  const currentLine = lines[lines.length - 1];
  
  // Liste à puces
  const bulletMatch = currentLine.match(/^(\s*)([-*+])\s+(.*)$/);
  if (bulletMatch) {
    const indent = bulletMatch[1];
    const marker = bulletMatch[2];
    const text = bulletMatch[3];
    
    if (!text.trim()) {
      // Ligne vide : retire le marqueur
      e.preventDefault();
      const lineStart = cursorPos - currentLine.length;
      const newContent = content.slice(0, lineStart) + indent + content.slice(cursorPos);
      textarea.value = newContent;
      textarea.selectionStart = textarea.selectionEnd = lineStart + indent.length;
    } else {
      // Continue la liste
      e.preventDefault();
      const newLine = indent + marker + ' ';
      const newContent = content.slice(0, cursorPos) + '\n' + newLine + content.slice(cursorPos);
      textarea.value = newContent;
      textarea.selectionStart = textarea.selectionEnd = cursorPos + 1 + newLine.length;
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  
  // Liste numérotée
  const numMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
  if (numMatch) {
    const indent = numMatch[1];
    const num = parseInt(numMatch[2], 10);
    const text = numMatch[3];
    
    if (!text.trim()) {
      e.preventDefault();
      const lineStart = cursorPos - currentLine.length;
      const newContent = content.slice(0, lineStart) + indent + content.slice(cursorPos);
      textarea.value = newContent;
      textarea.selectionStart = textarea.selectionEnd = lineStart + indent.length;
    } else {
      e.preventDefault();
      const newLine = indent + (num + 1) + '. ';
      const newContent = content.slice(0, cursorPos) + '\n' + newLine + content.slice(cursorPos);
      textarea.value = newContent;
      textarea.selectionStart = textarea.selectionEnd = cursorPos + 1 + newLine.length;
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  
  // Liste de tâches
  const taskMatch = currentLine.match(/^(\s*)[-*+]\s+\[([ x])\]\s+(.*)$/);
  if (taskMatch) {
    const indent = taskMatch[1];
    const checked = taskMatch[2];
    const text = taskMatch[3];
    
    if (!text.trim()) {
      e.preventDefault();
      const lineStart = cursorPos - currentLine.length;
      const newContent = content.slice(0, lineStart) + indent + content.slice(cursorPos);
      textarea.value = newContent;
      textarea.selectionStart = textarea.selectionEnd = lineStart + indent.length;
    } else {
      e.preventDefault();
      const newLine = indent + '- [ ] ';
      const newContent = content.slice(0, cursorPos) + '\n' + newLine + content.slice(cursorPos);
      textarea.value = newContent;
      textarea.selectionStart = textarea.selectionEnd = cursorPos + 1 + newLine.length;
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  
  // Citation
  const quoteMatch = currentLine.match(/^(\s*)>\s*(.*)$/);
  if (quoteMatch) {
    const indent = quoteMatch[1];
    const text = quoteMatch[2];
    
    if (!text.trim()) {
      e.preventDefault();
      const lineStart = cursorPos - currentLine.length;
      const newContent = content.slice(0, lineStart) + indent + content.slice(cursorPos);
      textarea.value = newContent;
      textarea.selectionStart = textarea.selectionEnd = lineStart + indent.length;
    } else {
      e.preventDefault();
      const newLine = indent + '> ';
      const newContent = content.slice(0, cursorPos) + '\n' + newLine + content.slice(cursorPos);
      textarea.value = newContent;
      textarea.selectionStart = textarea.selectionEnd = cursorPos + 1 + newLine.length;
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function handleWheel(e) {
  if ((e.ctrlKey || e.metaKey) && e.target.closest('.editor-pane')) {
    e.preventDefault();
    const { zoomLevel } = store.getState();
    const delta = e.deltaY > 0 ? -10 : 10;
    setZoomLevel(zoomLevel + delta);
  }
}

/* ==========================================================================
   Aide raccourcis
   ========================================================================== */

export function getShortcutsHelp() {
  const groups = {
    'Fichier': ['newNote', 'newTab', 'closeTab', 'nextTab', 'prevTab', 'save', 'print'],
    'Recherche': ['commandPalette', 'find', 'replace', 'findNext', 'findPrev', 'gotoLine', 'globalSearch'],
    'Édition': ['bold', 'italic', 'link', 'checkTask', 'insertDate', 'pastePlain', 'undo', 'redo'],
    'Affichage': ['focusMode', 'zoomIn', 'zoomOut', 'zoomReset', 'modeWrite', 'modePreview', 'modeSplit'],
    'Aide': ['shortcuts']
  };
  
  const result = {};
  for (const [group, actions] of Object.entries(groups)) {
    result[group] = actions.map(action => {
      const shortcut = shortcuts.find(s => s.action === action);
      if (!shortcut) return null;
      return {
        keys: shortcut.keys.join(' / '),
        description: t(shortcut.description)
      };
    }).filter(Boolean);
  }
  
  return result;
}