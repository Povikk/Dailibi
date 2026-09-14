# DAILIBI

Une affaire courte et complète chaque jour : observer, confronter les alibis, puis répondre à trois questions — qui, pourquoi et comment.

## Collection

Le dépôt contient 30 affaires datées du 1er au 30 septembre 2026. Chaque fichier de `data/cases/` sépare strictement les informations publiques, les métadonnées éditoriales et la solution privée.

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
npm run build
```

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
