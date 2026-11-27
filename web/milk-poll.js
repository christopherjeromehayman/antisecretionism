const form = document.querySelector('#milk-form');
const milk = document.querySelector('#milk');
const button = form.querySelector('button');
const status = document.querySelector('#vote-status');
let signedIn;
async function refresh(init) {
  const response = await fetch('/api/milk-poll', init);
  if (!response.ok) throw Error('Voting is temporarily unavailable. Please try again.');
  const state = await response.json();
  signedIn = state.signedIn;
  milk.value = state.mine || '';
  button.textContent = state.mine ? 'Update my vote' : 'Cast my vote';
  const options = Array.from(milk.options).filter(option => option.value);
  const results = options.sort((a,b) => (state.counts[b.value] || 0) - (state.counts[a.value] || 0));
  document.querySelector('#milk-results').replaceChildren(...results.map(option => {
    const item = document.createElement('li');
    const count = state.counts[option.value] || 0;
    item.textContent = option.text + ' — ' + count + (count === 1 ? ' vote' : ' votes');
    return item;
  }));
  button.disabled = false;
}
refresh().catch(error => { status.textContent = error.message; });
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!signedIn) {
    location.href = '/signin-with-chatgpt?return_to=' + encodeURIComponent(location.pathname + '#milk-poll');
    return;
  }
  button.disabled = true;
  try {
    await refresh({method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({kind:milk.value})});
    status.textContent = 'Your vote is counted.';
  } catch (error) {
    button.disabled = false;
    status.textContent = error.message;
  }
});
