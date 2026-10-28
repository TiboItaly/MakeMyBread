function renderTechniques(data) {
  const el = document.getElementById('techniques-content');
  el.innerHTML = `
    <h2>Techniques</h2>
    <p>Les gestes clés, étape par étape. L'icône 📱 à côté de chaque titre ouvre un reel Instagram qui montre la technique en vidéo.</p>
    ${data.techniques.map(t => {
      const extra = t.id === 'conservation'
        ? ''
        : '';
      const astucesHtml = t.astuces.map(a => {
        if (t.id !== 'conservation' || !a.includes('panzanella')) return `<li>${a}</li>`;
        return `<li>${a
          .replace('panzanella', '<span class="tech-link" data-goto="panzanella" style="font-weight:normal">panzanella</span>')
          .replace('pain perdu', '<span class="tech-link" data-goto="pain-perdu" style="font-weight:normal">pain perdu</span>')}</li>`;
      }).join('');
      return `
      <div class="card technique-card" id="tech-${t.id}">
        <h3>${t.nom}
          <a class="reel-link" href="${t.reel}" target="_blank" rel="noopener" aria-label="Voir le reel Instagram : ${t.nom}">📱</a>
        </h3>
        <ul>${astucesHtml}</ul>
        ${extra}
      </div>`;
    }).join('')}
    
  `;
}

function initTechniqueLinks() {
  const goToRecette = id => {
    const navBtn = document.querySelector(`.tab-nav button[data-tab="savoir"]`);
    if (navBtn) navBtn.click();
    setTimeout(() => {
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };
  document.querySelectorAll('[data-goto="panzanella"]').forEach(l =>
    l.addEventListener('click', () => goToRecette('recette-panzanella')));
  document.querySelectorAll('[data-goto="pain-perdu"]').forEach(l =>
    l.addEventListener('click', () => goToRecette('recette-pain-perdu')));
}

function goToTechnique(techId) {
  const navBtn = document.querySelector(`.tab-nav button[data-tab="techniques"]`);
  if (navBtn) navBtn.click();
  setTimeout(() => {
    const target = document.getElementById('tech-' + techId);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 60);
}
