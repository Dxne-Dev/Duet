Voici le **Product Requirement Document (PRD) / Cahier des Charges Technico-Fonctionnel** complet pour la V1 de ton application, suivi du **plan d'exécution pas à pas**.

---

# 📄 PRD & CAHIER DES CHARGES (V1 — MVP)

## 1. Vision & Objectifs

* **Nom de code du projet :** *VocalDuel / DuetArena*
* **Objectif V1 :** Valider l'expérience utilisateur du **Duel Vocal en temps réel** entre deux utilisateurs distants à coût zéro (0 $), sans friction d'inscription, pour pouvoir tourner des vidéos virales (TikTok/Reels).
* **Cible :** Jeunes (15-25 ans), amateurs de musique, rappeurs émergents, duos d'amis/couples.

---

## 2. Périmètre Fonctionnel (Scope V1)

### 2.1 Authentification & Onboarding

* **Mode Invité / Anonyme (Guest) :** Saisie d'un pseudo temporaire uniquement (pas d'email/mot de passe requis en V1 pour réduire la friction).

### 2.2 Gestion des Salons (Lobby Management)

* **Création de salon :** Sélection d'un titre dans le catalogue local pré-chargé (3 à 5 titres).
* **Code de salon unique :** Génération d'un code à 4 ou 6 caractères alphanumeric (ex: `X7K9`).
* **Rejoindre un salon :** Saisie manuelle du code ou clic sur un deep-link/URL.
* **État du salon (Realtime State) :**
* `WAITING` (En attente du Joueur 2)
* `READY` (Les 2 joueurs sont connectés, bouton "Prêt")
* `PLAYING` (Partie lancée)
* `FINISHED` (Fin de la chanson, bilan)



### 2.3 Le Moteur de Jeu (The Sing / Duel Engine)

* **Audio synchro :** Lancement simultané du fichier MP3 de la piste instrumentale sur les deux appareils via WebSockets (différence tolérée < 100ms).
* **Lecteur de Paroles Horodatées (LRC/JSON Prompt) :**
* Téléprompteur défilant en temps réel au rythme de la musique.
* Code couleur dynamique : **Vert (Joueur A)** / **Bleu (Joueur B)**.


* **Bascule de Micro (Audio Dispatch) :**
* Quand c'est le tour du Joueur A : son micro est actif, son écran affiche "À TOI DE CHANTER". Le Joueur B entend la voix du Joueur A dans son casque/haut-parleur.
* Quand le rôle s'inverse : bascule instantanée sans coupure de l'instrumentale.


* **Canal Vocal Bidirectionnel (WebRTC) :** Flux audio temps réel à faible latence entre les 2 téléphones.

---

## 3. Structure des Données (Schéma Supabase Minimal)

### Table `rooms`

```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  track_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'WAITING', -- 'WAITING', 'READY', 'PLAYING', 'FINISHED'
  player_a_name VARCHAR(50),
  player_b_name VARCHAR(50),
  start_timestamp BIGINT, -- Horodatage Unix en ms pour le démarrage synchro
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

```

# 🚀 ÉTAPES DE CONCEPTION PAS À PAS

Voici la feuille de route d'exécution découpée en **4 Sprints techniques** :

```
[ SPRINT 1 : Core Realtime ] ──> [ SPRINT 2 : Audio & WebRTC ] ──> [ SPRINT 3 : UI / Téléprompteur ] ──> [ SPRINT 4 : Polish & Tests ]

```

1. **Enregistrement Vidéo Local :** Utiliser la capture d'écran du téléphone (iOS/Android) ou enregistrer la sortie audio mixée pour créer le fichier vidéo de démo.
2. **Tests en conditions réelles :** Faire un duel entre deux téléphones connectés en 4G/Wi-Fi dans deux pièces différentes.
3. **Correction de la latence :** Ajuster le tampon d'avance de la musique si nécessaire.

---