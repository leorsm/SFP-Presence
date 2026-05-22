<!--
  Copyright (c) 2026 Léo Ratsamy — Licence MIT
  Toute revendication de propriété par une institution est interdite sans accord écrit explicite de l'auteur.
-->

<div align="center">

```
███████╗███████╗██████╗     ██████╗ ██████╗ ███████╗███████╗███████╗███╗   ██╗ ██████╗███████╗
██╔════╝██╔════╝██╔══██╗    ██╔══██╗██╔══██╗██╔════╝██╔════╝██╔════╝████╗  ██║██╔════╝██╔════╝
███████╗█████╗  ██████╔╝    ██████╔╝██████╔╝█████╗  ███████╗█████╗  ██╔██╗ ██║██║     █████╗  
╚════██║██╔══╝  ██╔═══╝     ██╔═══╝ ██╔══██╗██╔══╝  ╚════██║██╔══╝  ██║╚██╗██║██║     ██╔══╝  
███████║██║     ██║         ██║     ██║  ██║███████╗███████║███████╗██║ ╚████║╚██████╗███████╗
╚══════╝╚═╝     ╚═╝         ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═══╝ ╚═════╝╚══════╝
```

**Suivi automatique de tes 140h mensuelles de présence SFP**

![Platform](https://img.shields.io/badge/platform-iPhone%20only-lightgrey?style=flat-square&logo=apple)
![App](https://img.shields.io/badge/app-Scriptable-blue?style=flat-square)
![App](https://img.shields.io/badge/app-Raccourcis-orange?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Author](https://img.shields.io/badge/author-Léo%20Ratsamy-purple?style=flat-square)

</div>

---

> **⚠️ iPhone uniquement** — ce système n'est pas compatible Android ni ordinateur.

---

## 📖 Description

**SFP Présence** est un outil de suivi automatique conçu pour les étudiants en SFP (Stagiaire de la Formation Professionnelle) qui doivent justifier **140h de présence par mois** à l'école.

Le système détecte automatiquement tes arrivées et départs via le GPS de ton iPhone, calcule les durées, et les stocke dans iCloud — sans que tu aies à noter quoi que ce soit manuellement.

Le système repose sur 3 éléments :

- **Raccourcis** (déjà installé sur iPhone) — détecte les entrées/sorties via géolocalisation
- **Scriptable** (gratuit, App Store) — exécute les scripts et stocke les données dans iCloud
- **Widget** sur l'écran d'accueil — affiche tes heures en temps réel

---

## 📁 Fichiers

| Fichier | Description |
|---------|-------------|
| `SFP_Presence.js` | Script principal — widget + interface complète (3 onglets) |
| `SFP_Depart.js` | Script appelé automatiquement à chaque départ de l'école |
| `presences.json` | Base de données des sessions (vide au départ) |
| `LICENSE.txt` | Licence MIT — propriété de Léo Ratsamy |

---

## 🔧 Installation

### Étape 1 — Installer les apps

**Scriptable** — recherche-la sur l'App Store (icône bleue, développée par Simon Støvring). Elle est entièrement gratuite.

**Raccourcis** — normalement déjà installée sur ton iPhone. Sinon, télécharge-la depuis l'App Store.

---

### Étape 2 — Placer les fichiers

**`presences.json`** dans iCloud :

```
Fichiers → iCloud Drive → Scriptable → presences.json
```

> 💡 Si le dossier Scriptable n'existe pas, ouvre l'app Scriptable une fois — il sera créé automatiquement.

**`SFP_Presence.js`** et **`SFP_Depart.js`** dans Scriptable :

- Ouvre Scriptable → appuie sur **+** en haut à droite
- Copie-colle le contenu de `SFP_Presence.js`
- Appuie sur le titre en haut et nomme-le exactement **`SFP_Presence`**
- Appuie sur **Done** pour sauvegarder
- Répète les mêmes étapes pour `SFP_Depart.js`, nomme-le exactement **`SFP_Depart`**

> ⚠️ Les noms des scripts doivent être écrits exactement comme indiqué, majuscules et tiret bas compris. Une erreur dans le nom et le système ne fonctionnera pas.

---

### Étape 3 — Ajouter le widget

- Appuie longuement sur un espace vide de l'écran d'accueil jusqu'à ce que les icônes tremblent
- Appuie sur **+** en haut à gauche → recherche **Scriptable**
- Choisis la taille **Medium** → **Ajouter le widget**
- Appuie sur le widget pour le configurer → dans **Script**, sélectionne **SFP_Presence**
- Appuie en dehors pour fermer

> 💡 Appuyer sur le widget ouvre l'interface complète avec tes stats détaillées et la saisie manuelle.

---

### Étape 4 — Créer les automatisations

Ouvre **Raccourcis** → onglet **Automatisation** en bas.

#### 📍 Automatisation Arrivée

- **+** → **Lieu** → recherche ton école, ajuste le rayon si nécessaire
- Coche uniquement **À l'arrivée**
- Désactive **Demander avant d'exécuter** → **Suivant**
- Ajoute les actions suivantes dans l'ordre :

| # | Action | Paramètre |
|---|--------|-----------|
| 1 | Date actuelle | — |
| 2 | Formater la date | Format personnalisé : `yyyy-MM-dd'T'HH:mm:ss` |
| 3 | Définir une variable | Nom : `arrivee` |
| 4 | Ajouter au fichier texte | Dossier : `Scriptable` / Fichier : `en_cours.txt` / Désactiver Nouvelle ligne |
| 5 | Afficher une notification | Texte : `Arrivée enregistrée` |

#### 🏁 Automatisation Départ

- **+** → **Lieu** → même école → coche uniquement **Au départ**
- Désactive **Demander avant d'exécuter** → **Suivant**
- Ajoute une seule action :

| # | Action | Paramètre |
|---|--------|-----------|
| 1 | Lancer le script Scriptable | Script : `SFP_Depart` |

> 💡 C'est tout ! `SFP_Depart` lit l'heure d'arrivée, calcule la durée, et sauvegarde dans `presences.json`. Tu reçois une notification avec le temps passé.

---

### Étape 5 — Activer la localisation

```
Réglages → Confidentialité → Localisation → Raccourcis → Toujours
Réglages → Confidentialité → Localisation → Scriptable  → Toujours
```

> ⚠️ Sans l'autorisation **Toujours**, les automatisations ne se déclencheront pas en arrière-plan.

---

## ✅ Utilisation quotidienne

Une fois installé, le système est entièrement automatique :

- Tu arrives à l'école → notification **Arrivée enregistrée**
- Tu pars → notification avec le temps passé et la durée ajoutée
- Tu consultes tes stats → appuie sur le widget

### Interface complète (3 onglets)

| Onglet | Contenu |
|--------|---------|
| **Aperçu** | Anneau de progression mensuel, stats jour / semaine, heatmap des 28 derniers jours |
| **Sessions** | Liste de toutes tes sessions avec suppression possible |
| **Ajouter** | Formulaire de saisie manuelle si l'automatisation a raté |

---

## 🔧 Problèmes fréquents

**L'automatisation ne se déclenche pas**
- Vérifie que la localisation est en **Toujours** pour Raccourcis
- Vérifie que **Demander avant d'exécuter** est désactivé
- iOS peut avoir un délai de 5 à 15 minutes — c'est normal

**Le widget affiche 0h**
- Vérifie que `presences.json` est dans `iCloud Drive > Scriptable`
- Ouvre Scriptable et lance manuellement **SFP_Presence** pour voir les erreurs éventuelles

**J'ai oublié de noter une journée**
- Appuie sur le widget → onglet **Ajouter** → saisis ta session manuellement

---

## ⚖️ Licence et propriété

```
MIT License — Copyright (c) 2026 Léo Ratsamy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software to use, copy, modify and distribute it, subject to the following
conditions: The above copyright notice shall be included in all copies.

NOTICE : Toute revendication de propriété par une institution (école, organisme
de formation) est strictement interdite sans accord écrit explicite de l'auteur.
```

---

<div align="center">
<sub>Créé par Léo Ratsamy • 2026</sub>
</div>
