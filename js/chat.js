const chatState = { history: [], mode: 'chat' };
const CHAT_ENDPOINT = 'https://make-my-bread.supabase.co/functions/v1/chat';

function getCurrentPlanContext() {
  try {
    const out = document.getElementById('plan-output');
    if (!out || !out.innerText.trim()) return '(aucun plan généré)';
    return out.innerText.slice(0, 2000);
  } catch { return '(aucun plan généré)'; }
}

function initChat() {
  const fab = document.getElementById('chat-fab');
  const panel = document.getElementById('chat-panel');
  const log = document.getElementById('chat-log');
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');

  fab.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden && !panel.classList.contains('collapsed')) input.focus();
  });
  document.getElementById('chat-close').addEventListener('click', () => panel.hidden = true);

  const toggleBtn = document.getElementById('chat-toggle');
  toggleBtn.addEventListener('click', () => {
    panel.classList.toggle('collapsed');
    toggleBtn.textContent = panel.classList.contains('collapsed') ? '+' : '–';
    toggleBtn.setAttribute('aria-label', panel.classList.contains('collapsed') ? 'Agrandir' : 'Réduire');
    if (!panel.classList.contains('collapsed')) input.focus();
  });

  const addMsg = (text, who) => {
    const div = document.createElement('div');
    div.className = 'msg ' + who;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  };

  addMsg('Bonjour ! Je suis l\'assistant pain. Posez votre question, ou envoyez une photo avec 📷 Diagnostic (levain, pâte, mie).');

  const fileToBase64 = file => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  async function sendMsg(extraContent) {
    let text = input.value.trim();
    if (extraContent) {
      text = text || (chatState.mode === 'diagnostic' ? 'Voici la photo, quel est ton diagnostic ?' : '');
    }
    if (!text && !extraContent) return;

    if (text) addMsg(text, 'user');
    input.value = '';

    const userMsg = { role: 'user', content: [] };
    const parts = [];
    if (extraContent) parts.push(extraContent);
    if (text) parts.push({ type: 'text', text });
    userMsg.content = parts;
    chatState.history.push(userMsg);

    const typing = document.createElement('div');
    typing.className = 'msg bot';
    typing.textContent = '…';
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;

    const contexte = chatState.mode === 'chat'
      ? `Contexte du site (méthode validée) : recette de référence ${BREAD_DATA.recetteReference.nom} ; leçons apprises : ${BREAD_DATA.lecons.join(' | ')}. Plan en cours de l'utilisateur : ${getCurrentPlanContext()}`
      : '';

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: chatState.mode,
          messages: [
            ...(contexte ? [{ role: 'system', content: contexte }] : []),
            ...chatState.history.slice(-10)
          ]
        })
      });
      if (!res.ok) throw new Error('backend');
      const j = await res.json();
      const reply = j.reply || '(réponse vide)';
      typing.textContent = reply;
      chatState.history.push({ role: 'assistant', content: reply });
      saveFournneeMemory(chatState.mode, text, reply);
    } catch (e) {
      typing.textContent = 'Assistant non connecté : déployez la fonction Supabase chat avec MISTRAL_API_KEY (voir README). En attendant, l\'onglet Levain a un diagnostic interactif et l\'onglet Recettes contient toute la méthode.';
      chatState.history.push({ role: 'assistant', content: '(hors ligne)' });
    }
  }

  send.addEventListener('click', () => sendMsg());
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMsg();
  });

  // Mode Diagnostic photo
  const diagBtn = document.createElement('button');
  diagBtn.className = 'btn btn-secondary';
  diagBtn.style.cssText = 'margin:8px; min-height:40px; padding:4px 12px; font-size:0.85rem';
  diagBtn.textContent = '📷 Diagnostic photo';
  diagBtn.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'environment';
    fileInput.onchange = async () => {
      const file = fileInput.files[0];
      if (!file) return;
      const b64 = await fileToBase64(file);
      chatState.mode = 'diagnostic';
      addMsg('📷 (photo envoyée pour diagnostic)', 'user');
      await sendMsg({ type: 'image_url', image_url: b64 });
      chatState.mode = 'chat';
    };
    fileInput.click();
  });
  log.before ? log.parentNode.insertBefore(diagBtn, log) : panel.appendChild(diagBtn);
}

// Mémoire des fournées (structure v2 — cible coaching multi-fournées)
const MEMORY_KEY = 'mmb_memory';
function saveFournneeMemory(mode, question, answer) {
  try {
    const mem = JSON.parse(localStorage.getItem(MEMORY_KEY) || '{"fournees":[]}');
    mem.fournees.push({
      date: new Date().toISOString(),
      mode,
      question: (question || '').slice(0, 200),
      answer: (answer || '').slice(0, 600),
      plan: getCurrentPlanContext().slice(0, 500)
    });
    localStorage.setItem(MEMORY_KEY, JSON.stringify(mem));
  } catch {}
}
