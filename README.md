# Dailibi

Dailibi est un jeu d’enquêtes policières courtes à résoudre directement dans le navigateur. Chaque dossier demande d’examiner les faits, de confronter les alibis, puis d’identifier le responsable, son mobile et sa méthode.

**Jouer en ligne :** [dailibi.povik.workers.dev](https://dailibi.povik.workers.dev/)

## Fonctionnement

Une enquête rassemble des suspects, leurs déclarations, une chronologie et plusieurs pièces à examiner. Certains indices débloquent de nouvelles questions. Une fois le dossier étudié, le joueur dispose d’une seule accusation et répond à trois questions : qui, pourquoi et comment.

Après validation, le jeu affiche le score, la solution détaillée et les réponses des autres joueurs lorsqu’un nombre suffisant de participations a été atteint.

## Fonctionnalités

- 30 enquêtes originales, avec des lieux, des mobiles et des mécaniques différents
- indices interactifs, interrogatoires, fausses pistes et chronologie des faits
- bloc-notes privé enregistré sur l’appareil
- progression sauvegardée pour reprendre un dossier plus tard
- accusation unique suivie d’une correction complète
- score et résultat à copier pour les partager
- archives accessibles sans modifier les statistiques quotidiennes
- historique local, taux de réussite et suivi des séries
- 50 distinctions, plusieurs grades et des titres à équiper
- code de secours pour retrouver ses distinctions sur un autre appareil
- statistiques anonymes comparant les réponses des joueurs

## Technologies utilisées

- **Next.js 16** et **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Zod** pour la validation des dossiers
- **Cloudflare Workers** et **Vinext** pour l’hébergement
- **Cloudflare D1** pour les statistiques anonymes et la sauvegarde des distinctions
- **Vitest** pour les tests automatisés

## Installation et utilisation

Le moyen le plus simple de découvrir le projet est d’utiliser la [version en ligne](https://dailibi.povik.workers.dev/).

Pour le lancer en local, Node.js et npm sont nécessaires :

```bash
git clone https://github.com/Povikk/Dailibi.git
cd Dailibi
npm ci
npm run dev
```

L’application est ensuite disponible sur [http://localhost:3000](http://localhost:3000).

Commandes utiles pour vérifier le projet :

```bash
npm test
npm run typecheck
npm run case:validate
npm run build:cloudflare
npm run verify:build
```

La vérification du build s’assure notamment que les solutions des enquêtes restent côté serveur et ne sont pas intégrées aux fichiers envoyés au navigateur.

## Auteur

**Jonathan Ragot**  
GitHub : [Povikk](https://github.com/Povikk)
