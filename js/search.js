/* ==========================================================================
   My Note - Search (Recherche globale plein texte)
   ========================================================================== */

import { store, globalSearch, loadNote, setSearchQuery, refreshNotesList, showToast } from './store.js';
import { getAllNotes } from './db.js';
import { t } from './i18n.js';
import { normalizeForSearch, extractSnippets, highlightMatches } from './utils.js';

let searchModal = null;
let searchInput = null;
let searchResults = null;
let searchIndex = new Map(); // word -> Set<noteId>

/* ==========================================================================
   Index inversé simple
   ========================================================================== */

export function buildSearchIndex(notes) {
  searchIndex.clear();
  
  for (const note of notes) {
    if (note.deletedAt) continue;
    
    const text = `${note.title} ${note.content} ${note.tags.join(' ')}`;
    const words = normalizeForSearch(text).split(/\s+/).filter(w => w.length > 1);
    
    for (const word of words) {
      if (!searchIndex.has(word)) {
        searchIndex.set(word, new Set());
      }
      searchIndex.get(word).add(note.id);
    }
  }
  
  console.log(`[Search] Index built: ${searchIndex.size} unique words`);
}

export function searchNotes(query, limit = 50) {
  if (!query.trim()) return [];
  
  const words = normalizeForSearch(query).split(/\s+/).filter(w => w.length > 1);
  if (!words.length) return [];
  
  // Intersection des ensembles de notes
  let candidateIds = null;
  
  for (const word of words) {
    // Recherche préfixe
    let matchingIds = new Set();
    for (const [indexedWord, ids] of searchIndex) {
      if (indexedWord.startsWith(word)) {
        for (const id of ids) matchingIds.add(id);
      }
    }
    
    if (matchingIds.size === 0) return [];
    
    if (candidateIds === null) {
      candidateIds = matchingIds;
    } else {
      candidateIds = new Set([...candidateIds].filter(id => matchingIds.has(id)));
    }
    
    if (candidateIds.size === 0) return [];
  }
  
  // Récupère les notes candidates
  const { notes } = store.getState();
  const candidates = notes.filter(n => candidateIds.has(n.id));
  
  // Score et extraits
  const results = candidates.map(note => {
    let score = 0;
    const normalizedTitle = normalizeForSearch(note.title);
    const normalizedContent = normalizeForSearch(note.content);
    const normalizedTags = note.tags.map(t => normalizeForSearch(t)).join(' ');
    
    for (const word of words) {
      if (normalizedTitle.includes(word)) score += 10;
      if (normalizedContent.includes(word)) score += 5;
      if (normalizedTags.includes(word)) score += 3;
      // Bonus pour correspondance exacte
      if (normalizedTitle === word) score += 20;
    }
    
    // Extraits surlignés
    const snippets = extractSnippets(note.content, query, 80);
    const highlightedSnippets = snippets.map(s => highlightMatches(s, query));
    
    return { note, score, snippets: highlightedSnippets };
  })
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit);
  
  return results;
}

/* ==========================================================================
   Rendu modal recherche globale
   ========================================================================== */

export function renderGlobalSearchModal() {
  // Sera injecté dans le container modals
  return `
    <div class="modal-overlay" id="globalSearchModal" role="dialog" aria-modal="true" aria-labelledby="globalSearchTitle">
      <div class="modal" style="max-width: 720px;">
        <div class="modal-header">
          <h3 class="modal-title" id="globalSearchTitle" data-i18n="globalSearch">${t('globalSearch')}</h3>
          <button class="modal-close" data-close="globalSearchModal" aria-label="${t('close')}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="padding: var(--space-4);">
          <div class="search-input-wrapper" style="margin-bottom: var(--space-4);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="left: var(--space-3);">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="search" class="search-input" id="globalSearchInput" 
                   placeholder="${t('searchAllNotes')}" 
                   aria-label="${t('searchAllNotes')}"
                   data-i18n-placeholder="searchAllNotes"
                   style="padding-left: 44px; font-size: var(--font-size-base);">
          </div>
          <div id="globalSearchResults" class="global-search-results" style="max-height: 50vh; overflow-y: auto;"></div>
        </div>
        <div class="modal-footer">
          <span id="globalSearchCount" style="font-size: var(--font-size-sm); color: var(--muted);"></span>
        </div>
      </div>
    </div>
  `;
}

