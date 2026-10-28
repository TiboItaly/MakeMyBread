const TABS = [
  { id: 'levain', ico: '🫙', label: 'Levain' },
  { id: 'farine', ico: '🌾', label: 'Farine' },
  { id: 'plan', ico: '📋', label: 'Plan' },
  { id: 'savoir', ico: '📖', label: 'Recettes' }
];

function buildNav() {
  const nav = document.createElement('nav');
  nav.className = 'tab-nav';
  nav.setAttribute('role', 'tablist');
  nav.innerHTML = TABS.map(t =>
    `<button role="tab" data-tab="${t.id}" aria-controls="tab-${t.id}" class="${t.id === 'levain' ? 'active' : ''}">
      <span class="nav-ico">${t.ico}</span>${t.label}
    </button>`).join('');
  document.body.appendChild(nav);

  nav.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      window.scrollTo({ top: 0 });
    });
  });
}

async function main() {
  await loadData();
  buildNav();
  renderLevain(BREAD_DATA);
  renderFarine(BREAD_DATA);
  renderPlan(BREAD_DATA);
  renderSavoir(BREAD_DATA);
  initChat();
}

main();
