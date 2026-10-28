function refreshPlanFlours() {
  const sel = document.getElementById('plan-farine');
  if (!sel || !BREAD_DATA) return;
  const prev = sel.value;
  sel.innerHTML = `<option value="tipo0">Tipo 0 (référence)</option>`
    + BREAD_DATA.farines.map(f => `<option value="${f.id}">${f.nom}</option>`).join('')
    + getScanned().map((s, i) => `<option value="scan-${i}">📦 ${s.nom}${s.marque ? ' (' + s.marque + ')' : ''}</option>`).join('');
  if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
}

const fmtHm = d => {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};
const addMin = (d, min) => new Date(d.getTime() + min * 60000);
const addJ = (d, j) => new Date(d.getTime() + j * 86400000);
const jourFr = d => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

function renderPlan(data) {
  const el = document.getElementById('plan-content');
  const farineOptions = data.farines.map(f =>
    `<option value="${f.id}">${f.nom}</option>`).join('');
  const scannedOptions = getScanned()
    .map((s, i) => `<option value="scan-${i}">📦 ${s.nom}${s.marque ? ' (' + s.marque + ')' : ''}</option>`)
    .join('');

  el.innerHTML = `
    <h2>Plan de production</h2>

    <div class="card">
      <h3>Paramètres</h3>

      <label for="plan-farine">Farine principale</label>
      <select id="plan-farine">
        <option value="tipo0" selected>Tipo 0 (référence)</option>
        ${farineOptions}
        ${scannedOptions}
      </select>

      <label for="plan-npains">Nombre de pains</label>
      <select id="plan-npains">
        <option value="1" selected>1 pain</option>
        <option value="2">2 pains</option>
        <option value="3">3 pains</option>
      </select>

      <label for="plan-mode">Mode de cuisson</label>
      <select id="plan-mode">
        <option value="frigo" selected>Façonnage ce soir, cuisson demain (recommandé)</option>
        <option value="cesoir">Cuisson ce soir (pousse finale ambiante 1 h 30 - 2 h)</option>
      </select>

      <label for="plan-cible">Heure de cuisson souhaitée</label>
      <input type="time" id="plan-cible" value="19:00">

      <p>
        <input type="checkbox" id="plan-noix"> <label for="plan-noix" style="display:inline">Pain aux noix</label>
        <input type="checkbox" id="plan-mie"> <label for="plan-mie" style="display:inline">Pain de mie (mode moule)</label>
        <input type="checkbox" id="plan-congel"> <label for="plan-congel" style="display:inline">Congélation des tranches</label>
      </p>

      <button class="btn" id="plan-generate">Générer le plan</button>
    </div>

    <div id="plan-output"></div>
  `;

  el.querySelector('#plan-generate').addEventListener('click', () => {
    const farineId = el.querySelector('#plan-farine').value;
    const nPains = Number(el.querySelector('#plan-npains').value);
    const mode = el.querySelector('#plan-mode').value;
    const cible = el.querySelector('#plan-cible').value;
    const noix = el.querySelector('#plan-noix').checked;
    const mie = el.querySelector('#plan-mie').checked;
    const congel = el.querySelector('#plan-congel').checked;
    generatePlan({ farineId, nPains, mode, cible, noix, mie, congel });
  });
}

