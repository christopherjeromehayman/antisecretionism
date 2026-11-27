async function showActivity() {
  const list = document.getElementById('activity-list');
  const status = document.getElementById('activity-status');
  try {
    const response = await fetch('/api/reach', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Activity is unavailable');
    const { counts } = await response.json();
    const fields = list.querySelectorAll('[data-count]');
    const format = new Intl.NumberFormat('en');
    for (const field of fields) {
      const count = counts?.[field.dataset.count];
      if (!Number.isSafeInteger(count) || count < 0) throw new Error('Activity total is unavailable');
      field.textContent = format.format(count);
    }
    list.hidden = false;
  } catch {
    status.textContent = 'Activity totals are temporarily unavailable.';
    status.hidden = false;
  }
}

showActivity();
