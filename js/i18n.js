/* ==========================================================================
   My Note - I18n (Internationalisation FR/EN)
   ========================================================================== */

const translations = {
  fr: {
    // Général
    appName: 'My Note',
    newNote: 'Nouvelle note',
    untitled: 'Sans titre',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    saved: 'Enregistré ✓',
    error: 'Erreur',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    duplicate: 'Dupliquer',
    rename: 'Renommer',
    pin: 'Épingler',
    unpin: 'Désépingler',
    archive: 'Archiver',
    unarchive: 'Désarchiver',
    trash: 'Corbeille',
    restore: 'Restaurer',
    emptyTrash: 'Vider la corbeille',
    permanentlyDelete: 'Supprimer définitivement',
    close: 'Fermer',
    open: 'Ouvrir',
    settings: 'Réglages',
    shortcuts: 'Raccourcis',
    help: 'Aide',
    about: 'À propos',
    language: 'Langue',
    theme: 'Thème',
    
    // Barre de statut
    line: 'Ligne',
    col: 'Col',
    words: 'Mots',
    chars: 'Caractères',
    readingTime: 'Temps de lecture',
    zoom: 'Zoom',
    encoding: 'Encodage',
    statusSaved: 'Enregistré',
    statusPending: 'Non enregistré',
    statusSaving: 'Enregistrement...',
    
    // Onglets
    closeTab: 'Fermer l\'onglet',
    newTab: 'Nouvel onglet',
    nextTab: 'Onglet suivant',
    prevTab: 'Onglet précédent',
    unsavedChanges: 'Modifications non enregistrées',
    
    // Éditeur
    writeMode: 'Écrire',
    previewMode: 'Aperçu',
    splitMode: 'Côte à côte',
    focusMode: 'Mode Focus',
    wordWrap: 'Retour à la ligne',
    lineNumbers: 'Numéros de ligne',
    spellcheck: 'Correction orthographique',
    fontFamily: 'Police',
    fontSize: 'Taille',
    lineHeight: 'Interligne',
    serif: 'Serif',
    sansSerif: 'Sans-serif',
    monospace: 'Monospace',
    
    // Recherche
    find: 'Rechercher',
    replace: 'Remplacer',
    findInNote: 'Rechercher dans la note',
    replaceInNote: 'Remplacer dans la note',
    globalSearch: 'Recherche globale',
    caseSensitive: 'Respecter la casse',
    wholeWord: 'Mot entier',
    regex: 'Expressions régulières',
    wrapAround: 'Boucler',
    findNext: 'Suivant',
    findPrev: 'Précédent',
    replaceAll: 'Tout remplacer',
    matches: 'correspondance(s)',
    noMatches: 'Aucune correspondance',
    
    // Palette de commandes
    commandPalette: 'Palette de commandes',
    typeCommand: 'Tapez une commande ou recherchez...',
    noCommands: 'Aucune commande trouvée',
    
    // Markdown
    bold: 'Gras',
    italic: 'Italique',
    link: 'Lien',
    code: 'Code',
    codeBlock: 'Bloc de code',
    heading1: 'Titre 1',
    heading2: 'Titre 2',
    heading3: 'Titre 3',
    quote: 'Citation',
    bulletList: 'Liste à puces',
    numberList: 'Liste numérotée',
    taskList: 'Liste de tâches',
    horizontalRule: 'Ligne horizontale',
    insertDate: 'Insérer date/heure',
    
    // Tâches
    taskCount: '{{done}}/{{total}} tâches',
    checkTask: 'Cocher/Décocher',
    
    // Tags
    tags: 'Tags',
    addTag: 'Ajouter un tag',
    filterByTag: 'Filtrer par tag',
    noTags: 'Aucun tag',
    
    // Révisions
    revisions: 'Historique',
    revision: 'Révision',
    restoreRevision: 'Restaurer cette version',
    currentVersion: 'Version actuelle',
    noRevisions: 'Aucun historique',
    compareWithCurrent: 'Comparer avec l\'actuelle',
    
    // Export/Import
    export: 'Exporter',
    import: 'Importer',
    exportNote: 'Exporter la note',
    exportAll: 'Exporter tout (JSON)',
    importFiles: 'Importer des fichiers',
    importJson: 'Importer JSON',
    exportMarkdown: 'Markdown (.md)',
    exportText: 'Texte (.txt)',
    exportHtml: 'HTML (.html)',
    exportPdf: 'PDF (via impression)',
    backupJson: 'Sauvegarde complète (.json)',
    dragDropFiles: 'Glissez-déposez des fichiers .md, .txt, .html ou .json ici',
    orClick: 'ou cliquez pour sélectionner',
    
    // Partage
    share: 'Partager',
    copyMarkdown: 'Copier en Markdown',
    copyText: 'Copier en texte brut',
    shareNative: 'Partager (système)',
    noServer: 'Pas de serveur : pas de lien public. Vos notes restent sur votre appareil.',
    
    // Thèmes
    darkTheme: 'Sombre',
    lightTheme: 'Clair',
    autoTheme: 'Auto (système)',
    
    // Démarrage
    startupResume: 'Reprendre la session',
    startupNew: 'Nouvelle note',
    
    // Coller
    pastePlain: 'Toujours coller en texte brut',
    pastePlainShortcut: 'Ctrl+Maj+V pour coller en texte brut',
    
    // État vide
    emptyStateTitle: 'Écris quelque chose.',
    emptyStateHint: 'Ctrl+K pour ouvrir la palette · Alt+N pour nouvelle note',
    
    // Confirmations
    confirmDeleteNote: 'Supprimer cette note ? Elle ira dans la corbeille (récupérable 30 jours).',
    confirmDeletePermanent: 'Supprimer définitivement ? Cette action est irréversible.',
    confirmClearTrash: 'Vider la corbeille ? {{count}} note(s) de plus de 30 jours seront effacées.',
    confirmDiscardChanges: 'Vous avez des modifications non enregistrées. Voulez-vous vraiment fermer ?',
    
    // Erreurs
    errorLoadDB: 'Impossible d\'ouvrir la base de données. Le mode privé ou le stockage plein peuvent en être la cause.',
    errorSave: 'Erreur lors de la sauvegarde. Essayez d\'exporter vos notes.',
    errorImport: 'Erreur lors de l\'importation. Format de fichier invalide.',
    errorExport: 'Erreur lors de l\'exportation.',
    errorShare: 'Le partage n\'est pas disponible sur ce navigateur.',
    errorNotification: 'Les notifications ne sont pas autorisées.',
    errorLock: 'Le verrouillage nécessite un navigateur compatible (Web Crypto API).',
    
    // Verrouillage (Phase 3)
    lockNote: 'Verrouiller la note',
    unlockNote: 'Déverrouiller la note',
    setPassword: 'Définir un mot de passe',
    enterPassword: 'Entrez le mot de passe',
    confirmPassword: 'Confirmez le mot de passe',
    passwordMismatch: 'Les mots de passe ne correspondent pas',
    passwordTooShort: 'Le mot de passe doit faire au moins 8 caractères',
    wrongPassword: 'Mot de passe incorrect',
    locked: 'Verrouillé',
    unlocked: 'Déverrouillé',
    warningPasswordLoss: '⚠️ ATTENTION : Si vous oubliez ce mot de passe, la note sera IRRÉCUPÉRABLE. Il n\'y a AUCUNE récupération possible.',
    
    // Notifications (Phase 3)
    setReminder: 'Définir un rappel',
    reminderTime: 'Heure du rappel',
    reminderSet: 'Rappel programmé',
    notificationLimitation: 'Note : Les notifications ne fonctionnent que si l\'application est ouverte ou installée.',
    
    // Couleurs (Phase 3)
    noteColor: 'Couleur de la note',
    noColor: 'Aucune',
    viewGrid: 'Vue grille',
    viewList: 'Vue liste',
    
    // Raccourcis (affichage aide)
    shortcutsTitle: 'Raccourcis clavier',
    shortcutNewNote: 'Nouvelle note',
    shortcutNewTab: 'Nouvel onglet',
    shortcutCloseTab: 'Fermer l\'onglet',
    shortcutNextTab: 'Onglet suivant',
    shortcutPrevTab: 'Onglet précédent',
    shortcutCommandPalette: 'Palette de commandes',
    shortcutFind: 'Rechercher',
    shortcutReplace: 'Remplacer',
    shortcutFindNext: 'Suivant',
    shortcutFindPrev: 'Précédent',
    shortcutGotoLine: 'Aller à la ligne',
    shortcutGlobalSearch: 'Recherche globale',
    shortcutPrint: 'Imprimer / PDF',
    shortcutBold: 'Gras',
    shortcutItalic: 'Italique',
    shortcutLink: 'Lien',
    shortcutCheckTask: 'Cocher tâche',
    shortcutInsertDate: 'Insérer date/heure',
    shortcutPastePlain: 'Coller texte brut',
    shortcutFocusMode: 'Mode Focus',
    shortcutZoomIn: 'Zoom +',
    shortcutZoomOut: 'Zoom -',
    shortcutZoomReset: 'Zoom 100%',
    shortcutHelp: 'Afficher l\'aide'
  },
  
  en: {
    // General
    appName: 'My Note',
    newNote: 'New note',
    untitled: 'Untitled',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved ✓',
    error: 'Error',
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    duplicate: 'Duplicate',
    rename: 'Rename',
    pin: 'Pin',
    unpin: 'Unpin',
    archive: 'Archive',
    unarchive: 'Unarchive',
    trash: 'Trash',
    restore: 'Restore',
    emptyTrash: 'Empty trash',
    permanentlyDelete: 'Delete permanently',
    close: 'Close',
    open: 'Open',
    settings: 'Settings',
    shortcuts: 'Shortcuts',
    help: 'Help',
    about: 'About',
    language: 'Language',
    theme: 'Theme',
    
    // Status bar
    line: 'Ln',
    col: 'Col',
    words: 'Words',
    chars: 'Chars',
    readingTime: 'Read time',
    zoom: 'Zoom',
    encoding: 'Encoding',
    statusSaved: 'Saved',
    statusPending: 'Unsaved',
    statusSaving: 'Saving...',
    
    // Tabs
    closeTab: 'Close tab',
    newTab: 'New tab',
    nextTab: 'Next tab',
    prevTab: 'Previous tab',
    unsavedChanges: 'Unsaved changes',
    
    // Editor
    writeMode: 'Write',
    previewMode: 'Preview',
    splitMode: 'Split view',
    focusMode: 'Focus mode',
    wordWrap: 'Word wrap',
    lineNumbers: 'Line numbers',
    spellcheck: 'Spell check',
    fontFamily: 'Font',
    fontSize: 'Size',
    lineHeight: 'Line height',
    serif: 'Serif',
    sansSerif: 'Sans-serif',
    monospace: 'Monospace',
    
    // Search
    find: 'Find',
    replace: 'Replace',
    findInNote: 'Find in note',
    replaceInNote: 'Replace in note',
    globalSearch: 'Global search',
    caseSensitive: 'Match case',
    wholeWord: 'Whole word',
    regex: 'Regex',
    wrapAround: 'Wrap around',
    findNext: 'Next',
    findPrev: 'Previous',
    replaceAll: 'Replace all',
    matches: 'match(es)',
    noMatches: 'No matches',
    
    // Command palette
    commandPalette: 'Command palette',
    typeCommand: 'Type a command or search...',
    noCommands: 'No commands found',
    
    // Markdown
    bold: 'Bold',
    italic: 'Italic',
    link: 'Link',
    code: 'Code',
    codeBlock: 'Code block',
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    quote: 'Quote',
    bulletList: 'Bullet list',
    numberList: 'Numbered list',
    taskList: 'Task list',
    horizontalRule: 'Horizontal rule',
    insertDate: 'Insert date/time',
    
    // Tasks
    taskCount: '{{done}}/{{total}} tasks',
    checkTask: 'Check/Uncheck',
    
    // Tags
    tags: 'Tags',
    addTag: 'Add tag',
    filterByTag: 'Filter by tag',
    noTags: 'No tags',
    
    // Revisions
    revisions: 'History',
    revision: 'Revision',
    restoreRevision: 'Restore this version',
    currentVersion: 'Current version',
    noRevisions: 'No history',
    compareWithCurrent: 'Compare with current',
    
    // Export/Import
    export: 'Export',
    import: 'Import',
    exportNote: 'Export note',
    exportAll: 'Export all (JSON)',
    importFiles: 'Import files',
    importJson: 'Import JSON',
    exportMarkdown: 'Markdown (.md)',
    exportText: 'Text (.txt)',
    exportHtml: 'HTML (.html)',
    exportPdf: 'PDF (via print)',
    backupJson: 'Full backup (.json)',
    dragDropFiles: 'Drag & drop .md, .txt, .html or .json files here',
    orClick: 'or click to select',
    
    // Share
    share: 'Share',
    copyMarkdown: 'Copy as Markdown',
    copyText: 'Copy as plain text',
    shareNative: 'Share (system)',
    noServer: 'No server: no public link. Your notes stay on your device.',
    
    // Themes
    darkTheme: 'Dark',
    lightTheme: 'Light',
    autoTheme: 'Auto (system)',
    
    // Startup
    startupResume: 'Resume session',
    startupNew: 'New note',
    
    // Paste
    pastePlain: 'Always paste as plain text',
    pastePlainShortcut: 'Ctrl+Shift+V to paste as plain text',
    
    // Empty state
    emptyStateTitle: 'Write something.',
    emptyStateHint: 'Ctrl+K for palette · Alt+N for new note',
    
    // Confirmations
    confirmDeleteNote: 'Delete this note? It will go to trash (recoverable for 30 days).',
    confirmDeletePermanent: 'Delete permanently? This action cannot be undone.',
    confirmClearTrash: 'Empty trash? {{count}} note(s) older than 30 days will be erased.',
    confirmDiscardChanges: 'You have unsaved changes. Are you sure you want to close?',
    
    // Errors
    errorLoadDB: 'Unable to open database. Private mode or full storage may be the cause.',
    errorSave: 'Save error. Try exporting your notes.',
    errorImport: 'Import error. Invalid file format.',
    errorExport: 'Export error.',
    errorShare: 'Sharing not available on this browser.',
    errorNotification: 'Notifications not permitted.',
    errorLock: 'Locking requires a compatible browser (Web Crypto API).',
    
    // Lock (Phase 3)
    lockNote: 'Lock note',
    unlockNote: 'Unlock note',
    setPassword: 'Set password',
    enterPassword: 'Enter password',
    confirmPassword: 'Confirm password',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 8 characters',
    wrongPassword: 'Wrong password',
    locked: 'Locked',
    unlocked: 'Unlocked',
    warningPasswordLoss: '⚠️ WARNING: If you forget this password, the note will be IRRECOVERABLE. There is NO recovery possible.',
    
    // Notifications (Phase 3)
    setReminder: 'Set reminder',
    reminderTime: 'Reminder time',
    reminderSet: 'Reminder set',
    notificationLimitation: 'Note: Notifications only work if the app is open or installed.',
    
    // Colors (Phase 3)
    noteColor: 'Note color',
    noColor: 'None',
    viewGrid: 'Grid view',
    viewList: 'List view',
    
    // Shortcuts (help)
    shortcutsTitle: 'Keyboard shortcuts',
    shortcutNewNote: 'New note',
    shortcutNewTab: 'New tab',
    shortcutCloseTab: 'Close tab',
    shortcutNextTab: 'Next tab',
    shortcutPrevTab: 'Previous tab',
    shortcutCommandPalette: 'Command palette',
    shortcutFind: 'Find',
    shortcutReplace: 'Replace',
    shortcutFindNext: 'Next match',
    shortcutFindPrev: 'Previous match',
    shortcutGotoLine: 'Go to line',
    shortcutGlobalSearch: 'Global search',
    shortcutPrint: 'Print / PDF',
    shortcutBold: 'Bold',
    shortcutItalic: 'Italic',
    shortcutLink: 'Link',
    shortcutCheckTask: 'Check task',
    shortcutInsertDate: 'Insert date/time',
    shortcutPastePlain: 'Paste as plain text',
    shortcutFocusMode: 'Focus mode',
    shortcutZoomIn: 'Zoom in',
    shortcutZoomOut: 'Zoom out',
    shortcutZoomReset: 'Reset zoom',
    shortcutHelp: 'Show help'
  }
};

