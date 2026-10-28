function refreshPlanFlours() {
  const sel = document.getElementById('plan-farine');
  if (!sel || !BREAD_DATA) return;
  const prev = sel.value;
  sel.innerHTML = `<option value="tipo0">Tipo 0 (référence)</option>`
    + BREAD_DATA.farines.map(f => `<option value="${f.id}">${f.nom}${f.equivalentFrancais ? ' (' + f.equivalentFrancais + ')' : ''}</option>`).join('')
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
    `<option value="${f.id}">${f.nom}${f.equivalentFrancais ? ' (' + f.equivalentFrancais + ')' : ''}</option>`).join('');
  const scannedOptions = getScanned()
    .map((s, i) => `<option value="scan-${i}">📦 ${s.nom}${s.marque ? ' (' + s.marque + ')' : ''}</option>`)
    .join('');
  const demain = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

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

      <label for="plan-date">Quand souhaites-tu manger le pain ?</label>
      <input type="date" id="plan-date" value="${demain}" min="${new Date().toISOString().slice(0, 10)}">

      <label for="plan-heure">Heure du repas</label>
      <input type="time" id="plan-heure" value="19:00">

      <p>
        <input type="checkbox" id="plan-noix"> <label for="plan-noix" style="display:inline">Pain aux noix</label><br>
        <input type="checkbox" id="plan-mie"> <label for="plan-mie" style="display:inline">Pain de mie (mode moule)</label><br>
        <input type="checkbox" id="plan-congel"> <label for="plan-congel" style="display:inline">Congélation des tranches</label>
      </p>

      <button class="btn" id="plan-generate">Générer le plan</button>
    </div>

    <div id="plan-output"></div>
  `;

  el.querySelector('#plan-generate').addEventListener('click', () => {
    const farineId = el.querySelector('#plan-farine').value;
    const nPains = Number(el.querySelector('#plan-npains').value);
    const dateRepas = el.querySelector('#plan-date').value;
    const heureRepas = el.querySelector('#plan-heure').value;
    const noix = el.querySelector('#plan-noix').checked;
    const mie = el.querySelector('#plan-mie').checked;
    const congel = el.querySelector('#plan-congel').checked;
    generatePlan({ farineId, nPains, dateRepas, heureRepas, noix, mie, congel });
  });
}

// Quantités d'ingrédients par étape (recette de référence x nombre de pains)
function ingredientsEtape(etape, opts, farine) {
  const n = opts.nPains;
  const mult = n <= 1 ? 1 : n; // 1 pain = base ; 2-3 pains = recette "deux pains" x (n/2) arrondi
  const base = {
    'construction': [`${50 * n} g de levain mère`, `${150 * n} g de farine`, `${100 * n} g d'eau`],
    'autolyse': [
      `${350 * n} g de farine tipo 0${farine.nom.toLowerCase().includes('manitoba') ? ' → Manitoba' : ''}`,
      `${150 * n} g de farine complète`,
      `${(farine.nom.toLowerCase().includes('manitoba') ? 347 : 330) * n} g d'eau (66 %)`
    ],
    'petrissage': [`${150 * n} g de levain de production au pic`, `${10 * n} g de sel`],
    'noix': [`${(n > 1 ? 220 : 110) * 1} g de noix torréfiées et refroidies`],
    'pousse': [],
    'faconnage': ['Linge fariné ou banneton'],
    'frigo': [],
    'prechauffage': ['Cocotte en fonte', 'Disque de papier cuisson'],
    'enfournage': [],
    'refroidissement': []
  };
  return base[etape] || [];
}

