function renderSavoir(data) {
  const el = document.getElementById('savoir-content');
  const d = data.declinaisons;

  el.innerHTML = `
    <h2>Recettes &amp; savoir</h2>

    <div class="card">
      <h3>Recette de référence — ${data.recetteReference.nom}</h3>
      <ul>${data.recetteReference.ingredients.map(i => `<li>${i.quantite} — ${i.nom}</li>`).join('')}</ul>
    </div>

    <div class="card">
      <h3>Processus validé</h3>
      ${data.processus.map(p => `
        <p><strong>${p.etape}</strong> (${p.dureeHeures[0] === p.dureeHeures[1] ? p.dureeHeures[0] + ' h' : p.dureeHeures[0] + '-' + p.dureeHeures[1] + ' h'})</p>
        <p>${p.objectif}</p>
        <p class="sensoriel">🎯 ${p.sensoriel}</p>
      `).join('')}
    </div>

    <div class="card">
      <h3>Leçons apprises</h3>
      <ul>${data.lecons.map(l => `<li>${l}</li>`).join('')}</ul>
    </div>

    <div class="card">
      <h3>Déclinaisons</h3>
      <p><strong>Pain de mie au levain :</strong> ${d.painDeMie.ingredients}. ${d.painDeMie.cuisson}</p>
      <p><strong>Deux pains d'un coup :</strong> ${d.deuxPains.ingredients}. ${d.deuxPains.cuisson}</p>
      <p><strong>Cuisson au feu de bois :</strong> ${d.feuDeBois.conditions} ${d.feuDeBois.cuisson}</p>
      <p><strong>Pain aux noix :</strong> ${d.noix}</p>
    </div>

    <div class="card" id="recette-panzanella">
      <h3>Salade de pain rassis : Panzanella</h3>
      <p>${d.panzanella.recette}</p>
      <p><strong>Préparation :</strong> ${d.panzanella.preparation}</p>
    </div>
  `;
}
