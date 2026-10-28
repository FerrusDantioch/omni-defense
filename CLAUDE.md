# Omni-Défense — notes pour Claude

Jeu de tower defense en **HTML/CSS/JS pur, sans dépendance ni compilation**.
Code et commentaires en français : conserver ce niveau d'explication. Le détail
de l'architecture est dans `ARCHITECTURE.md`.

## ⚠️ Avant de pousser : incrémenter la version du service worker

Après toute modification d'un fichier **mis en cache** (`index.html`, `css/`,
`js/`, `manifest.webmanifest`, `icones/`, `images/`), incrémenter d'un cran la
constante en haut de `sw.js`, en partant du numéro qui y figure :

```js
const CACHE_NOM = 'omni-defense-vN';   // → 'omni-defense-vN+1'
```

Sans ce changement, le navigateur ne voit aucune nouvelle version, et les
joueurs gardent l'ancienne indéfiniment (oubli déjà arrivé deux fois). En cas
d'ajout de fichier, l'inscrire aussi dans `FICHIERS_A_METTRE_EN_CACHE`.

## Nouvelle version : jamais de changement par surprise

Une nouvelle version **attend** que le joueur touche « Mettre à jour »
(`#bandeau-mise-a-jour`, sur l'écran d'accueil seulement : jamais en pleine
partie ; objet `MiseAJour` en fin de `js/jeu.js`). Ne pas remettre
`self.skipWaiting()` dans l'installation de `sw.js` : il n'est appelé qu'au
message `{ type: 'activer' }`. Le `fetch` sert la copie de `CACHE_NOM` et ne
remplace jamais un fichier en arrière-plan.

## Tester

```bash
node outils/serveur-statique.js . 8080   # serveur local, puis http://localhost:8080
node outils/test-navigateur.js           # partie complète dans Chromium (aussi lancé par GitHub)
```
