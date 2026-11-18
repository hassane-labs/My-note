/* ==========================================================================
   My Note - Editor (Éditeur de texte, textarea + fonctionnalités)
   ========================================================================== */

import { store, updateEditorContent, saveCurrentNote, loadNote, doFind, gotoMatch, 
         replaceCurrent, replaceAll, setFindOptions, setEditorMode } from './store.js';
import { t } from './i18n.js';
import { extractTitle, getLineCol, generateLineNumbers, toggleIndent, toggleTaskLine } from './utils.js';
import { renderMarkdownPreview } from './markdown.js';

let textarea = null;
let lineNumbersEl = null;
let previewEl = null;
let splitResizeHandle = null;
let isResizingSplit = false;

/* ==========================================================================
   Rendu de l'éditeur
   ========================================================================== */

export function renderEditor() {
  const container = document.getElementById('editorContent');
  if (!container) return;
  
  const { editorMode, editorContent, editorTitle, lineNumbers, wordWrap, zoomLevel, activeNoteId } = store.getState();
  
  container.innerHTML = `
    <div class="editor-toolbar" id="editorToolbar" role="toolbar" aria-label="${t('editorToolbar')}">
      <div class="toolbar-group">
        <button class="toolbar-btn" id="modeWriteBtn" aria-label="${t('writeMode')}" data-mode="write" data-i18n-title="writeMode">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
        </button>
        <button class="toolbar-btn" id="modeSplitBtn" aria-label="${t('splitMode')}" data-mode="split" data-i18n-title="splitMode">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="18" rx="1"></rect><rect x="13" y="3" width="8" height="18" rx="1"></rect></svg>
        </button>
        <button class="toolbar-btn" id="modePreviewBtn" aria-label="${t('previewMode')}" data-mode="preview" data-i18n-title="previewMode">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        </button>
      </div>
      <div class="toolbar-group">
        <button class="toolbar-btn" id="boldBtn" aria-label="${t('bold')}" data-action="bold" data-i18n-title="bold"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg></button>
        <button class="toolbar-btn" id="italicBtn" aria-label="${t('italic')}" data-action="italic" data-i18n-title="italic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg></button>
        <button class="toolbar-btn" id="linkBtn" aria-label="${t('link')}" data-action="link" data-i18n-title="link"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></button>
        <button class="toolbar-btn" id="codeBtn" aria-label="${t('code')}" data-action="code" data-i18n-title="code"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></button>
        <button class="toolbar-btn" id="codeBlockBtn" aria-label="${t('codeBlock')}" data-action="codeBlock" data-i18n-title="codeBlock"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 9h6"></path><path d="M9 15h6"></path></svg></button>
      </div>
      <div class="toolbar-group">
        <button class="toolbar-btn" id="heading1Btn" aria-label="${t('heading1')}" data-action="heading1" data-i18n-title="heading1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line><line x1="4" y1="6" x2="4" y2="18"></line><line x1="12" y1="6" x2="12" y2="18"></line><line x1="20" y1="6" x2="20" y2="18"></line></svg></button>
        <button class="toolbar-btn" id="heading2Btn" aria-label="${t('heading2')}" data-action="heading2" data-i18n-title="heading2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16"></path><path d="M4 12h16"></path><path d="M4 18h16"></path></svg></button>
        <button class="toolbar-btn" id="heading3Btn" aria-label="${t('heading3')}" data-action="heading3" data-i18n-title="heading3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16"></path><path d="M4 12h16"></path><path d="M4 18h16"></path></svg></button>
        <button class="toolbar-btn" id="quoteBtn" aria-label="${t('quote')}" data-action="quote" data-i18n-title="quote"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3"></path></svg></button>
      </div>
      <div class="toolbar-group">
        <button class="toolbar-btn" id="bulletListBtn" aria-label="${t('bulletList')}" data-action="bulletList" data-i18n-title="bulletList"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="6" x2="20" y2="6"></line><line x1="9" y1="12" x2="20" y2="12"></line><line x1="9" y1="18" x2="20" y2="18"></line><circle cx="5" cy="6" r="1"></circle><circle cx="5" cy="12" r="1"></circle><circle cx="5" cy="18" r="1"></circle></svg></button>
        <button class="toolbar-btn" id="numberListBtn" aria-label="${t('numberList')}" data-action="numberList" data-i18n-title="numberList"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-2-2-2-3"></path><path d="M4 16h2"></path></svg></button>
        <button class="toolbar-btn" id="taskListBtn" aria-label="${t('taskList')}" data-action="taskList" data-i18n-title="taskList"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></button>
        <button class="toolbar-btn" id="hrBtn" aria-label="${t('horizontalRule')}" data-action="hr" data-i18n-title="horizontalRule"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line></svg></button>
      </div>
      <div class="toolbar-group">
        <button class="toolbar-btn" id="insertDateBtn" aria-label="${t('insertDate')}" data-action="insertDate" data-i18n-title="insertDate"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></button>
        <button class="toolbar-btn" id="wordWrapBtn" aria-label="${t('wordWrap')}" data-action="toggleWordWrap" data-i18n-title="wordWrap"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><path d="M3 12h15a3 3 0 0 1 0 6h-4"></path><path d="M3 18h7"></path></svg></button>
        <button class="toolbar-btn" id="lineNumbersBtn" aria-label="${t('lineNumbers')}" data-action="toggleLineNumbers" data-i18n-title="lineNumbers"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="4" y2="18"></line><line x1="10" y1="6" x2="10" y2="18"></line><line x1="16" y1="6" x2="16" y2="18"></line></svg></button>
        <button class="toolbar-btn" id="focusModeBtn" aria-label="${t('focusMode')}" data-action="focusMode" data-i18n-title="focusMode"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8"></path><path d="M12 17v4"></path></svg></button>
      </div>
    </div>
    
    <div class="editor-modes" id="editorModes">
      ${editorMode === 'write' || editorMode === 'split' ? `
        <div class="editor-mode write" id="writeMode">
          <div class="editor-wrapper" id="editorWrapper">
            ${lineNumbers ? '<div class="line-numbers" id="lineNumbers" aria-hidden="true"></div>' : ''}
            <textarea 
              class="editor-textarea" 
              id="editorTextarea"
              spellcheck="${store.getState().settings.spellcheck ? 'true' : 'false'}"
              placeholder="${t('emptyStateTitle')}"
              data-i18n-placeholder="emptyStateTitle"
              aria-label="${t('editor')}"
            ></textarea>
          </div>
        </div>
      ` : ''}
      
      ${editorMode === 'preview' || editorMode === 'split' ? `
        <div class="editor-mode preview" id="previewMode">
          <div class="markdown-preview" id="markdownPreview" role="region" aria-label="${t('preview')}"></div>
        </div>
      ` : ''}
      
      ${editorMode === 'split' ? `
        <div class="resize-handle" id="splitResizeHandle" role="separator" aria-label="${t('resizeSplit')}"></div>
      ` : ''}
    </div>
  `;
  
  // Récupère les éléments
  textarea = document.getElementById('editorTextarea');
  lineNumbersEl = document.getElementById('lineNumbers');
  previewEl = document.getElementById('markdownPreview');
  splitResizeHandle = document.getElementById('splitResizeHandle');
  
  // Charge le contenu si note active
  const { editorContent: content, cursorPosition, scrollPosition } = store.getState();
  if (textarea && content !== undefined) {
    textarea.value = content;
    if (cursorPosition) {
      textarea.selectionStart = cursorPosition.start;
      textarea.selectionEnd = cursorPosition.end;
    }
    if (scrollPosition) {
      textarea.scrollTop = scrollPosition;
    }
  }
  
  // Met à jour l'aperçu
  if (previewEl) {
    renderMarkdownPreview(content || '');
  }
  
  // Met à jour les numéros de ligne
  updateLineNumbers();
  
  // Applique le zoom
  applyZoom();
  
  // Met à jour l'état des boutons de mode
  updateModeButtons();
}

