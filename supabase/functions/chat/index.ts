import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const MISTRAL_API = 'https://api.mistral.ai/v1/chat/completions';
const MODEL = 'mistral-small-latest';

const SYSTEM = `Tu es l'assistant du site MakeMyBread, dédié au pain au levain selon une méthode validée.
Principes de la méthode : levain de production 50 g mère + 150 g farine + 100 g eau, pic en 4-6 h ; recette de référence boule 800 g : 350 g tipo 0 + 150 g complète + 330 g eau (66 %) + 150 g levain + 10 g sel ; autolyse 1-3 h ; pétrissage au pic avec test de la vitre ; pousse en masse ~3 h au volume (+50-75 %), un pliage par heure mains mouillées ; façonnage tendu ; pousse finale au frigo 12-24 h ; cuisson cocotte 250 °C, 20 min couvert + 20-25 min à découvert, dix dernières minutes hors cocotte sur grille ; refroidissement 1 h.
Leçons : mie dense = pousse trop courte et/ou hydratation trop basse (66 % résout) ; dessous brûlé = grille médiane + disque de papier + pain hors cocotte en fin ; noix au premier pliage, jamais au pétrissage ; Manitoba = +5-8 % d'eau, autolyse longue ; complètes = pousse plus lente, max 30 % du mélange.
Réponds en français, concret, bref, cohérent avec cette méthode.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors() });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  const key = Deno.env.get('MISTRAL_API_KEY');
  if (!key) {
    return json({ error: 'MISTRAL_API_KEY not configured' }, 500);
  }

  const { messages = [] } = await req.json();
  const payload = {
    model: MODEL,
    messages: [{ role: 'system', content: SYSTEM }, ...messages],
    max_tokens: 400
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
