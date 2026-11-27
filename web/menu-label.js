const details = document.getElementById('manual-code');

for (const button of document.querySelectorAll('[data-copy]')) {
  button.hidden = false;
  button.addEventListener('click', async () => {
    const field = document.getElementById(button.dataset.copy);
    const isEmbed = field.id === 'badge-html';
    const feedback = document.getElementById(isEmbed ? 'badge-feedback' : 'link-feedback');

    try {
      await navigator.clipboard.writeText(field.value);
    } catch {
      details.open = true;
      field.focus();
      field.select();
      feedback.textContent = isEmbed
        ? 'The code is selected. Use your device’s Copy command.'
        : 'The link is selected. Use your device’s Copy command.';
      return;
    }

    feedback.textContent = isEmbed ? 'Badge code copied. Paste it into an HTML block on your site.' : 'Link copied.';
    if (isEmbed) {
      import('/reach.js').then(({ track }) => track('badge_code_copied')).catch(() => {});
    }
  });
}
