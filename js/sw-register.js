/* ==========================================================================
   My Note - SW Register (Enregistrement Service Worker)
   ========================================================================== */

export function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Worker non supporté');
    return;
  }
  
  // Enregistre le SW
  navigator.serviceWorker.register('./sw.js', { scope: './' })
    .then(registration => {
      console.log('[SW] Enregistré:', registration.scope);
      
      // Gestion mise à jour
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nouvelle version disponible
            showUpdateAvailable();
          }
        });
      });
    })
    .catch(error => {
      console.error('[SW] Erreur enregistrement:', error);
    });
  
  // Écoute les messages du SW
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
      // Le SW demande à prendre le contrôle
      window.location.reload();
    }
  });
  
  // Vérifie les mises à jour périodiquement
  setInterval(() => {
    navigator.serviceWorker.ready.then(reg => reg.update());
  }, 60 * 60 * 1000); // 1 heure
}

function showUpdateAvailable() {
  // Crée une notification discrète
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    animation: slide-up 0.3s ease-out;
  `;
  toast.innerHTML = `
    <span style="font-size: var(--font-size-sm);">Nouvelle version disponible</span>
    <button class="btn btn-primary btn-sm" onclick="window.location.reload()">Actualiser</button>
    <button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">Plus tard</button>
  `;
  
  document.body.appendChild(toast);
  
  // Auto-remove après 30s
  setTimeout(() => toast.remove(), 30000);
}

/* ==========================================================================
   Installation PWA
   ========================================================================== */

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Affiche un bouton d'installation si pas déjà installé
  if (!window.matchMedia('(display-mode: standalone)').matches) {
    showInstallButton();
  }
});

function showInstallButton() {
  // Vérifie si déjà affiché récemment
  if (localStorage.getItem('installPromptShown')) return;
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    animation: slide-up 0.3s ease-out;
  `;
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
    <span style="font-size: var(--font-size-sm); flex: 1;">Installer My Note</span>
    <button class="btn btn-primary btn-sm" onclick="installApp()">Installer</button>
    <button class="btn btn-ghost btn-sm" onclick="dismissInstall()">Plus tard</button>
  `;
  
  document.body.appendChild(toast);
  
  window.installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('[PWA] Installation acceptée');
      }
      deferredPrompt = null;
      toast.remove();
      localStorage.setItem('installPromptShown', 'true');
    }
  };
  
  window.dismissInstall = () => {
    toast.remove();
    localStorage.setItem('installPromptShown', 'true');
    setTimeout(() => localStorage.removeItem('installPromptShown'), 7 * 24 * 60 * 60 * 1000); // 7 jours
  };
}

window.addEventListener('appinstalled', () => {
  console.log('[PWA] App installée');
  deferredPrompt = null;
});