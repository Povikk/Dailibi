# DAILIBI

Une affaire courte et complète chaque jour : observer, confronter les alibis, puis répondre à trois questions — qui, pourquoi et comment.

## Collection

Le dépôt contient 30 affaires datées du 1er au 30 septembre 2026. Chaque fichier de `data/cases/` sépare strictement les informations publiques, les métadonnées éditoriales et la solution privée.

Le calendrier est **fini** : une affaire n'est jouable que le jour de sa date de publication. Passé ce jour elle rejoint les archives, et les jours sans affaire affichent l'échéance suivante. Aucune affaire n'est recyclée sur une nouvelle date.

```bash
npm ci
npm run dev
```

Contrôles avant publication :

```bash
npm test
npm run typecheck
npm run case:validate
npm run case:cliche
npm run build:cloudflare
npm run verify:build
```

`verify:build` relit `dist/client` et échoue si une donnée privée (analyse d'indice, réponse de validation, texte de solution) a franchi la frontière serveur/client.

## Progression du joueur

Statistiques personnelles, série, **50 distinctions**, grade et titre affiché en haut de l'écran : tout est calculé dans le navigateur, sans inscription. Le titre équipé se choisit depuis la page Historique.

## Statistiques entre joueurs (D1)

Les « % de ce que les autres ont répondu » viennent d'une base Cloudflare D1 qui ne contient **que des compteurs** : aucun profil, aucun email, aucune adresse IP. Le secret d'appareil est haché **par affaire**, il n'est donc pas corrélable d'un jour à l'autre.

```bash
npm run db:migrate:local   # base locale utilisée par la prévisualisation Cloudflare
npm run db:migrate         # base distante (production, aussi appliquée par la CI)
```

Un dossier n'affiche ses pourcentages qu'à partir de 10 accusations, et le jour même seulement après avoir soi-même accusé — sinon les stats spoileraient la réponse.

## Profil anonyme et code de secours

Les distinctions, le grade et le titre sont recalculés **côté serveur** à partir d'un instantané de progression (compteurs uniquement : parties jouées, meilleure série, affaires entièrement explorées…). Aucun compte n'est créé : le navigateur garde un secret aléatoire qui sert à la fois d'identifiant et de **code de secours**, et le serveur n'en stocke qu'un hachage SHA-256.

Le code affiché dans *Historique → Code de secours* permet de retrouver ses distinctions sur un autre appareil. Les statistiques personnelles, elles, restent locales. Le profil ne régresse jamais : un navigateur vidé n'efface pas les badges déjà gagnés.

Quand la collection est terminée, la page d'accueil affiche le bilan du joueur (affaires classées, résolues, moyenne, distinctions) au lieu d'un emplacement vide.

La collection générée peut être reconstruite sans toucher à l'affaire historique nº14 :

```bash
npm run case:generate
```

## Publication GitHub → Cloudflare

Le dépôt doit rester **privé**, car les fichiers d'affaires contiennent leurs solutions. Dailibi utilise la même architecture Cloudflare Workers/Vinext que Tonight : l'interface et l'API Next.js sont déployées ensemble, tandis que la solution reste côté serveur.

Déploiement manuel depuis une machine déjà connectée à Cloudflare :

```bash
npm run build:cloudflare
npm run deploy:cloudflare
```

Le workflow `.github/workflows/deploy-cloudflare.yml` vérifie puis déploie automatiquement chaque push sur `main`. Ajouter dans les secrets GitHub Actions du dépôt :

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Le token doit pouvoir modifier les Workers du compte. Aucun serveur Docker, aucune base de données et aucun secret applicatif ne sont nécessaires pour la version actuelle.

Adresse Workers actuelle : <https://dailibi.povik.workers.dev>
