/* ==========================================================================
   My Note - DB (Wrapper IndexedDB pour notes, révisions, settings)
   ========================================================================== */

import { uuid, nowISO, SCHEMA_VERSION, deepClone } from './utils.js';

const DB_NAME = 'my-note-db';
const DB_VERSION = 2; // Incrémenter pour migrations

const STORES = {
  NOTES: 'notes',
  SETTINGS: 'settings',
  METADATA: 'metadata'
};

let dbInstance = null;

/**
 * Ouvre la connexion IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
export async function openDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Timeout de sécurité (5s) au cas où indexedDB bloquerait
    const timeout = setTimeout(() => {
      reject(new Error('IndexedDB timeout: ouverture trop lente ou bloquée'));
    }, 5000);

    request.onerror = () => {
      clearTimeout(timeout);
      const err = request.error;
      reject(new Error(`Impossible d'ouvrir IndexedDB: ${err?.name || 'UnknownError'} - ${err?.message || 'Pas de détails'}`));
    };
    request.onsuccess = () => {
      clearTimeout(timeout);
      dbInstance = request.result;
      dbInstance.onerror = (e) => console.error('[DB] Erreur:', e.target.error);
      resolve(dbInstance);
    };

    request.onblocked = () => {
      clearTimeout(timeout);
      reject(new Error('IndexedDB bloqué: une autre onglet/fenêtre a la base ouverte'));
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;

      // Store notes
      if (!db.objectStoreNames.contains(STORES.NOTES)) {
        const notesStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
        notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        notesStore.createIndex('createdAt', 'createdAt', { unique: false });
        notesStore.createIndex('pinned', 'pinned', { unique: false });
        notesStore.createIndex('archived', 'archived', { unique: false });
        notesStore.createIndex('deletedAt', 'deletedAt', { unique: false });
        notesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
      }

      // Store settings
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      // Store metadata (schema version, etc.)
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }

      // Migrations
      if (oldVersion < 2) {
        // v2: ajout index tags multiEntry (déjà fait ci-dessus)
        console.log('[DB] Migration vers v2: index tags');
      }
    };
  });
}

/**
 * Ferme la connexion
 */
export function closeDB() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Exécute une transaction
 * @param {string[]} storeNames
 * @param {'readonly'|'readwrite'} mode
 * @param {Function} callback
 * @returns {Promise<any>}
 */
async function transaction(storeNames, mode, callback) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    callback(tx);
  });
}

/**
 * Récupère un objet par clé
 * @param {string} storeName
 * @param {any} key
 * @returns {Promise<any>}
 */
