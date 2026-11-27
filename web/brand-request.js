const product = document.querySelector('#product');
const draft = document.querySelector('#request-copy');
const email = document.querySelector('#email-request');
const feedback = document.querySelector('#copy-feedback');
function updateEmail() {
  email.href = 'mailto:?subject=' + encodeURIComponent('Ingredient label request') + '&body=' + encodeURIComponent(draft.value);
}
function personalize() {
  const item = product.value.trim() || 'your product';
  draft.value = `Hello, I’d love to know whether ${item} meets the anti-secretionist ingredient standard. I eat meat and plants and skip eggs, dairy, honey, and the other ingredients listed at ${location.origin}/retail. Would you review the recipe and, if it qualifies, consider adding “Anti-secretionist” to the packaging and online listing? That would help shoppers like me find it, buy it, and recommend it. Thank you!`;
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
