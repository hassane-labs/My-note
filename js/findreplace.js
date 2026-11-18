/* ==========================================================================
   My Note - Find/Replace (Recherche/remplacement dans l'éditeur)
   ========================================================================== */

import { store, doFind, gotoMatch, replaceCurrent, replaceAll, setFindOptions, openModal, closeModal } from './store.js';
import { t } from './i18n.js';

let findModal = null;
let replaceModal = null;
let gotoLineModal = null;

/* ==========================================================================
   Rendu modales
   ========================================================================== */

export function renderFindReplaceModals() {
  return `
    <!-- Find Modal -->
    <div class="modal-overlay" id="findModal" role="dialog" aria-modal="true" aria-labelledby="findTitle">
      <div class="modal" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title" id="findTitle" data-i18n="findInNote">${t('findInNote')}</h3>
          <button class="modal-close" data-close="findModal" aria-label="${t('close')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="modal-body">
          <div class="input-wrapper" style="margin-bottom: var(--space-3);">
            <input type="text" class="find-input" id="findInput" placeholder="${t('findPlaceholder')}" data-i18n-placeholder="findPlaceholder" aria-label="${t('find')}" autocomplete="off" spellcheck="false">
          </div>
          <div class="find-options" style="display: flex; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-3); font-size: var(--font-size-sm);">
            <label class="checkbox-wrapper" style="cursor: pointer;">
              <input type="checkbox" id="findCaseSensitive" data-option="caseSensitive">
              <span class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
              <span class="checkbox-label" data-i18n="caseSensitive">${t('caseSensitive')}</span>
            </label>
            <label class="checkbox-wrapper" style="cursor: pointer;">
              <input type="checkbox" id="findWholeWord" data-option="wholeWord">
              <span class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
              <span class="checkbox-label" data-i18n="wholeWord">${t('wholeWord')}</span>
            </label>
            <label class="checkbox-wrapper" style="cursor: pointer;">
              <input type="checkbox" id="findRegex" data-option="regex">
              <span class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
              <span class="checkbox-label" data-i18n="regex">${t('regex')}</span>
            </label>
            <label class="checkbox-wrapper" style="cursor: pointer;">
              <input type="checkbox" id="findWrapAround" data-option="wrapAround" checked>
              <span class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
              <span class="checkbox-label" data-i18n="wrapAround">${t('wrapAround')}</span>
            </label>
          </div>
          <div class="find-info" id="findInfo" style="font-size: var(--font-size-xs); color: var(--muted); margin-bottom: var(--space-3);"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="findPrevBtn" data-i18n="findPrev">${t('findPrev')}</button>
          <button class="btn btn-secondary" id="findNextBtn" data-i18n="findNext">${t('findNext')}</button>
          <button class="btn btn-primary" id="openReplaceBtn" data-i18n="replace">${t('replace')}</button>
        </div>
      </div>
    </div>

    <!-- Replace Modal -->
    <div class="modal-overlay" id="replaceModal" role="dialog" aria-modal="true" aria-labelledby="replaceTitle">
      <div class="modal" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title" id="replaceTitle" data-i18n="replaceInNote">${t('replaceInNote')}</h3>
          <button class="modal-close" data-close="replaceModal" aria-label="${t('close')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="modal-body">
          <div class="input-wrapper" style="margin-bottom: var(--space-3);">
            <input type="text" class="find-input" id="replaceFindInput" placeholder="${t('findPlaceholder')}" data-i18n-placeholder="findPlaceholder" aria-label="${t('find')}" autocomplete="off" spellcheck="false">
          </div>
          <div class="input-wrapper" style="margin-bottom: var(--space-3);">
            <input type="text" class="find-input" id="replaceInput" placeholder="${t('replacePlaceholder')}" data-i18n-placeholder="replacePlaceholder" aria-label="${t('replace')}" autocomplete="off" spellcheck="false">
          </div>
          <div class="find-options" style="display: flex; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-3); font-size: var(--font-size-sm);">
            <label class="checkbox-wrapper" style="cursor: pointer;">
              <input type="checkbox" id="replaceCaseSensitive" data-option="caseSensitive">
              <span class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
              <span class="checkbox-label" data-i18n="caseSensitive">${t('caseSensitive')}</span>
            </label>
            <label class="checkbox-wrapper" style="cursor: pointer;">
              <input type="checkbox" id="replaceWholeWord" data-option="wholeWord">
              <span class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
              <span class="checkbox-label" data-i18n="wholeWord">${t('wholeWord')}</span>
            </label>
            <label class="checkbox-wrapper" style="cursor: pointer;">
              <input type="checkbox" id="replaceRegex" data-option="regex">
              <span class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
              <span class="checkbox-label" data-i18n="regex">${t('regex')}</span>
            </label>
            <label class="checkbox-wrapper" style="cursor: pointer;">
              <input type="checkbox" id="replaceWrapAround" data-option="wrapAround" checked>
              <span class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
              <span class="checkbox-label" data-i18n="wrapAround">${t('wrapAround')}</span>
            </label>
          </div>
          <div class="find-info" id="replaceInfo" style="font-size: var(--font-size-xs); color: var(--muted); margin-bottom: var(--space-3);"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="replacePrevBtn" data-i18n="findPrev">${t('findPrev')}</button>
          <button class="btn btn-secondary" id="replaceNextBtn" data-i18n="findNext">${t('findNext')}</button>
          <button class="btn btn-secondary" id="replaceOneBtn" data-i18n="replace">${t('replace')}</button>
          <button class="btn btn-primary" id="replaceAllBtn" data-i18n="replaceAll">${t('replaceAll')}</button>
        </div>
      </div>
    </div>

    <!-- Goto Line Modal -->
    <div class="modal-overlay" id="gotoLineModal" role="dialog" aria-modal="true" aria-labelledby="gotoLineTitle">
      <div class="modal" style="max-width: 360px;">
        <div class="modal-header">
          <h3 class="modal-title" id="gotoLineTitle" data-i18n="gotoLine">${t('gotoLine')}</h3>
          <button class="modal-close" data-close="gotoLineModal" aria-label="${t('close')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="modal-body">
          <div class="input-wrapper">
            <input type="number" class="find-input" id="gotoLineInput" placeholder="${t('lineNumber')}" data-i18n-placeholder="lineNumber" aria-label="${t('lineNumber')}" min="1" autocomplete="off">
          </div>
          <p id="gotoLineMax" style="font-size: var(--font-size-sm); color: var(--muted); margin-top: var(--space-2);"></p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-close="gotoLineModal" data-i18n="cancel">${t('cancel')}</button>
          <button class="btn btn-primary" id="gotoLineGoBtn" data-i18n="go">${t('go')}</button>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   Setup
   ========================================================================== */

export function setupFindReplace() {
  // Find Modal
  setupFindModal();
  setupReplaceModal();
  setupGotoLineModal();
  
  // Store subscription pour mise à jour compteur
  store.subscribe((state, prevState) => {
    if (state.findMatches !== prevState.findMatches || state.currentMatchIndex !== prevState.currentMatchIndex) {
      updateFindInfo('findInfo');
      updateFindInfo('replaceInfo');
    }
    if (state.findOptions !== prevState.findOptions) {
      syncFindOptions();
    }
  });
}

function setupFindModal() {
  const modal = document.getElementById('findModal');
  if (!modal) return;
  
  const input = document.getElementById('findInput');
  const prevBtn = document.getElementById('findPrevBtn');
  const nextBtn = document.getElementById('findNextBtn');
  const openReplaceBtn = document.getElementById('openReplaceBtn');
  const optionInputs = modal.querySelectorAll('[data-option]');
  
  input?.addEventListener('input', debounce((e) => {
    doFind(e.target.value);
  }, 150));
  
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) gotoMatch(-1);
      else gotoMatch(1);
    } else if (e.key === 'Escape') {
      closeModal('find');
    }
  });
  
  prevBtn?.addEventListener('click', () => gotoMatch(-1));
  nextBtn?.addEventListener('click', () => gotoMatch(1));
  
  openReplaceBtn?.addEventListener('click', () => {
    closeModal('find');
    openModal('replace');
    // Copie la query
    const findInput = document.getElementById('replaceFindInput');
    if (findInput && input) findInput.value = input.value;
    doFind(input.value);
  });
  
  optionInputs.forEach(cb => {
    cb.addEventListener('change', () => {
      const options = {};
      optionInputs.forEach(i => options[i.dataset.option] = i.checked);
      setFindOptions(options);
    });
  });
  
  // Focus input à l'ouverture
  const observer = new MutationObserver(() => {
    if (modal.classList.contains('open')) {
      input?.focus();
      input?.select();
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
}

function setupReplaceModal() {
  const modal = document.getElementById('replaceModal');
  if (!modal) return;
  
  const findInput = document.getElementById('replaceFindInput');
  const replaceInput = document.getElementById('replaceInput');
  const prevBtn = document.getElementById('replacePrevBtn');
  const nextBtn = document.getElementById('replaceNextBtn');
  const replaceOneBtn = document.getElementById('replaceOneBtn');
  const replaceAllBtn = document.getElementById('replaceAllBtn');
  const optionInputs = modal.querySelectorAll('[data-option]');
  
  findInput?.addEventListener('input', debounce((e) => {
    doFind(e.target.value);
  }, 150));
  
  findInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) gotoMatch(-1);
      else gotoMatch(1);
    } else if (e.key === 'Escape') {
      closeModal('replace');
    }
  });
  
  replaceInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      replaceCurrent(replaceInput.value);
    } else if (e.key === 'Escape') {
      closeModal('replace');
    }
  });
  
  prevBtn?.addEventListener('click', () => gotoMatch(-1));
  nextBtn?.addEventListener('click', () => gotoMatch(1));
  replaceOneBtn?.addEventListener('click', () => replaceCurrent(replaceInput?.value || ''));
  replaceAllBtn?.addEventListener('click', () => {
    const count = replaceAll(replaceInput?.value || '');
    import('./store.js').then(m => m.showToast(`${count} ${t('replacementsMade')}`, 'success'));
  });
  
  optionInputs.forEach(cb => {
    cb.addEventListener('change', () => {
      const options = {};
      optionInputs.forEach(i => options[i.dataset.option] = i.checked);
      setFindOptions(options);
    });
  });
  
  const observer = new MutationObserver(() => {
    if (modal.classList.contains('open')) {
      findInput?.focus();
      findInput?.select();
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
}

function setupGotoLineModal() {
  const modal = document.getElementById('gotoLineModal');
  if (!modal) return;
  
  const input = document.getElementById('gotoLineInput');
  const maxEl = document.getElementById('gotoLineMax');
  const goBtn = document.getElementById('gotoLineGoBtn');
  
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') goToLine();
    else if (e.key === 'Escape') closeModal('gotoLine');
  });
  
  goBtn?.addEventListener('click', goToLine);
  
  const observer = new MutationObserver(() => {
    if (modal.classList.contains('open')) {
      const { editorContent } = store.getState();
      const maxLine = editorContent.split('\n').length;
      if (maxEl) maxEl.textContent = `${t('line')} 1 - ${maxLine}`;
      input?.focus();
      input?.select();
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
}

function goToLine() {
  const input = document.getElementById('gotoLineInput');
  const line = parseInt(input?.value, 10);
  if (!line || line < 1) return;
  
  const { editorContent } = store.getState();
  const maxLine = editorContent.split('\n').length;
  if (line > maxLine) return;
  
  const { getCursorPos } = await import('./utils.js');
  const pos = getCursorPos(editorContent, line, 1);
  
  const textarea = document.getElementById('editorTextarea');
  if (textarea) {
    textarea.selectionStart = textarea.selectionEnd = pos;
    textarea.focus();
    // Scroll vers la ligne
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 24;
    textarea.scrollTop = (line - 1) * lineHeight - textarea.clientHeight / 2;
  }
  
  closeModal('gotoLine');
}

function updateFindInfo(infoId) {
  const el = document.getElementById(infoId);
  if (!el) return;
  
  const { findMatches, currentMatchIndex } = store.getState();
  if (findMatches.length === 0) {
    el.textContent = t('noMatches');
  } else {
    el.textContent = `${currentMatchIndex + 1} / ${findMatches.length} ${t('matches')}`;
  }
}

function syncFindOptions() {
  const { findOptions } = store.getState();
  document.querySelectorAll('[data-option]').forEach(cb => {
    cb.checked = findOptions[cb.dataset.option] ?? false;
  });
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}