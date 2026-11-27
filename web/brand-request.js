const product = document.querySelector('#product');
const draft = document.querySelector('#request-copy');
const email = document.querySelector('#email-request');
const feedback = document.querySelector('#copy-feedback');
function updateEmail() {
  email.href = 'mailto:?subject=' + encodeURIComponent('Ingredient label request') + '&body=' + encodeURIComponent(draft.value);
}
function personalize() {
  const item = product.value.trim() || 'your product';
  draft.value = `Hi! I’m wondering whether ${item} is made without dairy, eggs, honey, or the other ingredients listed at ${location.origin}/beyond. If you’ve checked the recipe and it fits, would you add “No Secretions” beside its name online or on the package? It would make it easier for me to spot when I shop. Thanks!`;
  updateEmail();
}
personalize();
product.addEventListener('input', personalize);
draft.addEventListener('input', updateEmail);
document.querySelector('#copy-request').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(draft.value);
    feedback.textContent = 'Copied. Paste your message into the brand’s contact form.';
  } catch {
    draft.focus();
    draft.select();
    feedback.textContent = 'Message selected. Use your device’s Copy command.';
  }
});