export async function get(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Récupère tous les objets d'un store
 * @param {string} storeName
 * @returns {Promise<any[]>}
 */
export async function getAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Récupère via un index
 * @param {string} storeName
 * @param {string} indexName
 * @param {any} key
 * @returns {Promise<any[]>}
 */
export async function getByIndex(storeName, indexName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Met à jour ou insère un objet
 * @param {string} storeName
 * @param {object} value
 * @returns {Promise<any>}
 */
export async function put(storeName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Supprime un objet
 * @param {string} storeName
 * @param {any} key
 * @returns {Promise<void>}
 */
export async function del(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Vide un store
 * @param {string} storeName
 * @returns {Promise<void>}
 */
export async function clear(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/* ==========================================================================
   API Notes
   ========================================================================== */

/**
 * Crée une note par défaut
 * @param {Partial<Note>} overrides
 * @returns {Note}
 */
function createDefaultNote(overrides = {}) {
  const now = nowISO();
  return {
    id: uuid(),
    title: '',
    content: '',
    createdAt: now,
    updatedAt: now,
    pinned: false,
    archived: false,
    deletedAt: null,
    tags: [],
    color: null,
    locked: false,
    revisions: [],
    ...overrides
  };
}

/**
 * Extrait le titre de la première ligne non-vide
 * @param {string} content
 * @returns {string}
 */
export function extractTitle(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      // Retire les marqueurs markdown de titre
      return trimmed.replace(/^#+\s*/, '').slice(0, 80);
    }
  }
  return 'Sans titre';
}

/**
 * Met à jour le titre si vide
 * @param {Note} note
 * @returns {Note}
 */
function ensureTitle(note) {
  if (!note.title.trim() && note.content.trim()) {
    return { ...note, title: extractTitle(note.content) };
  }
  return note;
}

/**
 * Crée une nouvelle note
 * @param {Partial<Note>} data
 * @returns {Promise<Note>}
 */
export async function createNote(data = {}) {
  const note = createDefaultNote(data);
  note.title = note.title || extractTitle(note.content);
  await put(STORES.NOTES, note);
  return note;
}

/**
 * Récupère une note par ID
 * @param {string} id
 * @returns {Promise<Note|null>}
 */
export async function getNote(id) {
  return get(STORES.NOTES, id);
}

/**
 * Récupère toutes les notes (non supprimées)
 * @param {object} options
 * @returns {Promise<Note[]>}
 */
export async function getAllNotes(options = {}) {
  const { includeArchived = false, includeDeleted = false, includePinned = true } = options;
  let notes = await getAll(STORES.NOTES);
  
  notes = notes.filter(n => {
    if (!includeDeleted && n.deletedAt) return false;
    if (!includeArchived && n.archived) return false;
    return true;
  });
  
  // Tri : épinglées d'abord, puis par updatedAt desc
  notes.sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned ? -1 : 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
  
  return notes;
}

/**
 * Récupère les notes pour la sidebar (avec filtres)
 * @param {object} filters
 * @returns {Promise<Note[]>}
 */
export async function getNotesForSidebar(filters = {}) {
  const { search = '', tag = '', archived = false, trashed = false } = filters;
  let notes = await getAllNotes({ includeArchived: archived, includeDeleted: trashed });
  
  if (search) {
    const normalizedSearch = search.toLowerCase();
    notes = notes.filter(n => 
      n.title.toLowerCase().includes(normalizedSearch) ||
      n.content.toLowerCase().includes(normalizedSearch) ||
      n.tags.some(t => t.toLowerCase().includes(normalizedSearch))
    );
  }
  
  if (tag) {
    notes = notes.filter(n => n.tags.includes(tag));
  }
  
  return notes;
}

/**
 * Met à jour une note
 * @param {string} id
 * @param {Partial<Note>} updates
 * @returns {Promise<Note|null>}
 */
export async function updateNote(id, updates) {
  const note = await getNote(id);
  if (!note) return null;
  
  const updated = {
    ...note,
    ...updates,
    updatedAt: nowISO(),
    id: note.id // Préserve l'ID
  };
  
  // Met à jour le titre si contenu changé et titre vide
  if (updates.content !== undefined) {
    ensureTitle(updated);
  }
  
  await put(STORES.NOTES, updated);
  return updated;
}

/**
 * Sauvegarde complète d'une note (avec gestion révisions)
 * @param {string} id
 * @param {string} content
 * @param {string} title
 * @returns {Promise<Note|null>}
 */
export async function saveNoteContent(id, content, title) {
  const note = await getNote(id);
  if (!note) return null;
  
  const now = nowISO();
  const hasContentChanged = note.content !== content;
  const hasTitleChanged = note.title !== title;
  
  const updated = {
    ...note,
    content,
    title: title || note.title,
    updatedAt: now
  };
  
  ensureTitle(updated);
  
  // Gestion des révisions (snapshot toutes les 5min ou changement significatif)
  if (hasContentChanged) {
    updated.revisions = await createRevisionIfNeeded(note, content);
  }
  
  await put(STORES.NOTES, updated);
  return updated;
}

/**
 * Crée une révision si nécessaire
 * @param {Note} note
 * @param {string} newContent
 * @returns {Promise<Revision[]>}
 */
async function createRevisionIfNeeded(note, newContent) {
  const revisions = note.revisions || [];
  const lastRevision = revisions[revisions.length - 1];
  const now = Date.now();
  
  // Vérifie si on doit créer une révision
  const timeThreshold = 5 * 60 * 1000; // 5 minutes
  const diffThreshold = Math.max(100, note.content.length * 0.1); // 10% ou 100 chars
  
  const shouldCreate = !lastRevision ||
    (now - new Date(lastRevision.timestamp).getTime() > timeThreshold) ||
    (Math.abs(newContent.length - (lastRevision.content?.length || 0)) > diffThreshold);
  
  if (shouldCreate) {
    const revision = {
      timestamp: new Date().toISOString(),
      content: note.content,
      title: note.title
    };
    const updated = [...revisions, revision].slice(-30); // Max 30 révisions
    return updated;
  }
  
  return revisions;
}

/**
 * Supprime une note (soft delete)
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteNote(id) {
  const note = await getNote(id);
  if (!note) return false;
  
  await updateNote(id, { deletedAt: nowISO(), archived: false });
  return true;
}

/**
 * Restaure une note supprimée
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function restoreNote(id) {
  const note = await getNote(id);
  if (!note || !note.deletedAt) return false;
  
  await updateNote(id, { deletedAt: null });
  return true;
}

/**
 * Vide la corbeille (suppression définitive > 30 jours)
 * @returns {Promise<number>}
 */
export async function emptyTrash() {
  const notes = await getAll(STORES.NOTES);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  let count = 0;
  
  for (const note of notes) {
    if (note.deletedAt && note.deletedAt < thirtyDaysAgo) {
      await del(STORES.NOTES, note.id);
      count++;
    }
  }
  
  return count;
}

/**
 * Épingle/dépingle une note
 * @param {string} id
 * @param {boolean} pinned
 * @returns {Promise<Note|null>}
 */
export async function togglePin(id, pinned) {
  return updateNote(id, { pinned });
}

/**
 * Archive/désarchive une note
 * @param {string} id
 * @param {boolean} archived
 * @returns {Promise<Note|null>}
 */
export async function toggleArchive(id, archived) {
  return updateNote(id, { archived, pinned: archived ? false : undefined });
}

/**
 * Ajoute un tag
 * @param {string} id
 * @param {string} tag
 * @returns {Promise<Note|null>}
 */
export async function addTag(id, tag) {
  const note = await getNote(id);
  if (!note) return null;
  const normalized = tag.toLowerCase().replace(/^#/, '');
  if (!note.tags.includes(normalized)) {
    return updateNote(id, { tags: [...note.tags, normalized] });
  }
  return note;
}

/**
 * Retire un tag
 * @param {string} id
 * @param {string} tag
 * @returns {Promise<Note|null>}
 */
export async function removeTag(id, tag) {
  const note = await getNote(id);
  if (!note) return null;
  return updateNote(id, { tags: note.tags.filter(t => t !== tag) });
}

/**
 * Définit la couleur d'une note
 * @param {string} id
 * @param {string|null} color
 * @returns {Promise<Note|null>}
 */
export async function setNoteColor(id, color) {
  return updateNote(id, { color });
}

/**
 * Duplique une note
 * @param {string} id
 * @returns {Promise<Note|null>}
 */
export async function duplicateNote(id) {
  const note = await getNote(id);
  if (!note) return null;
  
  const newNote = createDefaultNote({
    title: note.title + ' (copie)',
    content: note.content,
    tags: [...note.tags],
    color: note.color
  });
  
  await put(STORES.NOTES, newNote);
  return newNote;
}

/**
 * Récupère tous les tags uniques
 * @returns {Promise<string[]>}
 */
export async function getAllTags() {
  const notes = await getAll(STORES.NOTES);
  const tags = new Set();
  for (const note of notes) {
    if (!note.deletedAt && !note.archived) {
      note.tags.forEach(t => tags.add(t));
    }
  }
  return Array.from(tags).sort();
}

/* ==========================================================================
   API Révisions
   ========================================================================== */

/**
 * Récupère l'historique des révisions d'une note
 * @param {string} id
 * @returns {Promise<Revision[]>}
 */
export async function getRevisions(id) {
  const note = await getNote(id);
  return note?.revisions || [];
}

/**
 * Restaure une révision
 * @param {string} id
 * @param {number} revisionIndex
 * @returns {Promise<Note|null>}
 */
export async function restoreRevision(id, revisionIndex) {
  const note = await getNote(id);
  if (!note || !note.revisions[revisionIndex]) return null;
  
  const revision = note.revisions[revisionIndex];
  return updateNote(id, {
    content: revision.content,
    title: revision.title,
    updatedAt: nowISO()
  });
}

/* ==========================================================================
   API Settings
   ========================================================================== */

const DEFAULT_SETTINGS = {
  theme: 'auto',           // 'dark' | 'light' | 'auto'
  fontFamily: 'serif',     // 'serif' | 'sans' | 'mono'
  fontSize: 16,
  lineHeight: 1.7,
  wordWrap: true,
  lineNumbers: false,
  statusBar: true,
  spellcheck: true,
  startup: 'resume',       // 'resume' | 'new'
  language: 'auto',        // 'fr' | 'en' | 'auto'
  pastePlain: false
};

/**
 * Récupère un setting
 * @param {string} key
 * @returns {Promise<any>}
 */
export async function getSetting(key) {
  const setting = await get(STORES.SETTINGS, key);
  return setting?.value ?? DEFAULT_SETTINGS[key];
}

/**
 * Récupère tous les settings
 * @returns {Promise<Settings>}
 */
export async function getAllSettings() {
  const settings = await getAll(STORES.SETTINGS);
  const result = { ...DEFAULT_SETTINGS };
  for (const s of settings) {
    result[s.key] = s.value;
  }
  return result;
}

/**
 * Définit un setting
 * @param {string} key
 * @param {any} value
 * @returns {Promise<void>}
 */
export async function setSetting(key, value) {
  await put(STORES.SETTINGS, { key, value });
}

/**
 * Définit plusieurs settings
 * @param {object} settings
 * @returns {Promise<void>}
 */
export async function setSettings(settings) {
  await transaction([STORES.SETTINGS], 'readwrite', (tx) => {
    const store = tx.objectStore(STORES.SETTINGS);
    for (const [key, value] of Object.entries(settings)) {
      store.put({ key, value });
    }
  });
}

/**
 * Réinitialise les settings
 * @returns {Promise<void>}
 */
export async function resetSettings() {
  await clear(STORES.SETTINGS);
  await setSettings(DEFAULT_SETTINGS);
}

/* ==========================================================================
   Export/Import complet
   ========================================================================== */

/**
 * Exporte toutes les données en JSON
 * @returns {Promise<string>}
 */
export async function exportAllData() {
  const notes = await getAll(STORES.NOTES);
  const settings = await getAll(STORES.SETTINGS);
  const metadata = await getAll(STORES.METADATA);
  
  const data = {
    version: SCHEMA_VERSION,
    exportedAt: nowISO(),
    notes,
    settings: Object.fromEntries(settings.map(s => [s.key, s.value])),
    metadata: Object.fromEntries(metadata.map(m => [m.key, m.value]))
  };
  
  return JSON.stringify(data, null, 2);
}

/**
 * Importe des données JSON
 * @param {string} json
 * @param {object} options
 * @returns {Promise<{notes: number, settings: number}>}
 */
export async function importData(json, options = {}) {
  const { merge = false, overwrite = false } = options;
  const data = JSON.parse(json);
  
  if (!data.notes || !Array.isArray(data.notes)) {
    throw new Error('Format JSON invalide: notes manquantes');
  }
  
  let notesCount = 0;
  let settingsCount = 0;
  
  await transaction([STORES.NOTES, STORES.SETTINGS], 'readwrite', async (tx) => {
    const notesStore = tx.objectStore(STORES.NOTES);
    const settingsStore = tx.objectStore(STORES.SETTINGS);
    
    // Import notes
    for (const note of data.notes) {
      const existing = await get(STORES.NOTES, note.id);
      if (!existing || overwrite || (merge && new Date(note.updatedAt) > new Date(existing.updatedAt))) {
        notesStore.put(note);
        notesCount++;
      }
    }
    
    // Import settings
    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        settingsStore.put({ key, value });
        settingsCount++;
      }
    }
  });
  
  return { notes: notesCount, settings: settingsCount };
}

/**
 * Importe des fichiers texte/markdown
 * @param {File[]} files
 * @returns {Promise<Note[]>}
 */
export async function importTextFiles(files) {
  const notes = [];
  
  for (const file of files) {
    const text = await file.text();
    const name = file.name.replace(/\.[^.]+$/, '');
    const note = await createNote({
      title: name,
      content: text,
      tags: []
    });
    notes.push(note);
  }
  
  return notes;
}

/**
 * Vérifie la disponibilité IndexedDB
 * @returns {Promise<boolean>}
 */
export async function checkIDBAvailable() {
  try {
    const db = await openDB();
    return !!db;
  } catch {
    return false;
  }
}

/**
 * Estime la taille de la base
 * @returns {Promise<number>}
 */
export async function estimateDBSize() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}

/**
 * Demande la persistance
 * @returns {Promise<boolean>}
 */
export async function requestPersistence() {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    return navigator.storage.persist();
  }
  return false;
}