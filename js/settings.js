/* ==========================================================================
   My Note - Settings (Panneau de réglages, persistance, thèmes)
   ========================================================================== */

import { store, openModal, closeModal, showToast, updateSettings, refreshNotesList, setZoomLevel } from './store.js';
import { getAllSettings, setSetting, setSettings, resetSettings } from './db.js';
import { t, initI18n, getLang, setLang, getAvailableLanguages, applyTranslations } from './i18n.js';
import { formatBytes } from './utils.js';

let settingsModal = null;

/* ==========================================================================
   Thèmes - Application immédiate sans flash
   ========================================================================== */

export function initTheme() {
  // Script anti-flash déjà dans index.html
  const savedTheme = localStorage.getItem('theme') || 'auto';
  applyTheme(savedTheme);
}

export function applyTheme(theme) {
  const root = document.documentElement;
  let actualTheme = theme;
  
  if (theme === 'auto') {
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  root.setAttribute('data-theme', actualTheme);
  localStorage.setItem('theme', theme);
  
  // Met à jour meta theme-color pour PWA
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.content = actualTheme === 'dark' ? '#0A0A0B' : '#FAF7F2';
  }
  
  // Dispatch event pour composants
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme, actualTheme } }));
}

/* ==========================================================================
   Rendu modal réglages
   ========================================================================== */

