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

### Assistant chat (Mistral)

Le chat nécessite un backend léger pour protéger la clé API. Le frontend appelle `POST /api/chat` avec `{ messages: [...] }` et attend `{ reply: "..." }`.

Un proxy Supabase Edge Function est fourni (`supabase/functions/chat/index.ts`) :

```bash
supabase secrets set MISTRAL_API_KEY=... # puis
supabase functions deploy chat
```

Puis adapter l'URL `fetch('/api/chat', ...)` dans `js/chat.js` vers l'URL de la fonction déployée. Sans backend, le chat affiche un message de repli et le reste du site reste 100 % fonctionnel.

## Hors périmètre v1

Comptes utilisateurs, historique des fournées, partage social — la structure des données est prête pour ces ajouts.