function updateModeButtons() {
  const { editorMode } = store.getState();
  document.querySelectorAll('.toolbar-btn[data-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === editorMode);
  });
}

/* ==========================================================================
   Setup de l'éditeur
   ========================================================================== */

export function setupEditor() {
  // Toolbar actions
  document.getElementById('boldBtn')?.addEventListener('click', () => insertMarkdown('**', '**'));
  document.getElementById('italicBtn')?.addEventListener('click', () => insertMarkdown('*', '*'));
  document.getElementById('linkBtn')?.addEventListener('click', () => insertMarkdown('[', '](url)'));
  document.getElementById('codeBtn')?.addEventListener('click', () => insertMarkdown('`', '`'));
  document.getElementById('codeBlockBtn')?.addEventListener('click', () => insertMarkdown('```\n', '\n```'));
  document.getElementById('heading1Btn')?.addEventListener('click', () => insertMarkdown('# ', ''));
  document.getElementById('heading2Btn')?.addEventListener('click', () => insertMarkdown('## ', ''));
  document.getElementById('heading3Btn')?.addEventListener('click', () => insertMarkdown('### ', ''));
  document.getElementById('quoteBtn')?.addEventListener('click', () => insertMarkdown('> ', ''));
  document.getElementById('bulletListBtn')?.addEventListener('click', () => insertMarkdown('- ', ''));
  document.getElementById('numberListBtn')?.addEventListener('click', () => insertMarkdown('1. ', ''));
  document.getElementById('taskListBtn')?.addEventListener('click', () => insertMarkdown('- [ ] ', ''));
  document.getElementById('hrBtn')?.addEventListener('click', () => insertMarkdown('\n---\n', ''));
  document.getElementById('insertDateBtn')?.addEventListener('click', () => insertAtCursor(formatDateTime()));
  
  document.getElementById('wordWrapBtn')?.addEventListener('click', toggleWordWrap);
  document.getElementById('lineNumbersBtn')?.addEventListener('click', toggleLineNumbers);
  document.getElementById('focusModeBtn')?.addEventListener('click', () => {
    import('./store.js').then(m => m.toggleFocusMode());
  });
  
  // Mode buttons
  document.getElementById('modeWriteBtn')?.addEventListener('click', () => setEditorMode('write'));
  document.getElementById('modeSplitBtn')?.addEventListener('click', () => setEditorMode('split'));
  document.getElementById('modePreviewBtn')?.addEventListener('click', () => setEditorMode('preview'));
  
  // Textarea events
  if (textarea) {
    textarea.addEventListener('input', handleInput);
    textarea.addEventListener('scroll', handleScroll);
    textarea.addEventListener('keydown', handleTextareaKeydown);
    textarea.addEventListener('paste', handlePaste);
    textarea.addEventListener('focus', () => textarea.parentElement.classList.add('focused'));
    textarea.addEventListener('blur', () => textarea.parentElement.classList.remove('focused'));
  }
  
  // Split resize
  if (splitResizeHandle) {
    splitResizeHandle.addEventListener('mousedown', startSplitResize);
    splitResizeHandle.addEventListener('touchstart', startSplitResize, { passive: true });
  }
  
  // Store subscription pour mise à jour externe
  store.subscribe((state, prevState) => {
    if (state.editorContent !== prevState.editorContent && textarea) {
      // Évite la boucle infinie
      if (textarea.value !== state.editorContent) {
        const pos = { start: textarea.selectionStart, end: textarea.selectionEnd };
        textarea.value = state.editorContent;
        textarea.selectionStart = pos.start;
        textarea.selectionEnd = pos.end;
        updateLineNumbers();
        updatePreview();
      }
    }
    if (state.editorMode !== prevState.editorMode) {
      renderEditor();
      setupEditor();
    }
    if (state.zoomLevel !== prevState.zoomLevel) {
      applyZoom();
    }
    if (state.lineNumbers !== prevState.lineNumbers) {
      updateLineNumbers();
    }
    if (state.wordWrap !== prevState.wordWrap) {
      applyWordWrap();
    }
    if (state.activeNoteId !== prevState.activeNoteId) {
      loadNote(state.activeNoteId);
    }
  });
}