export function renderSettingsModal() {
  const { settings } = store.getState();
  const languages = getAvailableLanguages();
  
  return `
    <div class="modal-overlay" id="settingsModal" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
      <div class="modal" style="max-width: 560px; max-height: 85vh;">
        <div class="modal-header">
          <h3 class="modal-title" id="settingsTitle" data-i18n="settings">${t('settings')}</h3>
          <button class="modal-close" data-close="settingsModal" aria-label="${t('close')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="modal-body" style="padding: var(--space-4); max-height: 60vh; overflow-y: auto;">
          <div class="settings-section" style="margin-bottom: var(--space-6);">
            <h4 style="font-size: var(--font-size-sm); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-3);" data-i18n="appearance">${t('appearance')}</h4>
            
            <div class="setting-item" style="margin-bottom: var(--space-4);">
              <label style="display: block; font-size: var(--font-size-sm); font-weight: 500; margin-bottom: var(--space-2);" data-i18n="theme">${t('theme')}</label>
              <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
                ${['dark', 'light', 'auto'].map(th => `
                  <button class="btn btn-secondary theme-btn ${settings.theme === th ? 'active' : ''}" 
                          data-theme="${th}" style="flex: 1; min-width: 80px;">
                    <span data-i18n="${th}Theme">${t(th === 'dark' ? 'darkTheme' : th === 'light' ? 'lightTheme' : 'autoTheme')}</span>
                  </button>
                `).join('')}
              </div>
            </div>
            
            <div class="setting-item" style="margin-bottom: var(--space-4);">
              <label style="display: block; font-size: var(--font-size-sm); font-weight: 500; margin-bottom: var(--space-2);" data-i18n="language">${t('language')}</label>
              <select class="find-input" id="languageSelect" style="width: 100%;" aria-label="${t('language')}">
                ${languages.map(l => `<option value="${l.code}" ${settings.language === l.code ? 'selected' : ''}>${l.name}</option>`).join('')}
              </select>
            </div>
          </div>
          
          <div class="settings-section" style="margin-bottom: var(--space-6);">
            <h4 style="font-size: var(--font-size-sm); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-3);" data-i18n="editor">${t('editor')}</h4>
            
            <div class="setting-item" style="margin-bottom: var(--space-4);">
              <label style="display: block; font-size: var(--font-size-sm); font-weight: 500; margin-bottom: var(--space-2);" data-i18n="fontFamily">${t('fontFamily')}</label>
              <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
                ${['serif', 'sans', 'mono'].map(f => `
                  <button class="btn btn-secondary font-btn ${settings.fontFamily === f ? 'active' : ''}" 
                          data-font="${f}" style="flex: 1; min-width: 80px;">
                    <span data-i18n="${f === 'serif' ? 'serif' : f === 'sans' ? 'sansSerif' : 'monospace'}">${t(f === 'serif' ? 'serif' : f === 'sans' ? 'sansSerif' : 'monospace')}</span>
                  </button>
                `).join('')}
              </div>
            </div>
            
            <div class="setting-item" style="margin-bottom: var(--space-4);">
              <label style="display: block; font-size: var(--font-size-sm); font-weight: 500; margin-bottom: var(--space-2);">
                <span data-i18n="fontSize">${t('fontSize')}</span>
                <span id="fontSizeValue" style="color: var(--muted); font-weight: normal;">${settings.fontSize}px</span>
              </label>
              <input type="range" id="fontSizeRange" min="12" max="24" value="${settings.fontSize}" 
                     style="width: 100%; accent-color: var(--accent);" aria-label="${t('fontSize')}">
            </div>
            
            <div class="setting-item" style="margin-bottom: var(--space-4);">
              <label style="display: block; font-size: var(--font-size-sm); font-weight: 500; margin-bottom: var(--space-2);">
                <span data-i18n="lineHeight">${t('lineHeight')}</span>
                <span id="lineHeightValue" style="color: var(--muted); font-weight: normal;">${settings.lineHeight}</span>
              </label>
              <input type="range" id="lineHeightRange" min="1.2" max="2.5" step="0.1" value="${settings.lineHeight}" 
                     style="width: 100%; accent-color: var(--accent);" aria-label="${t('lineHeight')}">
            </div>
            
            <div class="setting-item" style="margin-bottom: var(--space-4);">
              <label class="checkbox-wrapper" style="cursor: pointer;">
                <input type="checkbox" id="wordWrapSetting" ${settings.wordWrap ? 'checked' : ''}>
                <span class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                <span class="checkbox-label" data-i18n="wordWrap">${t('wordWrap')}</span>
              </label>
            </div>
            
            <div class="setting-item" style="margin-bottom: var(--space-4);">
              <label class="checkbox-wrapper" style="cursor: pointer;">
                <input type="checkbox" id="lineNumbersSetting" ${settings.lineNumbers ? 'checked' : ''}>
                <span class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                <span class="checkbox-label" data-i18n="lineNumbers">${t('lineNumbers')}</span>
              </label>
            </div>
            
            <div class="setting-item" style="margin-bottom: var(--space-4);">
              <label class="checkbox-wrapper" style="cursor: pointer;">
                <input type="checkbox" id="spellcheckSetting" ${settings.spellcheck ? 'checked' : ''}>
                <span class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                <span class="checkbox-label" data-i18n="spellcheck">${t('spellcheck')}</span>
              </label>
            </div>
            
            <div class="setting-item" style="margin-bottom: var(--space-4);">
              <label class="checkbox-wrapper" style="cursor: pointer;">
                <input type="checkbox" id="pastePlainSetting" ${settings.pastePlain ? 'checked' : ''}>
                <span class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                <span class="checkbox-label" data-i18n="pastePlain">${t('pastePlain')}</span>
              </label>
            </div>
          </div>
          
          <div class="settings-section" style="margin-bottom: var(--space-6);">
            <h4 style="font-size: var(--font-size-sm); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-3);" data-i18n="general">${t('general')}</h4>
            
            <div class="setting-item" style="margin-bottom: var(--space-4);">
              <label style="display: block; font-size: var(--font-size-sm); font-weight: 500; margin-bottom: var(--space-2);" data-i18n="startup">${t('startup')}</label>
              <div style="display: flex; gap: var(--space-2);">
                <button class="btn btn-secondary ${settings.startup === 'resume' ? 'active' : ''}" data-startup="resume" style="flex: 1;" data-i18n="startupResume">${t('startupResume')}</button>
                <button class="btn btn-secondary ${settings.startup === 'new' ? 'active' : ''}" data-startup="new" style="flex: 1;" data-i18n="startupNew">${t('startupNew')}</button>
              </div>
            </div>
            
            <div class="setting-item" style="margin-bottom: var(--space-4);">
              <label class="checkbox-wrapper" style="cursor: pointer;">
                <input type="checkbox" id="statusBarSetting" ${settings.statusBar ? 'checked' : ''}>
                <span class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                <span class="checkbox-label" data-i18n="statusBar">${t('statusBar')}</span>
              </label>
            </div>
          </div>
          
          <div class="settings-section" style="margin-bottom: var(--space-6);">
            <h4 style="font-size: var(--font-size-sm); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-3);" data-i18n="data">${t('data')}</h4>
            
            <div style="display: flex; flex-direction: column; gap: var(--space-2);">
              <button class="btn btn-secondary" id="exportDataBtn" style="justify-content: flex-start;" data-i18n="backupJson">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <span>${t('backupJson')}</span>
              </button>
              <button class="btn btn-secondary" id="importDataBtn" style="justify-content: flex-start;" data-i18n="importJson">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <span>${t('importJson')}</span>
              </button>
              <button class="btn btn-danger" id="resetSettingsBtn" style="justify-content: flex-start;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rotate x1="12" y1="12" x2="12" y2="12"></rotate><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 8"></path><line x1="3" y1="3" x2="3.01" y2="3.01"></line></svg>
                <span data-i18n="resetSettings">${t('resetSettings')}</span>
              </button>
            </div>
            
            <div id="storageInfo" style="margin-top: var(--space-4); padding: var(--space-3); background: var(--surface-2); border-radius: var(--radius-md); font-size: var(--font-size-xs); color: var(--muted);">
              <div>${t('storageUsed')}: <span id="storageUsed">-</span></div>
              <div>${t('notesCount')}: <span id="notesCount">-</span></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="saveSettingsBtn" data-i18n="save">${t('save')}</button>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   Setup
   ========================================================================== */

export function setupSettings() {
  // Store subscription pour mise à jour info stockage
  store.subscribe(async (state) => {
    if (state.settings) {
      updateStorageInfo();
    }
  });
}

export async function openSettingsModal() {
  let modalContainer = document.getElementById('modalsContainer');
  if (modalContainer && !document.getElementById('settingsModal')) {
    modalContainer.insertAdjacentHTML('beforeend', renderSettingsModal());
  }
  
  settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  
  setupSettingsModal();
  updateStorageInfo();
}

function closeSettingsModal() {
  if (settingsModal) {
    settingsModal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function setupSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (!modal) return;
  
  // Thème buttons
  modal.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      modal.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyTheme(theme);
      updateSettings({ theme });
    });
  });
  
  // Font buttons
  modal.querySelectorAll('.font-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const font = btn.dataset.font;
      modal.querySelectorAll('.font-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateSettings({ fontFamily: font });
      applyFontFamily(font);
    });
  });
  
  // Font size
  const fontSizeRange = document.getElementById('fontSizeRange');
  const fontSizeValue = document.getElementById('fontSizeValue');
  fontSizeRange?.addEventListener('input', (e) => {
    const value = parseInt(e.target.value, 10);
    fontSizeValue.textContent = `${value}px`;
    applyFontSize(value);
  });
  fontSizeRange?.addEventListener('change', (e) => {
    updateSettings({ fontSize: parseInt(e.target.value, 10) });
  });
  
  // Line height
  const lineHeightRange = document.getElementById('lineHeightRange');
  const lineHeightValue = document.getElementById('lineHeightValue');
  lineHeightRange?.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    lineHeightValue.textContent = value.toFixed(1);
    applyLineHeight(value);
  });
  lineHeightRange?.addEventListener('change', (e) => {
    updateSettings({ lineHeight: parseFloat(e.target.value) });
  });
  
  // Checkboxes
  const checkboxes = [
    { id: 'wordWrapSetting', key: 'wordWrap', apply: applyWordWrap },
    { id: 'lineNumbersSetting', key: 'lineNumbers', apply: applyLineNumbers },
    { id: 'spellcheckSetting', key: 'spellcheck', apply: applySpellcheck },
    { id: 'pastePlainSetting', key: 'pastePlain', apply: () => {} },
    { id: 'statusBarSetting', key: 'statusBar', apply: applyStatusBar }
  ];
  
  checkboxes.forEach(({ id, key, apply }) => {
    const cb = document.getElementById(id);
    cb?.addEventListener('change', () => {
      updateSettings({ [key]: cb.checked });
      apply(cb.checked);
    });
  });
  
  // Language
  const languageSelect = document.getElementById('languageSelect');
  languageSelect?.addEventListener('change', (e) => {
    const lang = e.target.value;
    setLang(lang);
    updateSettings({ language: lang });
    applyTranslations();
    // Re-rend les modales ouvertes
    renderSettingsModal();
    setupSettingsModal();
  });
  
  // Startup
  modal.querySelectorAll('[data-startup]').forEach(btn => {
    btn.addEventListener('click', () => {
      const startup = btn.dataset.startup;
      modal.querySelectorAll('[data-startup]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateSettings({ startup });
    });
  });
  
  // Actions
  document.getElementById('exportDataBtn')?.addEventListener('click', async () => {
    closeSettingsModal();
    import('./export.js').then(m => m.openExportModal());
  });
  
  document.getElementById('importDataBtn')?.addEventListener('click', async () => {
    closeSettingsModal();
    import('./export.js').then(m => m.openImportModal());
  });
  
  document.getElementById('resetSettingsBtn')?.addEventListener('click', async () => {
    if (confirm(t('confirmResetSettings'))) {
      await resetSettings();
      const defaults = await getAllSettings();
      store.set({ settings: defaults });
      applyAllSettings(defaults);
      showToast(t('settingsReset'), 'success');
      closeSettingsModal();
      // Réouvre avec nouvelles valeurs
      setTimeout(openSettingsModal, 100);
    }
  });
  
  document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
    closeSettingsModal();
    showToast(t('settingsSaved'), 'success');
  });
  
  // Close handlers
  const closeHandler = (e) => {
    if (!modal.querySelector('.modal').contains(e.target)) {
      closeSettingsModal();
      document.removeEventListener('click', closeHandler);
    }
  };
  setTimeout(() => document.addEventListener('click', closeHandler), 0);
}

/* ==========================================================================
   Application des réglages
   ========================================================================== */

function applyAllSettings(settings) {
  applyTheme(settings.theme);
  applyFontFamily(settings.fontFamily);
  applyFontSize(settings.fontSize);
  applyLineHeight(settings.lineHeight);
  applyWordWrap(settings.wordWrap);
  applyLineNumbers(settings.lineNumbers);
  applySpellcheck(settings.spellcheck);
  applyStatusBar(settings.statusBar);
}

function applyFontFamily(font) {
  const root = document.documentElement;
  const fontMap = {
    serif: 'var(--font-serif)',
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)'
  };
  root.style.setProperty('--editor-font-family', fontMap[font] || fontMap.serif);
}

function applyFontSize(size) {
  document.documentElement.style.setProperty('--editor-font-size', `${size}px`);
  // Met à jour l'éditeur
  const textarea = document.getElementById('editorTextarea');
  if (textarea) textarea.style.fontSize = `${size}px`;
}

function applyLineHeight(height) {
  document.documentElement.style.setProperty('--editor-line-height', height);
  const textarea = document.getElementById('editorTextarea');
  if (textarea) textarea.style.lineHeight = height;
}

function applyWordWrap(enabled) {
  const textarea = document.getElementById('editorTextarea');
  if (textarea) textarea.style.whiteSpace = enabled ? 'pre-wrap' : 'pre';
}

function applyLineNumbers(enabled) {
  import('./store.js').then(m => m.store.set({ lineNumbers: enabled }));
  const lineNumbersEl = document.getElementById('lineNumbers');
  const wrapper = document.getElementById('editorWrapper');
  if (lineNumbersEl) lineNumbersEl.style.display = enabled ? 'block' : 'none';
  if (wrapper) wrapper.style.paddingLeft = enabled ? 'calc(var(--editor-padding-x) + 5ch)' : 'var(--editor-padding-x)';
}

function applySpellcheck(enabled) {
  const textarea = document.getElementById('editorTextarea');
  if (textarea) textarea.spellcheck = enabled;
}

function applyStatusBar(enabled) {
  const statusbar = document.getElementById('statusbar');
  if (statusbar) statusbar.style.display = enabled ? 'flex' : 'none';
}

/* ==========================================================================
   Info stockage
   ========================================================================== */

async function updateStorageInfo() {
  const { notes, settings } = store.getState();
  const { estimateDBSize } = await import('./db.js');
  
  const storageUsed = await estimateDBSize();
  const notesCount = notes.filter(n => !n.deletedAt).length;
  
  document.getElementById('storageUsed').textContent = formatBytes(storageUsed);
  document.getElementById('notesCount').textContent = notesCount;
}