let currentLang = 'fr';
let listeners = new Set();

/**
 * Obtient la langue actuelle
 * @returns {string}
 */
export function getLang() {
  return currentLang;
}

/**
 * Définit la langue
 * @param {string} lang
 */
export function setLang(lang) {
  if (!translations[lang]) lang = 'fr';
  currentLang = lang;
  document.documentElement.lang = lang;
  // Notifie les listeners
  for (const listener of listeners) {
    listener(lang);
  }
}

/**
 * Détecte la langue du navigateur
 * @returns {string}
 */
export function detectLanguage() {
  const navLang = navigator.language || navigator.userLanguage || 'fr';
  if (navLang.startsWith('fr')) return 'fr';
  if (navLang.startsWith('en')) return 'en';
  return 'fr';
}

/**
 * Initialise l'i18n
 * @param {string} savedLang
 */
export function initI18n(savedLang) {
  const lang = savedLang || detectLanguage();
  setLang(lang);
  return lang;
}

/**
 * Traduit une clé
 * @param {string} key
 * @param {object} params - paramètres pour interpolation {{key}}
 * @returns {string}
 */
export function t(key, params = {}) {
  const dict = translations[currentLang] || translations.fr;
  let text = dict[key] || key;
  
  // Interpolation simple {{key}}
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
  }
  
  return text;
}

