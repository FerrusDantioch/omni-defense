// sw.js — Service worker de Omni-Défense (phase 5). Ne s'active jamais sous file://
// (les navigateurs exigent une origine http/https, voir ARCHITECTURE.md) : sous ce
// protocole, navigator.serviceWorker.register échoue simplement, et le jeu continue de
// fonctionner sans les bénéfices d'installation et de cache explicite qu'il apporte une
// fois servi par un hébergement web ou un serveur local.
//
// Stratégie « copie de l'appareil d'abord », et nouvelle version SUR DEMANDE (octobre
// 2026) : le jeu ne change jamais par surprise, encore moins en pleine partie.
// - Chaque fichier est servi depuis le cache de CETTE version (CACHE_NOM) ; le réseau
//   ne sert qu'à un fichier absent du cache. Rien n'est remplacé en arrière-plan.
// - ⚠️ CACHE_NOM doit donc être incrémenté à CHAQUE modification d'un fichier du jeu
//   (voir CLAUDE.md) : c'est ce qui fait remarquer au navigateur un service worker
//   différent. Il télécharge alors la nouvelle version, qui ATTEND : l'écran d'accueil
//   propose « Mettre à jour » (js/jeu.js), et elle ne prend le relais qu'après cet
//   appui. Seule exception, fixée par le navigateur : si le jeu est complètement
//   fermé, la nouvelle version est là à la prochaine ouverture.
// Historique : de v28 à v34, stratégie « réseau d'abord » (mise à jour prise dès le
// chargement suivant) ; v29 : ajout de statistiques.js et sauvegarde.js ; v35 : retour
// à la copie d'abord, avec nouvelle version sur demande.
const CACHE_NOM = 'omni-defense-v35';

// Débuts de nom de NOS caches (« defense-neon- » : ancien nom du jeu). Toutes les
// applications de ferrusdantioch.github.io partagent la même liste de caches : on ne
// supprime que les nôtres, jamais ceux des autres applications du site.
const PREFIXES_A_NOUS = ['omni-defense-', 'defense-neon-'];

// './images/decor-fond.png' (phase 7C bis) : le fichier réellement déposé dans le
// projet est un .png, pas le .webp initialement prévu par le prompt de cette
// sous-phase (aucun outil de conversion vers WebP disponible dans cet environnement au
// moment de l'intégrer, voir ARCHITECTURE.md) — le nom et l'extension ci-dessous, dans
// index.html et dans cette liste, ont été ajustés en conséquence pour rester exacts.
const FICHIERS_A_METTRE_EN_CACHE = [
    './',
    './index.html',
    './manifest.webmanifest',
    './css/style.css',
    './js/config.js',
    './js/aleatoire.js',
    './js/carte.js',
    './js/ennemi.js',
    './js/vagues.js',
    './js/unite.js',
    './js/tour.js',
    './js/progression.js',
    './js/statistiques.js',
    './js/sauvegarde.js',
    './js/particules.js',
    './js/son.js',
    './js/decor.js',
    './js/interface.js',
    './js/jeu.js',
    './icones/icone-192.png',
    './icones/icone-512.png',
    './images/decor-fond.png'
];

// Installation : copie de tous les fichiers. Volontairement, PAS de
// self.skipWaiting() ici : la nouvelle version attend l'appui sur « Mettre à jour ».
self.addEventListener('install', (evenement) => {
    evenement.waitUntil(
        caches.open(CACHE_NOM)
            // `cache: 'reload'` : contourne le cache HTTP du navigateur, pour copier
            // la version réellement en ligne plutôt qu'une version déjà périmée.
            .then((cache) => cache.addAll(
                FICHIERS_A_METTRE_EN_CACHE.map((url) => new Request(url, { cache: 'reload' }))
            ))
    );
});

// Le joueur a touché « Mettre à jour » : cette version prend le relais. La page le
// remarque (événement « controllerchange ») et se recharge.
self.addEventListener('message', (evenement) => {
    if (evenement.data && evenement.data.type === 'activer') self.skipWaiting();
});

// clients.claim() : à la toute première visite, le service worker prend aussitôt en
// charge la page ouverte, sans attendre un rechargement.
self.addEventListener('activate', (evenement) => {
    evenement.waitUntil(
        caches.keys()
            .then((nomsCaches) => Promise.all(
                nomsCaches
                    .filter((nom) => nom !== CACHE_NOM && PREFIXES_A_NOUS.some((p) => nom.startsWith(p)))
                    .map((nom) => caches.delete(nom))
            ))
            .then(() => self.clients.claim())
    );
});

// Copie de l'appareil d'abord : on ne cherche que dans le cache de CETTE version
// (pendant qu'une nouvelle version attend, son cache existe déjà à côté). Un fichier
// absent du cache est demandé au réseau, et sa copie gardée. Seules les lectures (GET)
// des fichiers du jeu lui-même sont concernées ; tout le reste suit le chemin normal
// du navigateur.
self.addEventListener('fetch', (evenement) => {
    const requete = evenement.request;
    if (requete.method !== 'GET' || new URL(requete.url).origin !== self.location.origin) return;

    evenement.respondWith(
        caches.open(CACHE_NOM).then((cache) => cache.match(requete, { ignoreSearch: true }).then((enCache) => {
            if (enCache) return enCache;
            return fetch(requete).then((reponse) => {
                if (reponse.ok && reponse.type === 'basic') cache.put(requete, reponse.clone());
                return reponse;
            });
        }))
    );
});
