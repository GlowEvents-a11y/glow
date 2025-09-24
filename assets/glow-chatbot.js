// glow-chatbot.js
(() => {
  const API_URL = '/api/chat'; // Change if you deploy your endpoint elsewhere

  function el(tag, attrs={}, ...children){
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => {
      if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    children.forEach(c => typeof c === 'string' ? n.appendChild(document.createTextNode(c)) : c && n.appendChild(c));
    return n;
  }

  function addBubble(log, text, who){
    const b = el('div', { class: 'gc-bubble ' + (who==='user'?'gc-user':'gc-bot') }, text);
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }

  function init(){
    // Launcher
    const launcher = el('button', { id:'gc-launcher', title:'Chat with us' }, '💬');
    // Panel
    const panel = el('div', { id:'gc-panel' },
      el('div', { id:'gc-header' },
        el('div', { class:'title' }, 'Glow Assistant'),
        el('button', { class:'close', onclick: () => panel.style.display='none' }, '×')
      ),
      el('div', { id:'gc-log' }),
      el('div', { class:'gc-hint' }, 'Ask about services, pricing, availability, or custom quotes.'),
      el('form', { id:'gc-form' },
        el('input', { id:'gc-input', type:'text', placeholder:'Type your question…', autocomplete:'off' }),
        el('button', { id:'gc-send', type:'submit' }, 'Send')
      )
    );

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    launcher.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
    });

    const form = panel.querySelector('#gc-form');
    const input = panel.querySelector('#gc-input');
    const log = panel.querySelector('#gc-log');

    const greet = addBubble(log, "Hi! I'm the Glow Assistant. I can help with event ideas, pricing ranges, and availability. How can I help today?", 'bot');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if(!q) return;
      addBubble(log, q, 'user');
      input.value = '';
      const thinking = addBubble(log, 'Thinking…', 'bot');

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: q,
            sessionId: localStorage.getItem('gc_sess') || (() => {
              const s = crypto.randomUUID(); localStorage.setItem('gc_sess', s); return s;
            })()
          })
        });

        if(!res.ok){
          thinking.textContent = 'Sorry, I had trouble reaching our assistant. Please try again.';
          return;
        }
        const data = await res.json();
        thinking.textContent = data.reply || 'Sorry, I did not get a response.';
      } catch (err){
        thinking.textContent = 'Network error. Please try again.';
      }
      log.scrollTop = log.scrollHeight;
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
