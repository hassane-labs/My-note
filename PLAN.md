# Plan de développement - My Note

## Architecture globale

Application monopage (SPA) vanilla ES modules, PWA complète, 100% hors ligne.
Stockage : IndexedDB (notes) + localStorage (réglages).
Aucune dépendance externe à l'exécution (marked, DOMPurify copiés en local dans /vendor).

## Structure des modules JS

```
js/
├── main.js           # Point d'entrée, initialisation, routing basique
├── db.js             # Wrapper IndexedDB (notes, révisions)
├── store.js          # État global réactif (notes, onglets, settings, UI)
├── editor.js         # Éditeur de texte (textarea + fonctionnalités)
├── tabs.js           # Gestion des onglets (ouverts, historique, raccourcis)
├── search.js         # Recherche plein texte globale (index inversé simple)
├── findreplace.js    # Recherche/remplacement dans l'éditeur courant
├── palette.js        # Palette de commandes (Ctrl+K)
├── markdown.js       # Rendu Markdown (marked + DOMPurify)
├── revisions.js      # Historique des versions par note
├── export.js         # Export .md/.txt/.html/PDF/JSON + import
├── settings.js       # Panneau réglages + persistance localStorage
├── i18n.js           # Internationalisation FR/EN
├── shortcuts.js      # Gestionnaire raccourcis clavier global
└── utils.js          # Helpers (uuid, debounce, formatage, sanitize)
```

## CSS (approche modulaire)

```
css/
├── tokens.css        # Variables CSS (couleurs, typo, spacing, z-index)
├── base.css          # Reset, typographie de base, focus-visible
├── layout.css        # Grille responsive (sidebar + editor / mobile)
├── components.css    # Boutons, inputs, onglets, modales, tooltips
├── themes.css        # Thèmes sombre/clair/auto + transitions
└── print.css         # @media print pour export PDF propre
```

## Décisions techniques clés

