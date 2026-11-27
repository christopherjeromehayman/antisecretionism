const petition = 'petition-platform-label';
const storageKey = 'petition-signature-id';
const buttons = [...document.querySelectorAll('[data-choice]')];
const petitionPage = buttons.some(button => button.dataset.choice === petition);
const message = document.getElementById('support-status');
let browserId;
let busy = false;

function readBrowserId() {
  try {
    const id = localStorage.getItem(storageKey);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || '')) return id;
  } catch { /* This page can still sign when persistent storage is unavailable. */ }
  return browserId;
}

function getOrCreateBrowserId() {
  browserId = readBrowserId();
  if (!browserId) {
    browserId = crypto.randomUUID();
    try { localStorage.setItem(storageKey, browserId); } catch { /* Keep the key in memory for retries. */ }
  }
  return browserId;
}

async function request(choice) {
  const headers = {};
  if (petitionPage) {
    const id = choice === petition
      ? await (navigator.locks ? navigator.locks.request(storageKey, getOrCreateBrowserId) : getOrCreateBrowserId())
      : readBrowserId();
    if (id) headers['X-Petition-Browser'] = id;
  }
  const init = { headers, cache: 'no-store' };
  if (choice) {
    init.method = 'POST';
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify({ choice });
  }
  const response = await fetch('/api/support', init);
  if (!response.ok) throw new Error('We couldn’t reach the signup service. Please try again.');
  return response.json();
}

function render(state) {
  const count = document.getElementById('count');
  if (count) count.textContent = state.total + (state.total === 1 ? ' signature' : ' signatures');
  for (const button of buttons) {
    const choice = button.dataset.choice;
    const recorded = state.choices.includes(choice);
    button.disabled = busy || recorded;
    if (recorded) button.textContent = choice === petition ? 'You signed' : 'Interest recorded';
  }
}

let ready = request().then(state => {
  render(state);
  return state;
}).catch(error => {
  message.textContent = error.message;
  return null;
});

for (const button of buttons) button.addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  for (const control of buttons) control.disabled = true;
  const choice = button.dataset.choice;
  let state;
  try {
    state = await ready;
    if (choice !== petition) {
      state = state || await request();
      if (!state.signedIn) {
        window.top.location.href = '/signin-with-chatgpt?return_to=' + encodeURIComponent(location.pathname + location.hash);
        return;
      }
    }
    state = await request(choice);
    ready = Promise.resolve(state);
    message.textContent = choice === petition ? 'Your signature is counted. Thank you.' : 'Your interest is recorded. No order or payment was taken.';
  } catch (error) {
    message.textContent = error.message;
  } finally {
    busy = false;
    if (state) render(state);
    else for (const control of buttons) control.disabled = false;
  }
});