function fakeAddReminder(date, title) {
  // Fonctionnalité "fake" : à terme, intégration à l'app Rappels du téléphone
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
  return `Rappel prévu pour le ${date.toLocaleString('fr-FR', options)} : « ${title} »`;
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

  const autolyseH = isManitoba ? 3 : (isComplete ? 1.5 : 1);
  const pousseMassMin = 180 + (isComplete ? 45 : 0) - (isManitoba ? 15 : 0);
  const picLevainH = isManitoba ? 4.5 : 5.5;
  const pousseFinaleMin = 18 * 60; // mode recommandé : pousse longue au frigo

  // Cible : date + heure du repas, cuisson finie 1 h avant (refroidissement)
  const [ch, cm] = opts.heureRepas.split(':').map(Number);
  const [yy, mm, dd] = opts.dateRepas.split('-').map(Number);
  const repas = new Date(yy, mm - 1, dd, ch, cm, 0);
  const refroidi = addMin(repas, -60); // pain tranché à l'heure du repas
  const enfournage = addMin(refroidi, -50); // 20 min couvert + 20-25 min découvert + marge
  const debutCuissonFour = addMin(enfournage, -30);
  const finFaconnage = addJ(addMin(debutCuissonFour, -pousseFinaleMin), -1); // façonnage la veille, frigo 18 h
  const debutPousseMasse = addMin(finFaconnage, -pousseMassMin);
  const finAutolyse = debutPousseMasse;
  const debutAutolyse = new Date(finAutolyse.getTime() - autolyseH * 3600000);
  const picLevain = debutPousseMasse;
  const constructionLevain = addMin(picLevain, -picLevainH * 60);

  const step = (date, title, techId, objectif, ings, sensoriel) => {
    const ingHtml = ings.length
      ? `<div class="step-ings"><strong>Ingrédients :</strong> ${ings.join(' • ')}</div>` : '';
    const techLink = techId
      ? `<span class="tech-link" data-tech="${techId}">🥣 Voir la technique : ${data.techniques.find(t => t.id === techId)?.nom || ''}</span>` : '';
    return `
    <div class="plan-step">
      <div class="step-time">${jourFr(date)} — ${fmtHm(date)}</div>
      <div class="step-title">${title}</div>
      <div class="objectif">${objectif}</div>
      ${ingHtml}
      ${sensoriel ? `<div class="sensoriel">🎯 ${sensoriel}</div>` : ''}
      ${techLink}
      <button class="reminder-btn" data-date="${date.toISOString()}" data-title="${title}">⏰ Ajouter aux Rappels du téléphone</button>
    </div>`;
  };

  let html = `
    <div class="card">
      <h3>Plan pour ${opts.nPains} pain${opts.nPains > 1 ? 's' : ''} — ${farine.nom}${farine.equivalentFrancais ? ' (' + farine.equivalentFrancais + ')' : ''}</h3>
      <p>Pain prêt à être tranché le <strong>${jourFr(repas)} à ${fmtHm(repas)}</strong> — pousse finale longue au frigo (zone de goût idéale 18-20 h), compatible avec une journée de travail 9h-18h.</p>
      ${isManitoba ? '<p class="sensoriel">Manitoba : eau 345-350 g (+5-8 %), autolyse longue, pic du levain plus tôt.</p>' : ''}
      ${isComplete ? '<p class="sensoriel">Farine avec complète : pousse en masse allongée, mie naturellement plus serrée.</p>' : ''}
      ${opts.noix ? '<p class="sensoriel">Noix : 100-120 g max pour 500 g de farine, torréfiées et refroidies, à incorporer au premier pliage — jamais au pétrissage.</p>' : ''}
      ${opts.mie ? '<p class="sensoriel">Pain de mie : 450 g farine (dont 100 g complète), 240 g eau, 120 g levain, 10 g sel, 40 g beurre ou huile, 20 g miel. Cuisson 200 °C moule, 35-40 min, couvercle retiré 5-8 dernières minutes, démoulage immédiat, tranchage le lendemain.</p>' : ''}
      ${opts.congel ? '<p class="sensoriel">Congélation : trancher et congeler dès le deuxième jour.</p>' : ''}
    </div>
  `;

  html += step(constructionLevain, '🫙 Construction du levain de production', 'autolyse',
    `${data.levain.production.ratios} — pic attendu vers ${fmtHm(picLevain)}. ${data.levain.production.pic}`,
    ingredientsEtape('construction', opts, farine),
    'Dôme bien bombé à son maximum = pic.');
  html += step(debutAutolyse, '💧 Autolyse', 'autolyse',
    'Farine + eau seuls, mélange sommaire. ' + (autolyseH >= 3 ? 'Autolyse longue (farine de force).' : `Durée : ${autolyseH} h.`),
    ingredientsEtape('autolyse', opts, farine),
    'La pâte se rassemble sans pétrissage.');
  html += step(debutPousseMasse, '👐 Pétrissage au pic du levain', 'petrissage',
    'Incorporation du levain en morceaux, étirement-repli 5 min, pause 5 min, puis sel.',
    ingredientsEtape('petrissage', opts, farine),
    'Test de la vitre : membrane translucide sans déchirure — arrêt immédiat. Trop pétri = pâte caoutchouc.');
  html += step(debutPousseMasse, '📈 Pousse en masse + pliages', 'pliage',
    `Environ ${Math.round(pousseMassMin / 60 * 10) / 10} h à température ambiante, un pliage par heure, mains mouillées, jamais de farine de correction.`,
    ingredientsEtape('pousse', opts, farine),
    '+50 à 75 % de gonflement. Le volume juge, pas l\'horloge.');
  if (opts.noix) {
    html += step(addMin(debutPousseMasse, 60), '🥜 Incorporation des noix', 'pliage',
      'Au premier pliage, 100-120 g max pour 500 g de farine, torréfiées et refroidies.',
      ingredientsEtape('noix', opts, farine),
      'Noix réparties sans écraser la pâte.');
  }
  html += step(finFaconnage, '🌀 Façonnage', 'faconnage',
    'Démoulage rapide (moins de 2 min sur le plan), boule bien tendue, mains en creux, cousure vers le haut dans un linge fariné ou banneton.',
    ingredientsEtape('faconnage', opts, farine),
    'Surface tendue sans déchirure.');
  html += step(finFaconnage, '❄️ Pousse finale au frigo', null,
    '12 à 24 h au frigo, zone idéale de goût vers 18-20 h.',
    ingredientsEtape('frigo', opts, farine),
    'La pâte se raffermi et se parfume.');
  html += step(debutCuissonFour, '🔥 Préchauffage du four', 'cuisson-cocotte',
    'Four 250 °C, grille médiane, cocotte vide 30 minutes. Disque de papier cuisson au fond.',
    ingredientsEtape('prechauffage', opts, farine),
    '');
  html += step(enfournage, '🥖 Enfournage et cuisson', 'cuisson-cocotte',
    'Pain froid, entailles franches. 20 min couvert, 20-25 min à découvert, dix dernières minutes pain sur la grille (hors cocotte).',
    ingredientsEtape('enfournage', opts, farine),
    'Croûte ambrée profonde, dessous non brûlé.');
  html += step(refroidi, '🌬️ Refroidissement', 'conservation',
    'Une heure sur grille avant de trancher.',
    ingredientsEtape('refroidissement', opts, farine),
    'Mie cuite à cœur, croûte croustillante.');

  html += `
    <div class="card">
      <button class="btn" id="plan-copy">📋 Copier la checklist</button>
      <button class="btn btn-secondary" id="plan-print">🖨️ Imprimer</button>
    </div>`;

  out.innerHTML = html;

  // Liens vers l'onglet Techniques
  out.querySelectorAll('.tech-link').forEach(l => {
    l.addEventListener('click', () => goToTechnique(l.dataset.tech));
  });

  // Boutons "Rappels" (fake v1 : simulation locale)
  out.querySelectorAll('.reminder-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = new Date(btn.dataset.date);
      const msg = fakeAddReminder(d, btn.dataset.title);
      btn.classList.add('added');
      btn.textContent = '✅ ' + msg;
    });
  });

  out.querySelector('#plan-copy').addEventListener('click', () => {
    const txt = out.innerText;
    navigator.clipboard?.writeText(txt).then(() => {
      out.querySelector('#plan-copy').textContent = '✅ Copié !';
      setTimeout(() => out.querySelector('#plan-copy').textContent = '📋 Copier la checklist', 2000);
    });
  });
  out.querySelector('#plan-print').addEventListener('click', () => window.print());
}
