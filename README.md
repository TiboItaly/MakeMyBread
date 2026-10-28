# 🍞 MakeMyBread

Site web coopératif francophone dédié au pain au levain : levain, farines, générateur de plans de production, et assistant conversationnel.

## Contenu

- **Levain** : création de zéro, entretien hebdomadaire, levain de production, diagnostic interactif des symptômes.
- **Farine** : catalogue des farines italiennes (tipo 00 à Manitoba, semoule, seigle), vue comparative, composition de l'eau, scan de code-barres via [Open Food Facts](https://world.openfoodfacts.org/) avec stockage local (localStorage).
- **Plan** : générateur de plan de production étape par étape, construit à rebours depuis l'heure de cuisson souhaitée, compatible avec une journée de travail (9h-18h). Modes « façonnage ce soir, cuisson demain » (par défaut) et « cuisson ce soir ». Timings adaptés à la farine choisie. Export copiable/imprimable.
- **Recettes & savoir** : recette de référence, processus validé, leçons apprises, déclinaisons (pain de mie, deux pains, feu de bois, noix), conservation, coûts.

## Structure

```
index.html            # page unique, onglets
css/style.css         # styles mobile-first (nav en bas d'écran)
data/bread.json       # toutes les données du site, séparées du code
js/                   # rendu des onglets, scan, plan, chat
supabase/functions/chat/  # proxy Mistral (clé API côté serveur uniquement)
```

Ajouter une recette ou une farine = éditer `data/bread.json`, aucun code à modifier.

## Déploiement

### Front (GitHub Pages)

Le workflow `.github/workflows/pages.yml` déploie automatiquement la branche `main`. Activer dans **Settings → Pages → Source : GitHub Actions**.

### Couche IA (V2) — une seule route backend

Toutes les fonctions IA passent par **une unique Edge Function** `chat` (`supabase/functions/chat/index.ts`) qui assemble contexte + message + éventuelle image et appelle l'API Mistral. Trois modes via le champ `mode` :

- `chat` : assistant conversationnel, contexte méthode + **plan en cours injecté** (assistance active : l'IA recalcule les étapes en cas d'imprévu)
- `diagnostic` : **diagnostic photo** (levain, pâte, mie) — modèle vision, leçons apprises en contexte, réponse structurée : ce que je vois / diagnostic / correction
- `ocr` : **extraction d'étiquette par vision** (onglet Farine) — renvoie un JSON structuré (protéines, cendres, nutrition, origine, mouture)

La clé API Mistral est **uniquement un secret côté serveur** :

```bash
supabase secrets set MISTRAL_API_KEY=...   # clé Mistral
supabase functions deploy chat
```

Puis adapter `CHAT_ENDPOINT` dans `js/chat.js` vers l'URL de la fonction déployée. Sans backend, le site affiche des messages de repli et reste 100 % fonctionnel.

**Mémoire des fournées (structure prête)** : chaque échange IA est journalisé dans `localStorage` (clé `mmb_memory`) — question, réponse, plan en cours. Structure prévue pour le coaching multi-fournées (cible V2+) : historique des farines scannées, plans suivis, photos des résultats.

## Hors périmètre v1

Comptes utilisateurs, historique des fournées, partage social — la structure des données est prête pour ces ajouts.
