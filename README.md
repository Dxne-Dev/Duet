# duet. — Deux voix. Un duel vocal en direct. 🎤

> **Application web de duel vocal et karaoké à deux joueurs en temps réel.**  
> Chantez face à face à distance avec alternance des couplets, téléprompteur interactif, audio WebRTC zéro latence et calcul du score en direct. Sans inscription obligatoire.

---

## ✨ Fonctionnalités Clés

- 🎙️ **Téléprompteur Synchronisé & Alternance des Rôles** : Découpage intelligent des morceaux (Joueur A, Joueur B, et Refrain en Duo). Gestion automatique des intros et ponts musicaux.
- ⚡ **Audio P2P WebRTC Zéro Latence** : Transmission de la voix en direct et en haute fidélité via WebRTC avec passerelle multi-STUN/TURN pour résister aux réseaux 4G/5G et Wi-Fi stricts.
- 🏆 **Moteur de Scoring Vocal en Direct** : Détection de présence et d'énergie vocale via l'API Web Audio (`AnalyserNode`), respect des tours de chant, et attribution de la couronne du vainqueur 👑.
- 🤝 **Score de Synchronisation du Duo** : Mesure du taux de réussite global des deux chanteurs pour évaluer la complicité scénique.
- 📱 **100 % Responsive & Mobile First** : Optimisé pour iPhone (Safari iOS) et Android (Chrome), avec gestion du déverrouillage audio tactile et prévention de l'écho.
- 🔗 **Cartes de Partage Sociales Universelles** : Génération dynamique de cartes OpenGraph 1200×630 pour WhatsApp, iMessage, Twitter / X, Telegram, Discord, et Facebook.

---

## 🛠️ Stack Technique

- **Framework** : [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Frontend** : [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Base de Données** : [PostgreSQL (Supabase)](https://supabase.com/) & [Drizzle ORM](https://orm.drizzle.team/)
- **Temps Réel & Audio** : WebRTC P2P, Web Audio API, LRCLIB API
- **Langage** : TypeScript (Strict mode)

---

## 🚀 Démarrage Rapide (Développement Local)

### 1. Prérequis
- [Node.js 20+](https://nodejs.org/)
- Un projet [Supabase](https://supabase.com/) (ou base PostgreSQL)

### 2. Installation des dépendances
```bash
npm install
```

### 3. Configuration des variables d'environnement
Créez un fichier `.env` à la racine :

```env
DATABASE_URL="postgresql://postgres.[VOTRE_PROJET]:[VOTRE_MDP]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Initialisation de la base de données
```bash
npm run db:push
```

### 5. Lancer le serveur de développement
```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 🌐 Déploiement en Production (Vercel)

1. Importez ce dépôt sur votre compte **[Vercel](https://vercel.com/new)**.
2. Ajoutez la variable d'environnement dans les paramètres du projet :
   - `DATABASE_URL` = *(Votre URL Supabase Postgres)*
   - `NEXT_PUBLIC_APP_URL` = *(L'URL de votre domaine déployé)*
3. Cliquez sur **Deploy**.

---

## 📂 Structure du Projet

```
├── public/                # Fichiers statiques (audio, pochettes d'albums, favicons SVG)
├── src/
│   ├── app/               # Next.js App Router (pages, API routes, opengraph-image)
│   │   ├── api/rooms/     # API de gestion des salons & signalisation WebRTC
│   │   ├── layout.tsx     # Layout racine avec métadonnées SEO & OpenGraph
│   │   └── page.tsx       # Point d'entrée de l'application
│   ├── components/        # Composants de l'application (Arène, Lobby, Téléprompteur, Résultats)
│   ├── db/                # Schéma Drizzle ORM et client Supabase Postgres
│   ├── hooks/             # Hooks audio (WebRTC, analyseur de fréquences micro, audio player synchro)
│   └── lib/               # Utilitaires de synchronisation, gestion des tracks et serveurs STUN/TURN
└── drizzle.config.ts      # Configuration des migrations Drizzle
```

---

## 📄 Licence

Ce projet est sous licence MIT.