function renderSearchResults(results, query) {
  const container = document.getElementById('globalSearchResults');
  const countEl = document.getElementById('globalSearchCount');
  if (!container) return;
  
  if (results.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: var(--space-8);">
        <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <p class="empty-state-text">${t('noResults')}</p>
      </div>
    `;
    if (countEl) countEl.textContent = '';
    return;
  }
  
  container.innerHTML = results.map((result, index) => {
    const { note, snippets } = result;
    const isActive = store.getState().activeNoteId === note.id;
    
    return `
      <div class="global-search-result ${isActive ? 'active' : ''}" 
           data-note-id="${note.id}"
           tabindex="0"
           role="option"
           aria-selected="${isActive}"
           style="padding: var(--space-3); border-radius: var(--radius-md); margin-bottom: var(--space-2); cursor: pointer; transition: background var(--transition-fast);"
           onmouseover="this.style.background='var(--surface-2)'"
           onmouseout="this.style.background=''"
      >
        <div style="display: flex; align-items: flex-start; gap: var(--space-3);">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1);">
              <span style="font-weight: 500; color: var(--text);">${escapeHtml(note.title || t('untitled'))}</span>
              ${note.pinned ? `<span class="badge" style="font-size: var(--font-size-xs);">${t('pinned')}</span>` : ''}
              ${note.archived ? `<span class="badge" style="font-size: var(--font-size-xs);">${t('archived')}</span>` : ''}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--muted); margin-bottom: var(--space-2);">
              ${formatDate(note.updatedAt, { relative: true })}
              ${note.tags.length ? ` · ${note.tags.map(t => `#${t}`).join(' ')}` : ''}
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              ${snippets.map(s => `<div style="font-size: var(--font-size-sm); color: var(--text-dim); line-height: 1.5;">${s}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  if (countEl) {
    countEl.textContent = `${results.length} ${t('matches')}`;
  }
  
  // Event listeners sur résultats
  container.querySelectorAll('.global-search-result').forEach(el => {
    el.addEventListener('click', () => {
      const noteId = el.dataset.noteId;
      loadNote(noteId);
      closeGlobalSearch();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const noteId = el.dataset.noteId;
        loadNote(noteId);
        closeGlobalSearch();
      }
    });
  });
}

/* ==========================================================================
   Setup
   ========================================================================== */

export function setupGlobalSearch() {
  // Store subscription pour reconstruire l'index
  store.subscribe((state, prevState) => {
    if (state.notes !== prevState.notes) {
      buildSearchIndex(state.notes);
    }
  });
}

export function openGlobalSearch() {
  const { modals } = store.getState();
  if (modals.globalSearch?.open) return;
  
  // Injecte le modal s'il n'existe pas
  let modalContainer = document.getElementById('modalsContainer');
  if (modalContainer && !document.getElementById('globalSearchModal')) {
    modalContainer.insertAdjacentHTML('beforeend', renderGlobalSearchModal());
  }
  
  searchModal = document.getElementById('globalSearchModal');
  searchInput = document.getElementById('globalSearchInput');
  searchResults = document.getElementById('globalSearchResults');
  
  if (searchModal) {
    searchModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => searchInput?.focus(), 50);
  }
  
  store.set({ globalSearchOpen: true });
}

export function closeGlobalSearch() {
  if (searchModal) {
    searchModal.classList.remove('open');
    document.body.style.overflow = '';
  }
  store.set({ globalSearchOpen: false, globalSearchQuery: '', globalSearchResults: [] });
  if (searchInput) searchInput.value = '';
}

export function handleGlobalSearchInput(query) {
  const { globalSearchResults } = store.getState();
  store.set({ globalSearchQuery: query });
  
  const results = searchNotes(query);
  store.set({ globalSearchResults: results });
  renderSearchResults(results, query);
}

/* ==========================================================================
   Helpers
   ========================================================================== */

function escapeHtml(str) {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}