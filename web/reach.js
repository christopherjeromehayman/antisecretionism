const optedOut = navigator.globalPrivacyControl === true ||
  ['1', 'yes'].includes(navigator.doNotTrack) || window.doNotTrack === '1';

export function track(event) {
  if (optedOut) return;
  // Delivery is best effort so analytics never interrupt a visitor's action.
  fetch('/api/reach', {
    method: 'POST',
    credentials: 'omit',
    referrerPolicy: 'origin',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event })
  }).catch(() => {});
}

function countLanding() {
  const url = new URL(location.href);
  const ref = url.searchParams.get('ref');
  const event = ref === 'share' ? 'share_referral' :
    ref === 'menu-badge' && ['/menu-label', '/menu-label.html'].includes(url.pathname) ? 'badge_referral' : null;
  if (!event || ['reload', 'back_forward'].includes(performance.getEntriesByType('navigation')[0]?.type)) return;

  function whenVisible() {
    if (document.visibilityState !== 'visible') return;
    document.removeEventListener('visibilitychange', whenVisible);
    track(event);
  }
  document.addEventListener('visibilitychange', whenVisible);
  whenVisible();
}

function observeIntroduction(intro) {
  let inView = false;
  let timer;
  function update() {
    if (!inView || document.visibilityState !== 'visible') {
      clearTimeout(timer);
      timer = undefined;
      return;
    }
    if (timer === undefined) timer = setTimeout(countView, 2000);
  }
  function updateIntersection(entries) {
    for (const entry of entries) {
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      update();
    }
  }
  function countView() {
    const pending = observer.takeRecords();
    if (pending.length) {
      timer = undefined;
      updateIntersection(pending);
      return;
    }
    if (!inView || document.visibilityState !== 'visible') return;
    observer.disconnect();
    document.removeEventListener('visibilitychange', update);
    track('intro_view');
  }
  const observer = new IntersectionObserver(updateIntersection, { threshold: 0.5 });
  document.addEventListener('visibilitychange', update);
  observer.observe(intro);
}

function enableSharing(tools) {
  const url = new URL(tools.dataset.sharePath || '/', 'https://antisecretionist.com');
  url.searchParams.set('ref', 'share');
  const copy = tools.querySelector('[data-copy-share]');
  const native = tools.querySelector('[data-native-share]');
  const fallback = tools.querySelector('[data-share-fallback]');
  const status = tools.querySelector('[data-share-status]');

  function selectLink() {
    fallback.value = url.href;
    fallback.hidden = false;
    fallback.focus();
    fallback.select();
    status.textContent = 'Use your device’s Copy command to copy the selected link.';
  }

  copy.hidden = false;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url.href);
      fallback.hidden = true;
      status.textContent = 'Link copied.';
      track('share_link_copied');
    } catch {
      selectLink();
    }
  });

  if (typeof navigator.share === 'function') {
    native.hidden = false;
    native.addEventListener('click', async () => {
      status.textContent = '';
      try {
        await navigator.share({ title: 'Anti-Secretionist', url: url.href });
        fallback.hidden = true;
        status.textContent = 'Share dialog completed.';
        track('share_sheet_completed');
      } catch (error) {
        if (error.name !== 'AbortError') selectLink();
      }
    });
  }
}

if (!optedOut) {
  countLanding();
  const intro = document.querySelector('[data-movement-intro]');
  if (intro && 'IntersectionObserver' in window) observeIntroduction(intro);
}
document.querySelectorAll('[data-share-tools]').forEach(enableSharing);
