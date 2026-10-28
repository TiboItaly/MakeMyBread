function renderTechniques(data) {
  const el = document.getElementById('techniques-content');
  el.innerHTML = `
    <h2>Techniques</h2>
    <p>Les gestes clés, étape par étape. L'icône 📱 à côté de chaque titre ouvre un reel Instagram demonstrating la technique.</p>
    ${data.techniques.map(t => `
      <div class="card technique-card" id="tech-${t.id}">
        <h3>${t.nom}
          <a class="reel-link" href="${t.reel}" target="_blank" rel="noopener" aria-label="Voir le reel Instagram : ${t.nom}">📱</a>
        </h3>
        <ul>${t.astuces.map(a => `<li>${a}</li>`).join('')}</ul>
      </div>
    `).join('')}
  `;
}

function goToTechnique(techId) {
  const navBtn = document.querySelector(`.tab-nav button[data-tab="techniques"]`);
  if (navBtn) navBtn.click();
  setTimeout(() => {
    const target = document.getElementById('tech-' + techId);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 60);
}