/**
 * S'abonne aux changements de langue
 * @param {Function} listener
 * @returns {Function} unsubscribe
 */
export function onLangChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Traduit tout un objet de clés
 * @param {object} obj
 * @returns {object}
 */
export function tObj(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = typeof value === 'string' ? t(value) : value;
  }
  return result;
}

/**
 * Applique les traductions aux éléments avec data-i18n
 * @param {HTMLElement} root
 */
export function applyTranslations(root = document) {
  const elements = root.querySelectorAll('[data-i18n]');
  for (const el of elements) {
    const key = el.dataset.i18n;
    const params = el.dataset.i18nParams ? JSON.parse(el.dataset.i18nParams) : {};
    const text = t(key, params);
    
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (el.placeholder !== text) el.placeholder = text;
    } else if (el.dataset.i18nAttr) {
      el.setAttribute(el.dataset.i18nAttr, text);
    } else {
      el.textContent = text;
    }
  }
  
  // Titles
  const titleElements = root.querySelectorAll('[data-i18n-title]');
  for (const el of titleElements) {
    const key = el.dataset.i18nTitle;
    el.title = t(key);
  }
}

/**
 * Liste des langues disponibles
 * @returns {{code: string, name: string}[]}
 */
export function getAvailableLanguages() {
  return [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' }
  ];
}