function handleInput(e) {
  const content = e.target.value;
  const cursorPos = { start: e.target.selectionStart, end: e.target.selectionEnd };
  const scrollTop = e.target.scrollTop;
  
  updateEditorContent(content, cursorPos, scrollTop);
  updateLineNumbers();
  updatePreview();
  updateStatusbar();
}

function handleScroll(e) {
  const { activeTabId } = store.getState();
  if (activeTabId) {
    import('./store.js').then(m => m.updateTab(activeTabId, { scrollTop: e.target.scrollTop }));
  }
  // Sync line numbers scroll
  if (lineNumbersEl) {
    lineNumbersEl.scrollTop = e.target.scrollTop;
  }
  // Sync preview scroll in split mode
  if (previewEl && store.getState().editorMode === 'split') {
    const scrollRatio = e.target.scrollTop / (e.target.scrollHeight - e.target.clientHeight);
    previewEl.scrollTop = scrollRatio * (previewEl.scrollHeight - previewEl.clientHeight);
  }
}

function handleTextareaKeydown(e) {
  // Ctrl+Enter pour cocher tâche
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    toggleTaskAtCursor();
  }
  
  // Tab / Shift+Tab pour indentation (géré par shortcuts.js)
  
  // Mise à jour statusbar position
  updateStatusbar();
}

async function handlePaste(e) {
  const { settings } = store.getState();
  if (settings.pastePlain) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    insertAtCursor(text);
  }
}

