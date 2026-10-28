function renderLevain(data) {
  const el = document.getElementById('levain-content');
  const d = data.levain;
  const diagnostics = d.diagnostics.map(diag =>
    `<button class="diag-btn" data-diag="${diag.id}">Mon levain : ${diag.symptome.toLowerCase()}</button>`
  ).join('');

  el.innerHTML = `
    <h2>Levain</h2>

    <div class="card">
      <h3>Créer un levain mère de zéro</h3>
      <ul>
        ${d.creation.map(e => `<li>${e}</li>`).join('')}
      </ul>
    </div>

    <div class="card">
      <h3>Entretien hebdomadaire</h3>
      <ul>
        ${d.entretien.map(e => `<li>${e}</li>`).join('')}
      </ul>
    </div>

    <div class="card">
      <h3>Levain de production</h3>
      <p><strong>Ratios :</strong> ${d.production.ratios}</p>
      <p><strong>Pic :</strong> ${d.production.pic}</p>
      <p><strong>Règle générale :</strong> ${d.production.regle}</p>
      <p><strong>Variante directe (mère froide) :</strong> ${d.production.directFroid}</p>
      <p><strong>Variante Manitoba :</strong> ${d.production.manitoba}</p>
    </div>

    <div class="card">
      <h3>Diagnostic interactif</h3>
      <p>Sélectionnez le symptôme observé :</p>
      ${diagnostics}
      <div id="diag-result" class="diag-result" hidden></div>
    </div>
  `;

  el.querySelectorAll('.diag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const diag = d.diagnostics.find(x => x.id === btn.dataset.diag);
      const out = document.getElementById('diag-result');
      out.hidden = false;
      out.innerHTML = `<strong>${diag.symptome}</strong><br>${diag.correctif}`;
    });
  });
}
