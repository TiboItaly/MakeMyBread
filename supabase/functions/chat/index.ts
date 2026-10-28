import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const MISTRAL_API = 'https://api.mistral.ai/v1/chat/completions';

const SYSTEMS = {
  chat: `Tu es l'assistant du site MakeMyBread, dédié au pain au levain selon une méthode validée.
Principes de la méthode : levain de production 50 g mère + 150 g farine + 100 g eau, pic en 4-6 h ; recette de référence boule 800 g : 350 g tipo 0 + 150 g complète + 330 g eau (66 %) + 150 g levain + 10 g sel ; autolyse 1-3 h ; pétrissage au pic avec test de la vitre ; pousse en masse ~3 h au volume (+50-75 %), un pliage par heure mains mouillées ; façonnage tendu ; pousse finale au frigo 12-24 h ; cuisson cocotte 250 °C, 20 min couvert + 20-25 min à découvert, dix dernières minutes hors cocotte sur grille ; refroidissement 1 h.
Leçons : mie dense = pousse trop courte et/ou hydratation trop basse (66 % résout) ; dessous brûlé = grille médiane + disque de papier + pain hors cocotte en fin ; mie humide = 5 min de cuisson en plus ; noix au premier pliage, jamais au pétrissage ; Manitoba = +5-8 % d'eau, autolyse longue ; complètes = pousse plus lente, max 30 % du mélange.
Si l'utilisateur mentionne un imprévu d'horaire, recalcule les étapes suivantes de son plan en cohérence avec cette méthode (le volume juge, pas l'horloge).
Réponds en français, concret, bref.`,

  diagnostic: `Tu es le diagnostiqueur photo du site MakeMyBread (pain au levain, méthode validée).
L'utilisateur envoie une photo de son levain, de sa pâte ou de sa mie. Analyse l'image.
Base de diagnostics validés à croiser avec ce que tu vois :
- Mie dense/serrée : pousse en masse trop courte (juger au volume, pas à l'horloge) et/ou hydratation trop basse (passer à 66 %).
- Dessous brûlé : contact direct avec la fonte ; grille médiane, disque de papier cuisson, pain sorti de la cocotte en fin de cuisson.
- Mie légèrement humide/collante : cinq minutes de cuisson en plus.
- Levain affaissé/liquide/hooh : rafraîchi de relance (1:2:2), plusieurs rafraîchis rapprochés sur 2 jours si besoin.
- Croûte trop pâle : cuisson prolongée à découvert ; noix qui noircissent : cuisson surveillée, elles brûlent plus vite que la mie.
Format de réponse en français, bref et structuré : 1) ce que tu vois, 2) le diagnostic, 3) la correction concrète (2-3 actions max). Si l'image est peu claire, dis-le et demande un détail précis.`,

  ocr: `Tu es l'extracteur d'étiquettes du site MakeMyBread (onglet Farine).
L'utilisateur photographie l'étiquette d'un paquet de farine. Extrais les données du produit.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, avec ces clés (null si absent de l'étiquette) :
{"nom": "nom du produit", "marque": "marque", "type": "type de farine parmi tipo00, tipo0, tipo1, tipo2, integrale, manitoba, semoule, seigle (devine au nom, sinon null)", "proteines": nombre en g/100g, "cendres": nombre en % ou g/100g, "humidite": nombre en %, "fibres": nombre en g/100g, "energie": nombre en kcal/100g, "glucides": nombre en g/100g, "sucres": nombre en g/100g, "lipides": nombre en g/100g, "sel": nombre en g/100g, "origine": "origine du blé si indiquée", "mouture": "cylindres ou meule de pierre si indiqué"}`
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors() });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const key = Deno.env.get('MISTRAL_API_KEY');
  if (!key) return json({ error: 'MISTRAL_API_KEY not configured' }, 500);

  const { mode = 'chat', messages = [] } = await req.json();
  const system = SYSTEMS[mode] || SYSTEMS.chat;

  const hasImage = JSON.stringify(messages).includes('"image_url"');
  const model = Deno.env.get('MISTRAL_MODEL')
    || (hasImage ? 'pixtral-12b-2409' : 'mistral-small-latest');

  const payload = {
    model,
    messages: [{ role: 'system', content: system }, ...messages],
    max_tokens: mode === 'ocr' ? 500 : 600
  };

  const res = await fetch(MISTRAL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(payload)
  });

  const j = await res.json();
  const reply = j.choices?.[0]?.message?.content ?? '(pas de réponse)';
  return json({ reply });
});

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors() } });
}