1. **Éditeur** : `<textarea>` natif + overlay pour numéros de ligne, surlignage recherche, indentation Tab. Pas de contenteditable (complexité, accessibilité).
2. **Recherche globale** : Index inversé en mémoire (Map mot → Set<noteId>) mis à jour à chaque sauvegarde. Suffisant pour ~5000 notes.
3. **Révisions** : Stockées dans la note même (tableau `revisions[]` max 30). Snapshots créés via debounce 5min + seuils de diff (nombre de caractères changés > 10%).
4. **Markdown** : marked.js + DOMPurify (config stricte). Rendu côté client uniquement.
5. **Virtualisation liste** : IntersectionObserver + hauteur fixe par item (~48px). Au-delà de 200 notes.
6. **Raccourcis** : Map `combo -> handler` avec `event.preventDefault()` sélectif. Conflits navigateur documentés.
7. **Thèmes** : CSS custom properties sur `:root` + `data-theme` sur `<html>`. Changement sans flash via script inline dans `<head>`.
8. **PWA** : Service Worker cache-first (assets) + network-first (rien, tout est statique). `navigator.storage.persist()` au premier lancement.
9. **Icônes** : SVG inline (pas de police d'icônes). Logo plume redessiné en SVG.
10. **Tests** : `node --test` sur modules purs (utils, findreplace, revisions, export, i18n). Pas de tests E2E (navigateur requis).

## Phases

### Phase 1 : Socle bloc-notes (cible : 1 semaine)
- [x] Structure projet, PLAN.md, README.md
- [ ] Tokens CSS, themes.css, base.css, layout.css, components.css, print.css
- [ ] Logo SVG + favicon + icônes PWA (script Node sharp)
- [ ] manifest.json, sw.js (cache-first)
- [ ] db.js (IndexedDB wrapper : init, CRUD notes, révisions, settings)
- [ ] store.js (état réactif minimal : notes, onglets, settings, ui)
- [ ] main.js (boot, theme init, SW register, persist, raccourcis globaux)
- [ ] editor.js (textarea, sauvegarde auto debounce, indicateurs, undo/redo, raccourcis éditeur)
- [ ] tabs.js (onglets : nouveau, fermer, switch, indicateur modification, reprise session)
- [ ] findreplace.js (recherche/remplacement dans note : regex, casse, mot entier, wrap, compteur)
- [ ] settings.js (panneau : thème, police, taille, interligne, word-wrap, line-numbers, spellcheck, startup, langue, paste-plain)
- [ ] export.js (export .md/.txt/.html, print/PDF, sauvegarde JSON, import .md/.txt/.html + JSON)
- [ ] shortcuts.js (registre raccourcis + aide `?` / Ctrl+/)
- [ ] i18n.js (FR/EN, détection navigateur, dictionnaire)
- [ ] Tests unitaires : findreplace, revisions, export, utils
- [ ] Vérification manuelle complète Phase 1

### Phase 2 : Fonctionnalités demandées (cible : 1 semaine)
- [ ] markdown.js (rendu marked + DOMPurify, modes Écrire/Aperçu/Côte-à-côte, raccourcis MD)
- [ ] Liste de tâches : `- [ ]` / `- [x]` cliquables dans aperçu, Ctrl+Entrée dans éditeur, compteur
- [ ] Organisation : épingler, tags (#tag autocomplétion + filtre), archiver, corbeille (30j), tri
- [ ] palette.js (Ctrl+K : recherche floue titres/contenu/tags + commandes)
- [ ] search.js (Ctrl+Shift+F : recherche globale instantanée, extraits surlignés)
- [ ] Capture rapide : Alt+N, `?new=1`, share_target manifest, raccourci manifest
- [ ] revisions.js (UI : liste datée, comparaison simple, restauration 1 clic)
- [ ] Partage : copier MD/texte, navigator.share, message "pas de serveur"
- [ ] Mode Focus (Ctrl+Shift+. : masque sidebar + onglets)
- [ ] Virtualisation liste notes (>200)
- [ ] Correcteur orthographique natif (spellcheck + langue)
- [ ] Tests unitaires + vérification manuelle Phase 2

### Phase 3 : Bonus (si temps)
- [ ] Verrouillage note : AES-GCM + PBKDF2 (Web Crypto), avertissement clair
- [ ] Rappels : API Notifications (honnêteté sur limites)
- [ ] Couleur par note (6 pastilles), vue grille/liste
- [ ] Finalisation i18n (toutes chaînes)

## Jalons Git

- `Phase 1 : socle bloc-notes` - après vérification complète Phase 1
- `Phase 2 : fonctionnalités utilisateurs` - après vérification complète Phase 2
- `Phase 3 : bonus` - si applicable
- `Release 1.0.0` - version finale

## Risques & Mitigations

| Risque | Mitigation |
|--------|------------|
| IndexedDB indisponible (mode privé Safari) | Fallback localStorage + avertissement export manuel |
| Perte données avant sauvegarde | `beforeunload` + `visibilitychange` force save + texte gardé en mémoire |
| Conflits raccourcis navigateur | Alternatives documentées (ex: Ctrl+Shift+F au lieu de Ctrl+F pour globale) |
| Performance grandes notes (1Mo) | Virtualisation rendu, debounce, requestIdleCallback pour index |
| Migration schéma futur | Version dans DB + fonction migrate() dans db.js |

## Notes d'implémentation

- **Pas de build** : `npx serve` ou `python3 -m http.server` depuis racine.
- **Polices** : Stacks système par défaut. Optionnel : télécharger Source Serif 4, Inter, JetBrains Mono en woff2 local si temps.
- **Sanitisation** : TOUT HTML utilisateur passe par DOMPurify (config : pas de scripts, pas d'event handlers, pas de data: URI).
- **Accessibilité** : Focus visible, ARIA sur composants custom, contraste AA, navigation clavier complète.
- **Réduit-motion** : `@media (prefers-reduced-motion: reduce)` désactive transitions/animations.