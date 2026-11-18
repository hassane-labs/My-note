/* ==========================================================================
   My Note - Utils (Helpers purs, testables)
   ========================================================================== */

/**
 * Génère un UUID v4
 * @returns {string}
 */
export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Date ISO 8601 actuelle
 * @returns {string}
 */
export function nowISO() {
  return new Date().toISOString();
}

/**
 * Formate une date pour l'affichage
 * @param {string|Date} dateISO
 * @param {object} options
 * @returns {string}
 */
export function formatDate(dateISO, options = {}) {
  const date = typeof dateISO === 'string' ? new Date(dateISO) : dateISO;
  if (isNaN(date.getTime())) return '';
  
  const { relative = false, locale = 'fr-FR' } = options;
  
  if (relative) {
    const diff = Date.now() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'à l\'instant';
    if (minutes < 60) return `il y a ${minutes} min`;
    if (hours < 24) return `il y a ${hours} h`;
    if (days < 7) return `il y a ${days} j`;
  }
  
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Debounce function
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function
 * @param {Function} fn
 * @param {number} limit
 * @returns {Function}
 */
export function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Échappe le HTML pour insertion sûre
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

/**
 * Compte les mots dans un texte
 * @param {string} text
 * @returns {number}
 */
export function countWords(text) {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Compte les caractères (avec/sans espaces)
 * @param {string} text
 * @param {boolean} withSpaces
 * @returns {number}
 */
export function countChars(text, withSpaces = true) {
  return withSpaces ? text.length : text.replace(/\s/g, '').length;
}

/**
 * Estime le temps de lecture en minutes
 * @param {string} text
 * @param {number} wpm - mots par minute
 * @returns {number}
 */
export function readingTime(text, wpm = 200) {
  const words = countWords(text);
  return Math.max(1, Math.ceil(words / wpm));
}

/**
 * Formate un nombre avec séparateurs
 * @param {number} num
 * @param {string} locale
 * @returns {string}
 */
export function formatNumber(num, locale = 'fr-FR') {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Tronque une chaîne avec ellipsis
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Recherche floue simple (score 0-1)
 * @param {string} query
 * @param {string} target
 * @returns {number}
 */
export function fuzzyMatch(query, target) {
  if (!query) return 1;
  if (!target) return 0;
  
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  
  if (t.includes(q)) return 1;
  
  let ti = 0;
  for (const c of q) {
    ti = t.indexOf(c, ti);
    if (ti === -1) return 0;
    ti++;
  }
  return 0.5 + 0.5 * (q.length / t.length);
}

/**
 * Normalise une chaîne pour recherche (retire accents, lowercase)
 * @param {string} str
 * @returns {string}
 */
export function normalizeForSearch(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Extrait des extraits autour d'une correspondance
 * @param {string} text
 * @param {string} query
 * @param {number} radius - caractères avant/après
 * @returns {string[]}
 */
export function extractSnippets(text, query, radius = 60) {
  const normalized = normalizeForSearch(text);
  const q = normalizeForSearch(query);
  if (!q) return [];
  
  const snippets = [];
  let index = normalized.indexOf(q);
  
  while (index !== -1 && snippets.length < 5) {
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + q.length + radius);
    let snippet = text.slice(start, end);
    
    if (start > 0) snippet = '…' + snippet;
    if (end < text.length) snippet = snippet + '…';
    
    snippets.push(snippet);
    index = normalized.indexOf(q, index + 1);
  }
  
  return snippets;
}

/**
 * Surligne les correspondances dans un texte (retourne HTML)
 * @param {string} text
 * @param {string} query
 * @param {string} className
 * @returns {string}
 */
export function highlightMatches(text, query, className = 'search-highlight') {
  if (!query) return escapeHtml(text);
  
  const escaped = escapeHtml(text);
  const q = escapeHtml(query);
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  
  return escaped.replace(regex, `<mark class="${className}">$1</mark>`);
}

/**
 * Parse une ligne de position "Ln X, Col Y"
 * @param {string} text
 * @param {number} cursorPos
 * @returns {{line: number, col: number}}
 */
export function getLineCol(text, cursorPos) {
  const beforeCursor = text.slice(0, cursorPos);
  const lines = beforeCursor.split('\n');
  return {
    line: lines.length,
    col: lines[lines.length - 1].length + 1
  };
}

/**
 * Obtient la position curseur à partir de ligne/colonne
 * @param {string} text
 * @param {number} line
 * @param {number} col
 * @returns {number}
 */
export function getCursorPos(text, line, col) {
  const lines = text.split('\n');
  if (line > lines.length) line = lines.length;
  let pos = 0;
  for (let i = 0; i < line - 1; i++) {
    pos += lines[i].length + 1; // +1 pour \n
  }
  pos += Math.min(col - 1, lines[line - 1]?.length || 0);
  return Math.min(pos, text.length);
}

/**
 * Génère les numéros de ligne pour affichage
 * @param {string} text
 * @returns {string[]}
 */
export function generateLineNumbers(text) {
  const lines = text.split('\n');
  return lines.map((_, i) => String(i + 1));
}

/**
 * Indente/désindente une sélection
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @param {boolean} indent - true pour indenter, false pour désindenter
 * @returns {{text: string, start: number, end: number}}
 */
export function toggleIndent(text, start, end, indent = true) {
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);
  
  const lines = selected.split('\n');
  let newLines;
  
  if (indent) {
    newLines = lines.map(l => '\t' + l);
  } else {
    newLines = lines.map(l => l.startsWith('\t') ? l.slice(1) : l);
  }
  
  const newSelected = newLines.join('\n');
  const newStart = start;
  const newEnd = start + newSelected.length;
  
  return {
    text: before + newSelected + after,
    start: newStart,
    end: newEnd
  };
}

/**
 * Vérifie si une ligne est une tâche
 * @param {string} line
 * @returns {{isTask: boolean, checked: boolean, content: string}}
 */
export function parseTaskLine(line) {
  const match = line.match(/^(\s*)[-*+]\s+\[([ x])\]\s+(.*)$/);
  if (!match) return { isTask: false, checked: false, content: line };
  return {
    isTask: true,
    checked: match[2] === 'x',
    content: match[1] + '- [' + (match[2] === 'x' ? 'x' : ' ') + '] ' + match[3]
  };
}

/**
 * Toggle une ligne de tâche
 * @param {string} line
 * @returns {string}
 */
export function toggleTaskLine(line) {
  const { isTask, checked, content } = parseTaskLine(line);
  if (!isTask) return line;
  
  const indent = line.match(/^(\s*)/)[1];
  const newChecked = !checked;
  return `${indent}- [${newChecked ? 'x' : ' '}] ${content.slice(indent.length + 6)}`;
}

/**
 * Deep clone
 * @param {any} obj
 * @returns {any}
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Compare deux objets (shallow)
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
export function shallowEqual(a, b) {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(key => a[key] === b[key]);
}

/**
 * Attend un nombre de ms
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry une fonction avec backoff
 * @param {Function} fn
 * @param {number} retries
 * @param {number} baseDelay
 * @returns {Promise<any>}
 */
export async function retry(fn, retries = 3, baseDelay = 100) {
  try {
    return await fn();
  } catch (e) {
    if (retries <= 0) throw e;
    await sleep(baseDelay);
    return retry(fn, retries - 1, baseDelay * 2);
  }
}

/**
 * Formate une taille en octets
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Valide un email basique
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Génère un slug à partir d'une chaîne
 * @param {string} str
 * @returns {string}
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Copie dans le presse-papiers
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback pour navigateurs sans clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}

/**
 * Télécharge un fichier
 * @param {string} content
 * @param {string} filename
 * @param {string} mimeType
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse un fichier JSON de manière sûre
 * @param {string} json
 * @returns {any|null}
 */
export function safeParseJSON(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Version de schéma pour migrations
 */
export const SCHEMA_VERSION = 1;