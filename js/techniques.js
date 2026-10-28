function renderTechniques(data) {
  const el = document.getElementById('techniques-content');
  el.innerHTML = `
    <h2>Techniques</h2>
    <p>Les gestes clés, étape par étape. L'icône 📱 à côté de chaque titre ouvre un reel Instagram qui montre la technique en vidéo.</p>
    ${data.techniques.map(t => {
      const extra = t.id === 'conservation'
        ? `<p><span class="tech-link" data-goto="panzanella">🥗 Voir la recette complète de la Panzanella dans l'onglet Recettes</span></p>`
        : '';
      return `
      <div class="card technique-card" id="tech-${t.id}">
        <h3>${t.nom}
          <a class="reel-link" href="${t.reel}" target="_blank" rel="noopener" aria-label="Voir le reel Instagram : ${t.nom}">📱</a>
        </h3>
        <ul>${t.astuces.map(a => `<li>${a}</li>`).join('')}</ul>
        ${extra}
      </div>`;
    }).join('')}
    
  `;
}

function initTechniqueLinks() {
  document.querySelectorAll('[data-goto="panzanella"]').forEach(l => {
    l.addEventListener('click', () => {
      const navBtn = document.querySelector(`.tab-nav button[data-tab="savoir"]`);
      if (navBtn) navBtn.click();
      setTimeout(() => {
        const target = document.getElementById('recette-panzanella');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    });
  });
}

function goToTechnique(techId) {
  const navBtn = document.querySelector(`.tab-nav button[data-tab="techniques"]`);
  if (navBtn) navBtn.click();
  setTimeout(() => {
    const target = document.getElementById('tech-' + techId);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 60);
}
