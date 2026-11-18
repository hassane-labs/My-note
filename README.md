# My Note

Bloc-notes moderne, rapide, 100 % hors ligne. Inspiré de Notepad, avec les fonctionnalités les plus demandées par les utilisateurs d'apps de notes. Simple par conception : pas de collaboration, pas de comptes, pas de serveur, pas de tracking.

## Démarrage rapide

```bash
cd my-note
npx serve .
# ou
python3 -m http.server 8000
```

Puis ouvrez `http://localhost:3000` (serve) ou `http://localhost:8000` (Python).

L'app est une PWA installable : utilisez le menu navigateur « Installer l'application » ou l'icône dans la barre d'adresse.

## Raccourcis clavier

| Action | Raccourci |
|--------|-----------|
| Nouvelle note | `Alt+N` / `Ctrl+T` |
| Fermer onglet | `Ctrl+W` |
| Onglet suivant/précédent | `Ctrl+Tab` / `Ctrl+Shift+Tab` |
| Palette de commandes | `Ctrl+K` |
| Rechercher dans la note | `Ctrl+F` |
| Remplacer dans la note | `Ctrl+H` |
| Occurrence suivante/précédente | `F3` / `Shift+F3` |
| Aller à la ligne | `Ctrl+G` |
| Recherche globale | `Ctrl+Shift+F` |
| Imprimer / Export PDF | `Ctrl+P` |
| Gras / Italique / Lien | `Ctrl+B` / `Ctrl+I` / `Ctrl+K` |
| Cocher tâche | `Ctrl+Enter` |
| Insérer date/heure | `F5` |
| Coller texte brut | `Ctrl+Shift+V` |
| Mode Focus | `Ctrl+Shift+.` |
| Zoom + / - / Reset | `Ctrl++` / `Ctrl+-` / `Ctrl+0` |
| Aide raccourcis | `?` / `Ctrl+/` |

*Conflits navigateur : `Ctrl+F` ouvre la recherche navigateur sur certains OS. Utilisez `Ctrl+K` puis tapez `/` pour la recherche dans la note, ou `Ctrl+Shift+F` pour la recherche globale.*

## Fonctionnalités

### Phase 1 - Socle bloc-notes
- ✅ Créer, ouvrir, renommer, dupliquer, supprimer des notes
- ✅ Onglets multiples (comme Notepad moderne)
- ✅ Sauvegarde automatique (debounce 400ms) + forcée à la fermeture
- ✅ Reprise de session au démarrage
- ✅ Annuler/Rétablir, couper/copier/coller, sélection, indentation Tab
- ✅ Recherche/remplacement complet (regex, casse, mot entier, wrap-around)
- ✅ Numéros de ligne, retour à la ligne, zoom
- ✅ Barre d'état (ligne/col, mots, caractères, temps lecture, zoom, encodage, état sauvegarde)
- ✅ Thèmes Sombre / Clair / Auto
- ✅ Export PDF (via imprimante), .md, .txt, .html
- ✅ Sauvegarde/restauration JSON complète
- ✅ PWA installable, 100% hors ligne

### Phase 2 - Fonctionnalités demandées
- ✅ Markdown : modes Écrire / Aperçu / Côte à côte
- ✅ Listes de tâches cliquables (`- [ ]` / `- [x]`)
- ✅ Organisation : épingler, tags, archiver, corbeille (30j), tri
- ✅ Palette de commandes (Ctrl+K) avec recherche floue
- ✅ Recherche globale instantanée (Ctrl+Shift+F)
- ✅ Capture rapide (Alt+N, `?new=1`, partage Android)
- ✅ Historique des versions par note (snapshots auto, restauration)
- ✅ Partage (copier MD/texte, Web Share API)
- ✅ Mode Focus
- ✅ Virtualisation liste (>200 notes)
- ✅ Correcteur orthographique natif

### Phase 3 - Bonus
- 🔲 Verrouillage note par mot de passe (AES-GCM)
- 🔲 Rappels via API Notifications
- 🔲 Couleur par note, vue grille/liste
- 🔲 Internationalisation FR/EN complète

## Identité visuelle

