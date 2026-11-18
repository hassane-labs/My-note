/* ==========================================================================
   My Note - Export/Import (Export .md/.txt/.html/PDF, sauvegarde JSON, import)
   ========================================================================== */

import { store, openModal, closeModal, showToast } from './store.js';
import { exportAllData, importData, importTextFiles } from './db.js';
import { t } from './i18n.js';
import { renderMarkdown } from './markdown.js';
import { formatDate } from './utils.js';

let exportModal = null;
let importModal = null;

/* ==========================================================================
   Rendu modales
   ========================================================================== */

export function renderExportImportModals() {
  return `
    <!-- Export Modal -->
    <div class="modal-overlay" id="exportModal" role="dialog" aria-modal="true" aria-labelledby="exportTitle">
      <div class="modal" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title" id="exportTitle" data-i18n="exportNote">${t('exportNote')}</h3>
          <button class="modal-close" data-close="exportModal" aria-label="${t('close')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="modal-body">
          <p style="font-size: var(--font-size-sm); color: var(--muted); margin-bottom: var(--space-4);" data-i18n="exportCurrentNote">${t('exportCurrentNote')}</p>
          
          <div style="display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-6);">
            <button class="btn btn-secondary export-btn" data-format="md" style="justify-content: flex-start;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>${t('exportMarkdown')}</span>
              <kbd class="command-item-shortcut">.md</kbd>
            </button>
            <button class="btn btn-secondary export-btn" data-format="txt" style="justify-content: flex-start;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>${t('exportText')}</span>
              <kbd class="command-item-shortcut">.txt</kbd>
            </button>
            <button class="btn btn-secondary export-btn" data-format="html" style="justify-content: flex-start;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>${t('exportHtml')}</span>
              <kbd class="command-item-shortcut">.html</kbd>
            </button>
            <button class="btn btn-secondary export-btn" data-format="pdf" style="justify-content: flex-start;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>${t('exportPdf')}</span>
              <kbd class="command-item-shortcut">Ctrl+P</kbd>
            </button>
          </div>
          
          <div class="divider" style="margin: var(--space-4) 0;"></div>
          
          <p style="font-size: var(--font-size-sm); color: var(--muted); margin-bottom: var(--space-4);" data-i18n="exportAllData">${t('exportAllData')}</p>
          <button class="btn btn-secondary export-btn" data-format="json" style="justify-content: flex-start; width: 100%;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            <span>${t('backupJson')}</span>
            <kbd class="command-item-shortcut">.json</kbd>
          </button>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div class="modal-overlay" id="importModal" role="dialog" aria-modal="true" aria-labelledby="importTitle">
      <div class="modal" style="max-width: 560px;">
        <div class="modal-header">
          <h3 class="modal-title" id="importTitle" data-i18n="import">${t('import')}</h3>
          <button class="modal-close" data-close="importModal" aria-label="${t('close')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="modal-body">
          <div class="import-tabs" style="display: flex; gap: var(--space-1); margin-bottom: var(--space-4); border-bottom: 1px solid var(--border);">
            <button class="import-tab active" data-tab="files" data-i18n="importFiles">${t('importFiles')}</button>
            <button class="import-tab" data-tab="json" data-i18n="importJson">${t('importJson')}</button>
          </div>
          
          <div class="import-panel" id="importFilesPanel">
            <div class="drop-zone" id="dropZone" style="border: 2px dashed var(--border); border-radius: var(--radius-md); padding: var(--space-8); text-align: center; cursor: pointer; transition: border-color var(--transition-fast), background var(--transition-fast);">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--muted); margin-bottom: var(--space-3);" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p style="color: var(--text); margin-bottom: var(--space-1);" data-i18n="dragDropFiles">${t('dragDropFiles')}</p>
              <p style="font-size: var(--font-size-sm); color: var(--muted);" data-i18n="orClick">${t('orClick')}</p>
              <input type="file" id="fileInput" multiple accept=".md,.txt,.html,.json" style="display: none;">
            </div>
            <div id="importFilesList" style="margin-top: var(--space-4); max-height: 30vh; overflow-y: auto;"></div>
          </div>
          
          <div class="import-panel" id="importJsonPanel" style="display: none;">
            <div class="input-wrapper" style="margin-bottom: var(--space-3);">
              <textarea class="find-input" id="jsonInput" rows="10" placeholder="${t('pasteJsonHere')}" data-i18n-placeholder="pasteJsonHere" style="font-family: var(--font-mono); font-size: var(--font-size-xs); resize: vertical;"></textarea>
            </div>
            <div style="display: flex; gap: var(--space-2);">
              <label class="checkbox-wrapper">
                <input type="checkbox" id="importMerge" checked>
                <span class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                <span class="checkbox-label" data-i18n="mergeNotes">${t('mergeNotes')}</span>
              </label>
              <label class="checkbox-wrapper">
                <input type="checkbox" id="importOverwrite">
                <span class="checkbox-box"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                <span class="checkbox-label" data-i18n="overwriteNewer">${t('overwriteNewer')}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="importCancelBtn" data-i18n="cancel">${t('cancel')}</button>
          <button class="btn btn-primary" id="importConfirmBtn" data-i18n="import">${t('import')}</button>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   Export actions
   ========================================================================== */

export function openExportModal() {
  // Injecte le modal s'il n'existe pas
  let modalContainer = document.getElementById('modalsContainer');
  if (modalContainer && !document.getElementById('exportModal')) {
    modalContainer.insertAdjacentHTML('beforeend', renderExportImportModals());
  }
  
  exportModal = document.getElementById('exportModal');
  if (exportModal) {
    exportModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  
  setupExportModal();
}

function closeExportModal() {
  if (exportModal) {
    exportModal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function setupExportModal() {
  const modal = document.getElementById('exportModal');
  if (!modal) return;
  
  // Boutons d'export
  modal.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format;
      exportCurrentNote(format);
      closeExportModal();
    });
  });
  
  // Ferme au clic extérieur
  const closeHandler = (e) => {
    if (!modal.querySelector('.modal').contains(e.target)) {
      closeExportModal();
      document.removeEventListener('click', closeHandler);
    }
  };
  setTimeout(() => document.addEventListener('click', closeHandler), 0);
  
  // Escape
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeExportModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function exportCurrentNote(format) {
  const { activeTabId, editorContent, editorTitle, tabs } = store.getState();
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  
  const content = editorContent || '';
  const title = editorTitle || tab.title || 'note';
  const safeTitle = title.replace(/[<>:"/\\|?*]/g, '_').slice(0, 100);
  const timestamp = formatDate(new Date(), { relative: false }).replace(/[/,:]/g, '-');
  
  switch (format) {
    case 'md':
      downloadFile(content, `${safeTitle}.md`, 'text/markdown');
      break;
    case 'txt':
      downloadFile(content, `${safeTitle}.txt`, 'text/plain');
      break;
    case 'html':
      exportAsHtml(content, title, safeTitle);
      break;
    case 'pdf':
      window.print();
      break;
    case 'json':
      exportFullBackup();
      break;
  }
  
  showToast(`${t('exportedAs')} ${format.toUpperCase()}`, 'success');
}

function exportAsHtml(content, title, filename) {
  const htmlContent = renderMarkdown(content);
  const fullHtml = `<!DOCTYPE html>
<html lang="${store.getState().settings.language || 'fr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 72ch; margin: 2rem auto; padding: 0 1rem; line-height: 1.7; color: #1a1a1a; }
    h1, h2, h3, h4, h5, h6 { font-family: Georgia, serif; color: #1a1a1a; }
    code { background: #f5f5f5; padding: 0.15em 0.4em; border-radius: 3px; font-family: monospace; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 3px solid #e11d2e; padding-left: 1rem; color: #666; font-style: italic; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    th { background: #f5f5f5; }
    .task-list-item { list-style: none; display: flex; align-items: flex-start; gap: 0.5rem; }
    @media print { body { margin: 0; padding: 1rem; } }
  </style>
</head>
<body>
  <article>${htmlContent}</article>
</body></html>`;
  
  downloadFile(fullHtml, `${filename}.html`, 'text/html');
}

function exportFullBackup() {
  exportAllData().then(json => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    downloadFile(json, `my-note-backup-${timestamp}.json`, 'application/json');
  }).catch(e => {
    console.error('[Export] Erreur:', e);
    showToast(t('errorExport'), 'error');
  });
}

function downloadFile(content, filename, mimeType) {
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

/* ==========================================================================
   Import actions
   ========================================================================== */

export function openImportModal() {
  let modalContainer = document.getElementById('modalsContainer');
  if (modalContainer && !document.getElementById('importModal')) {
    modalContainer.insertAdjacentHTML('beforeend', renderExportImportModals());
  }
  
  importModal = document.getElementById('importModal');
  if (importModal) {
    importModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  
  setupImportModal();
}

function closeImportModal() {
  if (importModal) {
    importModal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function setupImportModal() {
  const modal = document.getElementById('importModal');
  if (!modal) return;
  
  // Tabs
  modal.querySelectorAll('.import-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      modal.querySelectorAll('.import-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const tabName = tab.dataset.tab;
      document.getElementById('importFilesPanel').style.display = tabName === 'files' ? 'block' : 'none';
      document.getElementById('importJsonPanel').style.display = tabName === 'json' ? 'block' : 'none';
    });
  });
  
  // Drop zone
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  
  dropZone?.addEventListener('click', () => fileInput?.click());
  dropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent)';
    dropZone.style.background = 'var(--accent-soft)';
  });
  dropZone?.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border)';
    dropZone.style.background = '';
  });
  dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border)';
    dropZone.style.background = '';
    handleFiles(e.dataTransfer.files);
  });
  
  fileInput?.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = '';
  });
  
  // JSON import
  const jsonInput = document.getElementById('jsonInput');
  const importMerge = document.getElementById('importMerge');
  const importOverwrite = document.getElementById('importOverwrite');
  const confirmBtn = document.getElementById('importConfirmBtn');
  const cancelBtn = document.getElementById('importCancelBtn');
  
  confirmBtn?.addEventListener('click', async () => {
    const activeTab = modal.querySelector('.import-tab.active')?.dataset.tab;
    
    if (activeTab === 'json') {
      const json = jsonInput?.value;
      if (!json?.trim()) {
        showToast(t('jsonEmpty'), 'error');
        return;
      }
      
      try {
        confirmBtn.disabled = true;
        confirmBtn.textContent = t('importing');
        
        const result = await importData(json, {
          merge: importMerge?.checked,
          overwrite: importOverwrite?.checked
        });
        
        showToast(`${t('importedNotes')}: ${result.notes}, ${t('importedSettings')}: ${result.settings}`, 'success');
        closeImportModal();
        
        // Rafraîchit la liste
        import('./store.js').then(m => m.refreshNotesList());
      } catch (e) {
        console.error('[Import] Erreur:', e);
        showToast(t('errorImport'), 'error');
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = t('import');
      }
    } else {
      // Files already handled in handleFiles
      closeImportModal();
    }
  });
  
  cancelBtn?.addEventListener('click', closeImportModal);
  
  // Escape
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeImportModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function handleFiles(files) {
  const fileList = document.getElementById('importFilesList');
  if (!fileList) return;
  
  const validFiles = Array.from(files).filter(f => 
    ['.md', '.txt', '.html', '.json'].some(ext => f.name.endsWith(ext))
  );
  
  if (!validFiles.length) {
    showToast(t('noValidFiles'), 'warning');
    return;
  }
  
  fileList.innerHTML = validFiles.map(f => `
    <div style="display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2); background: var(--surface-2); border-radius: var(--radius-sm); margin-bottom: var(--space-1);">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
      <span style="flex: 1; font-size: var(--font-size-sm);">${escapeHtml(f.name)}</span>
      <span style="font-size: var(--font-size-xs); color: var(--muted);">${formatBytes(f.size)}</span>
    </div>
  `).join('');
  
  // Import immédiat pour les fichiers texte
  importTextFiles(validFiles).then(notes => {
    showToast(`${notes.length} ${t('notesImported')}`, 'success');
    import('./store.js').then(m => m.refreshNotesList());
  }).catch(e => {
    console.error('[Import] Erreur fichiers:', e);
    showToast(t('errorImport'), 'error');
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}