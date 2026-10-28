const SCAN_KEY = 'mmb_scanned_flours';

function getScanned() {
  try { return JSON.parse(localStorage.getItem(SCAN_KEY) || '[]'); }
  catch { return []; }
}
function saveScanned(items) { localStorage.setItem(SCAN_KEY, JSON.stringify(items)); }

function lookupBarcode(code) {
  return fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,nutriments,ingredients_text,countries`)
    .then(r => r.json())
    .then(j => {
      if (j.status !== 1) return null;
      const p = j.product || {};
      return {
        code,
        nom: p.product_name || '(nom inconnu)',
        marque: p.brands || '',
        proteines: p.nutriments?.proteins_100g ?? null,
        fibres: p.nutriments?.fiber_100g ?? null,
        cendres: null,
        humidite: null,
        energie: p.nutriments?.['energy-kcal_100g'] ?? null,
        glucides: p.nutriments?.carbohydrates_100g ?? null,
        sucres: p.nutriments?.sugars_100g ?? null,
        lipides: p.nutriments?.fat_100g ?? null,
        sel: p.nutriments?.salt_100g ?? null,
        type: ''
      };
    })
    .catch(() => null);
}

function scannedCardHtml(s, idx) {
  const n = (v, u) => v === null || v === undefined ? '' : `${v} ${u || ''}`;
  return `<div class="card">
    <h3>${s.nom} <span class="farine-badge">scanné</span></h3>
    <p>Code-barres : ${s.code}${s.marque ? ' — Marque : ' + s.marque : ''}</p>
    <label for="scan-type-${idx}">Type de farine :</label>
    <select id="scan-type-${idx}" data-idx="${idx}">
      <option value="">— à définir —</option>
      ${BREAD_DATA.farines.map(f => `<option value="${f.id}" ${s.type === f.id ? 'selected' : ''}>${f.nom}</option>`).join('')}
    </select>
    <dl class="farine-kv">
      ${s.proteines !== null ? `<dt>Protéines</dt><dd>${n(s.proteines, 'g / 100 g')}</dd>` : ''}
      ${s.fibres !== null ? `<dt>Fibres</dt><dd>${n(s.fibres, 'g / 100 g')}</dd>` : ''}
      ${s.energie !== null ? `<dt>Énergie</dt><dd>${n(s.energie, 'kcal / 100 g')}</dd>` : ''}
      ${s.glucides !== null ? `<dt>Glucides</dt><dd>${n(s.glucides, 'g / 100 g')}</dd>` : ''}
      ${s.sucres !== null ? `<dt>Sucres</dt><dd>${n(s.sucres, 'g / 100 g')}</dd>` : ''}
      ${s.lipides !== null ? `<dt>Lipides</dt><dd>${n(s.lipides, 'g / 100 g')}</dd>` : ''}
      ${s.sel !== null ? `<dt>Sel</dt><dd>${n(s.sel, 'g / 100 g')}</dd>` : ''}
    </dl>
    <button class="btn" style="background:var(--danger)" data-del="${idx}">Supprimer</button>
  </div>`;
}

function renderFarine(data) {
  const el = document.getElementById('farine-content');
  const farines = data.farines.map(f => `
    <div class="card farine-card">
      <h3>${f.nom} <span class="farine-badge">${f.type}</span></h3>
      <dl class="farine-kv">
        <dt>Équivalent français</dt><dd>${f.equivalentFrancais || '—'}</dd>
        <dt>Force</dt><dd>${f.force}</dd>
        <dt>Absorption d'eau</dt><dd>${f.absorption}</dd>
        <dt>Comportement</dt><dd>${f.comportement}</dd>
        <dt>Avantages</dt><dd>${f.avantages}</dd>
        <dt>Difficultés</dt><dd>${f.difficultes}</dd>
        <dt>Usage recommandé</dt><dd>${f.usage}</dd>
        <dt>Impact sur le plan</dt><dd>${f.impactPlan}</dd>
      </dl>
    </div>
  `).join('');

  el.innerHTML = `
    <h2>Farines</h2>

    <div class="card">
      <h3>Vue comparative</h3>
      <div style="overflow-x:auto">
        <table class="compare">
          <tr><th>Farine</th><th>Équivalent FR</th><th>Force</th><th>Absorption</th><th>Usage</th></tr>
          ${data.farines.map(f => `<tr><td>${f.nom}</td><td>${f.equivalentFrancais || '—'}</td><td>${f.force}</td><td>${f.absorption}</td><td>${f.usage}</td></tr>`).join('')}
        </table>
      </div>
    </div>

    <div class="farine-grid">${farines}</div>

    <div class="card">
      <h3>Composition de l'eau</h3>
      <ul>${data.eau.parametres.map(p => `<li>${p}</li>`).join('')}</ul>
      <p><strong>Test maison :</strong> ${data.eau.test}</p>
    </div>

    <div class="card">
      <h3>Scanner un produit (Open Food Facts)</h3>
      <p>Saisissez ou scannez (appareil photo) le code-barres d'un paquet de farine pour pré-remplir sa composition. Les fiches sont conservées localement et consultables dans le Plan.</p>
      <label for="barcode-input">Code-barres</label>
      <input type="text" id="barcode-input" inputmode="numeric" pattern="[0-9]*" placeholder="Ex. 8013114000134">
      <button class="btn" id="barcode-lookup">Rechercher</button>
      <button class="btn btn-secondary" id="barcode-manual">Ajout manuel</button>
      <p class="chat-notice" id="barcode-status"></p>
      <div id="scanned-list"></div>
    </div>
  `;

  const scannedList = el.querySelector('#scanned-list');
  const refreshScanned = () => {
    const items = getScanned();
    scannedList.innerHTML = items.length
      ? `<h3>Produits scannés</h3>` + items.map(scannedCardHtml).join('')
      : '';
    scannedList.querySelectorAll('select[data-idx]').forEach(sel => {
      sel.addEventListener('change', () => {
        const items = getScanned();
        items[Number(sel.dataset.idx)].type = sel.value;
        saveScanned(items);
        if (typeof refreshPlanFlours === 'function') refreshPlanFlours();
      });
    });
    scannedList.querySelectorAll('button[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const items = getScanned();
        items.splice(Number(btn.dataset.del), 1);
        saveScanned(items);
        refreshScanned();
        if (typeof refreshPlanFlours === 'function') refreshPlanFlours();
      });
    });
  };
  refreshScanned();

  const status = el.querySelector('#barcode-status');
  el.querySelector('#barcode-lookup').addEventListener('click', async () => {
    const code = el.querySelector('#barcode-input').value.trim();
    if (!code) { status.textContent = 'Entrez un code-barres.'; return; }
    status.textContent = 'Recherche en cours…';
    const p = await lookupBarcode(code);
    if (!p) { status.textContent = 'Produit introuvable dans la base. Utilisez l\'ajout manuel.'; return; }
    const items = getScanned();
    items.push(p);
    saveScanned(items);
    status.textContent = `Fiche ajoutée : ${p.nom}.`;
    el.querySelector('#barcode-input').value = '';
    refreshScanned();
    if (typeof refreshPlanFlours === 'function') refreshPlanFlours();
  });

  el.querySelector('#barcode-manual').addEventListener('click', () => {
    const code = el.querySelector('#barcode-input').value.trim() || 'manuel-' + Date.now();
    const items = getScanned();
    items.push({ code, nom: 'Saisie manuelle', marque: '', proteines: null, fibres: null, energie: null, glucides: null, sucres: null, lipides: null, sel: null, type: '' });
    saveScanned(items);
    status.textContent = 'Fiche manuelle créée — complétez les valeurs sur l\'étiquette.';
    el.querySelector('#barcode-input').value = '';
    refreshScanned();
  });
}