**Logo** : Plume rouge (#E11D2E) sur fond noir (#0A0A0B), carré coins arrondis. Dessinée en SVG, lisible à 16px.

**Tokens CSS** :
```css
--bg: #0A0A0B;
--surface: #131316;
--surface-2: #1B1B20;
--border: #26262C;
--text: #ECE8E1;
--muted: #8C8A94;
--accent: #E11D2E;
--accent-hover: #FF3B4A;
--accent-soft: rgba(225,29,46,.14);
```

**Typographie** :
- Éditeur/Titres : Serif (Source Serif 4, Charter, Georgia, serif)
- Interface : Sans-serif (Inter, system-ui, sans-serif)
- Code : Monospace (ui-monospace, JetBrains Mono, Consolas)

**Thèmes** : Sombre (défaut), Clair (ivoire #FAF7F2), Auto (système). Transition sans flash.

## Stack technique

- **HTML/CSS/JS vanilla** (ES modules) - Aucun framework, aucun build obligatoire
- **IndexedDB** - Notes et révisions (wrapper maison `db.js`)
- **localStorage** - Réglages uniquement
- **PWA** - `manifest.json`, Service Worker (cache-first), `navigator.storage.persist()`
- **Libs locales** (`/vendor`) : `marked` (Markdown), `DOMPurify` (sanitisation)
- **Export PDF** - `window.print()` + `@media print`
- **Code modulaire** - Commenté en français, sans dépendance circulaire

## Structure du projet

```
my-note/
├── index.html          # Point d'entrée
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker
├── assets/
│   ├── logo.svg
│   ├── favicon.svg
│   └── icons/          # PNG 192, 512, maskable 512
├── css/
│   ├── tokens.css
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── themes.css
│   └── print.css
├── js/
│   ├── main.js
│   ├── db.js
│   ├── store.js
│   ├── editor.js
│   ├── tabs.js
│   ├── search.js
│   ├── findreplace.js
│   ├── palette.js
│   ├── markdown.js
│   ├── revisions.js
│   ├── export.js
│   ├── settings.js
│   ├── i18n.js
│   ├── shortcuts.js
│   └── utils.js
├── vendor/
│   ├── marked.min.js
│   └── dompurify.min.js
├── tests/
│   └── *.test.js
├── PLAN.md
└── README.md
```

## Modèle de données

**Note** :
```js
{
  id: "uuid",
  title: "string",
  content: "string",
  createdAt: "ISO8601",
  updatedAt: "ISO8601",
  pinned: false,
  archived: false,
  deletedAt: null,
  tags: [],
  color: null,
  locked: false,
  revisions: [{ timestamp, content, title }]
}
```

**Settings** :
```js
{
  theme: "dark" | "light" | "auto",
  fontFamily: "serif" | "sans" | "mono",
  fontSize: 16,
  lineHeight: 1.7,
  wordWrap: true,
  lineNumbers: false,
  statusBar: true,
  spellcheck: true,
  startup: "resume" | "new",
  language: "fr" | "en" | "auto",
  pastePlain: false
}
```

## Sécurité & Confidentialité

- **Aucune donnée ne quitte votre navigateur**. Pas de serveur, pas de synchronisation cloud.
- Tout HTML issu du Markdown est sanitisé par DOMPurify (config stricte).
- Verrouillage note (Phase 3) : AES-GCM + PBKDF2 (Web Crypto API). **Mot de passe perdu = note irrécupérable**.
- Notifications (Phase 3) : Limitation navigateur - fonctionne seulement si l'app est ouverte/installée.

## Import / Export

- **Export** : Note unique (.md, .txt, .html) ou sauvegarde complète (.json)
- **Import** : Fichiers .md/.txt/.html (multiples, drag & drop) ou restauration .json
- **Impression** : `Ctrl+P` → « Enregistrer au format PDF »

## Accessibilité

- Contraste WCAG AA minimum
- Focus visible sur tous les éléments interactifs
- Navigation clavier complète
- ARIA labels sur composants custom
- `prefers-reduced-motion` respecté
- `spellcheck` natif configurable

## Développement

### Lancer les tests
```bash
cd my-note
node --test tests/*.test.js
```

### Générer les icônes PWA (nécessite Node + sharp)
```bash
cd my-note
node scripts/generate-icons.js
```

### Choix techniques documentés

| Choix | Justification |
|-------|---------------|
| `<textarea>` natif | Accessibilité, simplicité, pas de contenteditable bugs |
| IndexedDB + localStorage | Persistance robuste, séparation données/réglages |
| marked + DOMPurify locaux | Zéro CDN, contrôle version, sécurité |
| Index inversé en mémoire | Suffisant pour ~5000 notes, pas de lib lourde |
| Pas de build step | Démarrage instantané, déploiement trivial |
| CSS custom properties | Thèmes dynamiques sans recompilation |
| ES modules natifs | Pas de bundler, cache navigateur efficace |

## Limites connues

- Pas de synchronisation multi-appareils (par conception)
- Pas de collaboration temps réel
- Recherche globale : index reconstruit au chargement (rapide <5000 notes)
- Verrouillage note : mot de passe oublié = perte définitive
- Notifications : non garanties si app fermée (limitation navigateur)
- Import JSON : écrase les notes existantes (pas de merge)

## Licence

MIT - Faites-en ce que vous voulez.