function generatePlan(opts) {
  const out = document.getElementById('plan-output');
  const data = BREAD_DATA;

  let farine;
  if (opts.farineId.startsWith('scan-')) {
    const s = getScanned()[Number(opts.farineId.slice(5))];
    farine = { nom: s?.nom || 'Farine scannée', force: s?.type || 'inconnu', absorption: 'voir fiche scannée', impactPlan: 'Timings standards' };
  } else {
    farine = data.farines.find(f => f.id === opts.farineId) || data.farines[1];
  }

  const isManitoba = farine.nom.toLowerCase().includes('manitoba');
  const isComplete = ['integrale', 'tipo1', 'tipo2', 'seigle'].includes(farine.id);

  // Ajustements selon farine (leçons apprises)
  const autolyseH = isManitoba ? 3 : (isComplete ? 1.5 : 1); // autolyse longue pour force
  const pousseMassMin = 180 + (isComplete ? 45 : 0) - (isManitoba ? 15 : 0);
  const picLevainH = isManitoba ? 4.5 : 5.5;
  const pousseFinaleMin = opts.mode === 'frigo' ? 18 * 60 : 1 * 60 + 45;

  // Construction à rebours depuis l'heure de cuisson
  const [ch, cm] = opts.cible.split(':').map(Number);
  const now = new Date();
  const cuisson = new Date(now);
  cuisson.setHours(ch, cm, 0, 0);
  if (cuisson < now) cuisson.setDate(cuisson.getDate() + 1);
  if (opts.mode === 'frigo') cuisson.setDate(cuisson.getDate() + 1);

  const refroidi = addMin(cuisson, 60);
  const enfournage = cuisson; // la cuisson démarre à l'enfournage
  const debutCuissonFour = addMin(cuisson, -30); // préchauffage cocotte
  const finFaconnage = opts.mode === 'frigo'
    ? addJ(addMin(debutCuissonFour, -pousseFinaleMin), -1)
    : addMin(debutCuissonFour, -pousseFinaleMin);
  const debutPousseMasse = addMin(finFaconnage, -pousseMassMin);
  const finPetrissage = debutPousseMasse;
  const debutPetrissage = addMin(finPetrissage, -15);
  const finAutolyse = debutPetrissage;
  const debutAutolyse = new Date(finAutolyse.getTime() - autolyseH * 3600000);
  const picLevain = finPetrissage;
  const constructionLevain = addMin(picLevain, -picLevainH * 60);

  const mult = opts.nPains === 1 ? 1 : 2; // recette référence x1 ou x2 (2-3 pains)
  const ing = data.recetteReference.ingredients.map(i => i.nom).join(', ');

  const step = (date, title, objectif, sensoriel) => `
    <div class="plan-step">
      <div class="step-time">${jourFr(date)} — ${fmtHm(date)}</div>
      <div class="step-title">${title}</div>
      <div class="objectif">${objectif}</div>
      ${sensoriel ? `<div class="sensoriel">🎯 ${sensoriel}</div>` : ''}
    </div>`;

  let html = `
    <div class="card">
      <h3>Plan pour ${opts.nPains} pain${opts.nPains > 1 ? 's' : ''} — ${farine.nom}</h3>
      ${opts.mode === 'frigo'
        ? '<p>Mode « façonnage la veille, cuisson le lendemain » : pousse finale longue au frigo (zone de goût idéale 18-20 h), compatible avec une journée de travail 9h-18h.</p>'
        : '<p>Mode « cuisson ce soir » : pousse finale à température ambiante (1 h 30 à 2 heures).</p>'}
      ${isManitoba ? '<p class="sensoriel">Manitoba : eau 345-350 g (+5-8 %), autolyse longue, pic du levain plus tôt.</p>' : ''}
      ${isComplete ? '<p class="sensoriel">Farine avec complète : pousse en masse allongée, mie naturellement plus serrée.</p>' : ''}
      ${opts.noix ? '<p class="sensoriel">Noix : 100-120 g max pour 500 g de farine, torréfiées et refroidies, à incorporer au premier pliage — jamais au pétrissage.</p>' : ''}
      ${opts.mie ? '<p class="sensoriel">Pain de mie : 450 g farine (dont 100 g complète), 240 g eau, 120 g levain, 10 g sel, 40 g beurre ou huile, 20 g miel. Cuisson 200 °C moule, 35-40 min, couvercle retiré 5-8 dernières minutes, démoulage immédiat, tranchage le lendemain.</p>' : ''}
      ${opts.congel ? '<p class="sensoriel">Congélation : trancher et congeler dès le deuxième jour.</p>' : ''}
      <p><strong>Ingrédients de référence${opts.nPains > 1 ? ' (à doubler pour 2 pains ; voir recette « deux pains »)' : ''} :</strong> ${ing}.</p>
    </div>
  `;

  html += step(constructionLevain, '🫙 Construction du levain de production',
    `${data.levain.production.ratios} — pic attendu vers ${fmtHm(picLevain)}. ${data.levain.production.pic}`,
    'Dôme bien bombé à son maximum = pic.');
  html += step(debutAutolyse, '💧 Autolyse',
    'Farine + eau seuls, mélange sommaire. ' + (autolyseH >= 3 ? 'Autolyse longue (farine de force).' : `Durée : ${autolyseH} h.`),
    'La pâte se rassemble sans pétrissage.');
  html += step(debutPetrissage, '👐 Pétrissage au pic du levain',
    'Incorporation du levain en morceaux, étirement-repli 5 min, pause 5 min, puis sel.',
    'Test de la vitre : membrane translucide sans déchirure — arrêt immédiat. Trop pétri = pâte caoutchouc.');
  html += step(debutPousseMasse, '📈 Pousse en masse',
    `Environ ${Math.round(pousseMassMin / 60 * 10) / 10} h à température ambiante, un pliage par heure, mains mouillées, jamais de farine de correction.`,
    '+50 à 75 % de gonflement. Le volume juge, pas l\'horloge.');
  if (opts.noix) {
    html += step(addMin(debutPousseMasse, 60), '🥜 Incorporation des noix',
      'Au premier pliage, 100-120 g max pour 500 g de farine, torréfiées et refroidies.',
      'Noix réparties sans écraser la pâte.');
  }
  html += step(finFaconnage, '🌀 Façonnage',
    'Démoulage rapide (moins de 2 min sur le plan), boule bien tendue, mains en creux, cousure vers le haut dans un linge fariné ou banneton.',
    'Surface tendue sans déchirure.');
  html += step(finFaconnage, opts.mode === 'frigo' ? '❄️ Pousse finale au frigo' : '🕒 Pousse finale ambiante',
    opts.mode === 'frigo' ? '12 à 24 h au frigo, zone idéale de goût vers 18-20 h.' : '1 h 30 à 2 heures à température ambiante.',
    'La pâte se raffermi et se parfume.');
  html += step(debutCuissonFour, '🔥 Préchauffage du four',
    'Four 250 °C, grille médiane, cocotte vide 30 minutes. Disque de papier cuisson au fond.',
    '');
  html += step(enfournage, '🥖 Enfournage et cuisson',
    'Pain froid, entailles franches. 20 min couvert, 20-25 min à découvert, dix dernières minutes pain sur la grille (hors cocotte).',
    'Croûte ambrée profonde, dessous non brûlé.');
  html += step(refroidi, '🌬️ Refroidissement',
    'Une heure sur grille avant de trancher.',
    'Mie cuite à cœur, croûte croustillante.');

  html += `
    <div class="card">
      <button class="btn" id="plan-copy">📋 Copier la checklist</button>
      <button class="btn btn-secondary" id="plan-print">🖨️ Imprimer</button>
    </div>`;

  out.innerHTML = html;

  out.querySelector('#plan-copy').addEventListener('click', () => {
    const txt = out.innerText;
    navigator.clipboard?.writeText(txt).then(() => {
      out.querySelector('#plan-copy').textContent = '✅ Copié !';
      setTimeout(() => out.querySelector('#plan-copy').textContent = '📋 Copier la checklist', 2000);
    });
  });
  out.querySelector('#plan-print').addEventListener('click', () => window.print());
}
