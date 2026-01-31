# 42 Events Dashboard

Dashboard pour visualiser et gérer les événements 42 Builders avec intégration de l'API 42.

## Fonctionnalités

- 🔐 Authentification OAuth 2.0 avec l'API 42
- 📅 Liste des événements à venir du campus Paris
- 👥 Visualisation des participants pour chaque événement
- 🔍 Recherche d'événements et de participants
- 📊 Export CSV des participants
- 📱 Interface responsive et moderne

## Prérequis

- Node.js 18+ et npm/pnpm
- Un compte 42 avec accès à l'intranet
- Une application OAuth 42 configurée sur le portail intranet

## Installation

1. Cloner le repository :
```bash
git clone git@github.com:Marchy2020/42Builders.git
cd 42Builders
```

2. Installer les dépendances :
```bash
npm install
# ou
pnpm install
```

3. Créer un fichier `.env.local` à la racine du projet :
```env
FORTYTWO_CLIENT_ID=votre_client_id
FORTYTWO_CLIENT_SECRET=votre_client_secret
FORTYTWO_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

4. Configurer votre application OAuth sur le portail 42 :
   - Aller sur https://profile.intra.42.fr/oauth/applications
   - Créer une nouvelle application
   - Définir le Redirect URI : `http://localhost:3000/api/auth/callback` (ou votre URL de production)
   - Copier le Client ID et Client Secret dans `.env.local`

5. Lancer le serveur de développement :
```bash
npm run dev
# ou
pnpm dev
```

6. Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur

## Utilisation

### Connexion

1. Cliquer sur "Se connecter avec 42"
2. Autoriser l'application sur la page OAuth de 42
3. Vous serez redirigé vers le dashboard

### Dashboard

- **Liste des événements** : Affiche tous les événements à venir du campus Paris
- **Recherche** : Utiliser la barre de recherche pour filtrer les événements
- **Pagination** : Naviguer entre les pages d'événements

### Détails d'un événement

- Cliquer sur "Voir les participants" pour accéder aux détails
- Visualiser les informations de l'événement
- Voir la liste des participants inscrits
- Rechercher des participants
- Exporter la liste en CSV

## Structure du projet

```
42-api-integration/
├── app/
│   ├── api/              # Routes API Next.js
│   │   ├── auth/         # Authentification OAuth
│   │   └── events/       # Endpoints pour les événements
│   ├── dashboard/        # Pages du dashboard
│   └── layout.tsx        # Layout principal
├── components/           # Composants React
│   ├── ui/              # Composants UI (shadcn/ui)
│   └── event-card.tsx   # Carte d'événement
├── lib/
│   ├── 42api.ts         # Client API 42
│   └── utils.ts         # Utilitaires
└── public/              # Assets statiques
```

## Technologies utilisées

- **Next.js 16** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling
- **shadcn/ui** - Composants UI
- **date-fns** - Manipulation de dates
- **API 42** - Intégration avec l'intranet 42

## Scripts disponibles

```bash
npm run dev      # Démarrer le serveur de développement
npm run build    # Construire pour la production
npm run start    # Démarrer le serveur de production
npm run lint     # Lancer ESLint
```

## Configuration de production

Pour déployer en production :

1. Mettre à jour `FORTYTWO_REDIRECT_URI` dans `.env.local` avec votre URL de production
2. Configurer le Redirect URI dans votre application OAuth 42
3. Déployer sur Vercel, Netlify ou votre plateforme préférée
4. Ajouter les variables d'environnement dans les paramètres de déploiement

## Limitations de l'API 42

L'API 42 a des limites de taux (rate limits) :
- **429 Too Many Requests** : Si vous voyez cette erreur, attendez 1-2 minutes avant de réessayer
- L'application gère automatiquement ces limites avec des délais entre les requêtes

## Sécurité

- ⚠️ **Ne jamais commiter** le fichier `.env.local` (déjà dans `.gitignore`)
- Les tokens d'accès sont stockés dans des cookies httpOnly
- Utilisation de OAuth 2.0 pour l'authentification sécurisée

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

Ce projet est un projet éducatif pour 42 Builders.

## Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contacter l'équipe 42 Builders
