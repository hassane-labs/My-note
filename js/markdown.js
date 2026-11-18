/* ==========================================================================
   My Note - Markdown (Rendu Markdown avec marked + DOMPurify)
   ========================================================================== */

import { store } from './store.js';
import { t } from './i18n.js';

// marked et DOMPurify sont chargés via script tags dans index.html
// window.marked et window.DOMPurify

/* ==========================================================================
   Configuration marked
   ========================================================================== */

function configureMarked() {
  if (!window.marked) return;
  
  window.marked.setOptions({
    breaks: true,           // GFM line breaks
    gfm: true,              // GitHub Flavored Markdown
    headerIds: true,        // IDs sur les titres
    mangle: false,          // Ne pas échapper les emails
    sanitize: false,        // On utilise DOMPurify après
    smartLists: true,       // Listes intelligentes
    smartypants: false,     // Pas de typographie "smart"
    xhtml: false
  });
  
  // Renderer personnalisé pour les tâches
  const renderer = new window.marked.Renderer();
  
  const originalListItem = renderer.listitem.bind(renderer);
  renderer.listitem = function(text, task, checked) {
    if (task) {
      const checkedAttr = checked ? ' checked' : '';
      const disabled = ' disabled'; // Lecture seule dans l'aperçu
      return `<li class="task-list-item"><input type="checkbox"${checkedAttr}${disabled}><label>${text}</label></li>`;
    }
    return originalListItem(text, task, checked);
  };
  
  window.marked.use({ renderer });
}

/* ==========================================================================
   Configuration DOMPurify
   ========================================================================== */

function configureDOMPurify() {
  if (!window.DOMPurify) return;
  
  // Configuration stricte
  window.DOMPurify.setConfig({
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote',
      'ul', 'ol', 'li',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'dl', 'dt', 'dd',
      'div', 'span',
      'input', 'label',  // Pour task lists
      'mark'             // Pour surlignage recherche
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'target', 'rel',
      'class', 'id', 'style',
      'checked', 'disabled', 'type',  // Pour task lists
      'data-*'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button', 'select', 'option', 'textarea'],
    FORBID_ATTR: ['on*', 'onerror', 'onload', 'onclick', 'onmouseover', 'style'],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false
  });
  
  // Hook pour ajouter target="_blank" rel="noopener" aux liens externes
  window.DOMPurify.addHook('uponSanitizeElement', (node, config) => {
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      const href = node.getAttribute('href');
      if (href.startsWith('http') || href.startsWith('//')) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
    if (node.tagName === 'INPUT' && node.getAttribute('type') === 'checkbox') {
      // Autorise les checkboxes pour task lists
      node.setAttribute('disabled', '');
    }
  });
}

/* ==========================================================================
   Rendu Markdown
   ========================================================================== */

let isConfigured = false;

function ensureConfigured() {
  if (!isConfigured) {
    configureMarked();
    configureDOMPurify();
    isConfigured = true;
  }
}

/**
 * Rendu Markdown vers HTML sanitisé
 * @param {string} markdown
 * @returns {string}
 */
export function renderMarkdown(markdown) {
  ensureConfigured();
  
  if (!markdown || !markdown.trim()) {
    return `<p class="empty-preview" style="color: var(--muted); font-style: italic; text-align: center; padding: var(--space-8);">${t('emptyStateTitle')}</p>`;
  }
  
  try {
    // marked parse
    const html = window.marked.parse(markdown, { async: false });
    
    // DOMPurify sanitize
    const cleanHtml = window.DOMPurify.sanitize(html);
    
    return cleanHtml;
  } catch (e) {
    console.error('[Markdown] Erreur rendu:', e);
    return `<p style="color: var(--error); padding: var(--space-4);">${t('errorRendering')}</p>`;
  }
}

/**
 * Rendu et injection dans l'élément preview
 * @param {string} markdown
 */
export function renderMarkdownPreview(markdown) {
  const previewEl = document.getElementById('markdownPreview');
  if (!previewEl) return;
  
  const html = renderMarkdown(markdown);
  previewEl.innerHTML = html;
  
  // Ajoute les event listeners sur les checkboxes (lecture seule dans preview)
  previewEl.querySelectorAll('.task-list-item input[type="checkbox"]').forEach(cb => {
    cb.disabled = true;
  });
  
  // Met en surbrillance les correspondances de recherche si actif
  highlightSearchMatches(previewEl);
}

/**
 * Surligne les correspondances de recherche dans l'aperçu
 * @param {HTMLElement} container
 */
function highlightSearchMatches(container) {
  const { findQuery, findOptions } = store.getState();
  if (!findQuery) return;
  
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    if (node.parentElement.closest('pre, code, script, style')) continue;
    textNodes.push(node);
  }
  
  let flags = 'g';
  if (!findOptions.caseSensitive) flags += 'i';
  
  let pattern = findQuery;
  if (!findOptions.regex) {
    pattern = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  if (findOptions.wholeWord) {
    pattern = '\\b' + pattern + '\\b';
  }
  
  try {
    const regex = new RegExp(pattern, flags);
    
    for (const textNode of textNodes) {
      const text = textNode.textContent;
      if (regex.test(text)) {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          // Texte avant le match
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
          }
          // Le match surligné
          const mark = document.createElement('mark');
          mark.className = 'search-highlight';
          mark.textContent = match[0];
          fragment.appendChild(mark);
          lastIndex = match.index + match[0].length;
          
          if (!flags.includes('g')) break;
        }
        
        // Texte après le dernier match
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        
        textNode.parentNode.replaceChild(fragment, textNode);
      }
    }
  } catch (e) {
    // Regex invalide, ignore
  }
}

/* ==========================================================================
   Export pour utilisation dans d'autres modules
   ========================================================================== */

export { renderMarkdown as default };