function insertAtCursor(text) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const content = textarea.value;
  
  textarea.value = content.slice(0, start) + text + content.slice(end);
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
  textarea.focus();
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertMarkdown(before, after) {
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
  if (!textarea) return;
  const content = textarea.value;
  const cursorPos = textarea.selectionStart;
  
  const beforeCursor = content.slice(0, cursorPos);
  const lines = beforeCursor.split('\n');
  const currentLineIndex = lines.length - 1;
  const lineStart = content.lastIndexOf('\n', cursorPos - 1) + 1;
  const lineEnd = content.indexOf('\n', cursorPos);
  const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  
  const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ x])\](.*)$/);
  if (taskMatch) {
    const indent = taskMatch[1];
    const checked = taskMatch[2] === 'x';
    const rest = taskMatch[3];
    const newLine = `${indent}- [${checked ? ' ' : 'x'}]${rest}`;
    
    const newContent = content.slice(0, lineStart) + newLine + content.slice(lineEnd === -1 ? content.length : lineEnd);
    textarea.value = newContent;
    
    const newCursorPos = lineStart + newLine.length;
    textarea.selectionStart = textarea.selectionEnd = newCursorPos;
    textarea.focus();
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function formatDateTime() {
  const now = new Date();
  return now.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).replace(',', '');
}

function toggleWordWrap() {
  const { wordWrap } = store.getState();
  import('./store.js').then(m => m.updateSettings({ wordWrap: !wordWrap }));
}

function toggleLineNumbers() {
  const { lineNumbers } = store.getState();
  import('./store.js').then(m => m.updateSettings({ lineNumbers: !lineNumbers }));
}

function applyWordWrap() {
  const { wordWrap } = store.getState();
  if (textarea) {
    textarea.style.whiteSpace = wordWrap ? 'pre-wrap' : 'pre';
  }
}

function updateLineNumbers() {
  if (!lineNumbersEl || !textarea) return;
  const content = textarea.value;
  const lines = content.split('\n');
  lineNumbersEl.innerHTML = lines.map((_, i) => `<div class="line">${i + 1}</div>`).join('');
  lineNumbersEl.scrollTop = textarea.scrollTop;
}

function updatePreview() {
  if (!previewEl) return;
  const { editorContent } = store.getState();
  renderMarkdownPreview(editorContent || '');
}

function updateStatusbar() {
  if (!textarea) return;
  const { line, col, words, chars, readingTime } = getEditorStats();
  document.getElementById('lineNum').textContent = line;
  document.getElementById('colNum').textContent = col;
  document.getElementById('wordCount').textContent = words;
  document.getElementById('charCount').textContent = chars;
  document.getElementById('readTime').textContent = readingTime;
}

function getEditorStats() {
  if (!textarea) return { line: 1, col: 1, words: 0, chars: 0, readingTime: 1 };
  const content = textarea.value;
  const cursorPos = textarea.selectionStart;
  const pos = getLineCol(content, cursorPos);
  const { countWords, countChars, readingTime } = await import('./utils.js');
  return {
    line: pos.line,
    col: pos.col,
    words: countWords(content),
    chars: countChars(content),
    readingTime: readingTime(content)
  };
}

function applyZoom() {
  const { zoomLevel } = store.getState();
  const scale = zoomLevel / 100;
  const editorWrapper = document.getElementById('editorWrapper');
  if (editorWrapper) {
    editorWrapper.style.fontSize = `${zoomLevel}%`;
  }
  if (previewEl) {
    previewEl.style.fontSize = `${zoomLevel}%`;
  }
  document.getElementById('zoomLevel').textContent = `${zoomLevel}%`;
}

/* ==========================================================================
   Split resize
   ========================================================================== */

function startSplitResize(e) {
  e.preventDefault();
  isResizingSplit = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  
  const writeMode = document.getElementById('writeMode');
  const previewMode = document.getElementById('previewMode');
  const startX = e.clientX || e.touches?.[0]?.clientX;
  const startWriteWidth = writeMode.offsetWidth;
  
  function onMove(e) {
    if (!isResizingSplit) return;
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const delta = clientX - startX;
    const containerWidth = writeMode.parentElement.offsetWidth;
    const newWriteWidth = Math.max(200, Math.min(containerWidth - 200, startWriteWidth + delta));
    writeMode.style.flex = `0 0 ${newWriteWidth}px`;
    previewMode.style.flex = '1';
  }
  
  function onUp() {
    isResizingSplit = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
  }
  
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchmove', onMove, { passive: true });
  document.addEventListener('touchend', onUp);
}

/* ==========================================================================
   Mise à jour UI externe
   ========================================================================== */

export function updateEditorUI() {
  updateLineNumbers();
  updatePreview();
  updateStatusbar();
  applyZoom();
  applyWordWrap();
  updateModeButtons();
}