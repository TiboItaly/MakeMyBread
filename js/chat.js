const chatState = { history: [] };

function initChat() {
  const fab = document.getElementById('chat-fab');
  const panel = document.getElementById('chat-panel');
  const log = document.getElementById('chat-log');
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');

  fab.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) input.focus();
  });
  document.getElementById('chat-close').addEventListener('click', () => panel.hidden = true);

  const addMsg = (text, who) => {
    const div = document.createElement('div');
    div.className = 'msg ' + who;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  };

  addMsg('Bonjour ! Je suis l\'assistant pain. Posez votre question : dépannage de fournée, variantes, conservation, coût…');

  async function sendMsg() {
    const text = input.value.trim();
    if (!text) return;
    addMsg(text, 'user');
    input.value = '';
    chatState.history.push({ role: 'user', content: text });

    const typing = document.createElement('div');
    typing.className = 'msg bot';
    typing.textContent = '…';
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;

    const contexte = BREAD_DATA
      ? `Contexte du site (méthode validée) : recette de référence ${BREAD_DATA.recetteReference.nom} ; leçons apprises : ${BREAD_DATA.lecons.join(' | ')}`
      : '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'system', content: 'Tu es un assistant expert en pain au levain. Réponds en français, de façon concrète et brève. ' + contexte }, ...chatState.history.slice(-10)]
        })
      });
      if (!res.ok) throw new Error('backend');
      const j = await res.json();
      const reply = j.reply || '(réponse vide)';
      typing.textContent = reply;
      chatState.history.push({ role: 'assistant', content: reply });
    } catch (e) {
      typing.textContent = 'Assistant non connecté : configurez le backend Mistral (clé API côté serveur uniquement). En attendant, consultez les onglets Levain (diagnostic), Farine et Recettes & savoir.';
      chatState.history.push({ role: 'assistant', content: '(hors ligne)' });
    }
  }

  send.addEventListener('click', sendMsg);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMsg();
  });
}
