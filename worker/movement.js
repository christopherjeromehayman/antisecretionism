const movementFeedUrl = 'https://raw.githubusercontent.com/christopherjeromehayman/antisecretionism/main/web/movement-links.json';
const movementPlatforms = new Map([
  ['news', 'News'], ['reddit', 'Reddit'], ['facebook', 'Facebook'],
  ['instagram', 'Instagram'], ['business', 'Business website']
]);
const movementOrigins = ['community', 'business', 'independent'];
const movementDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
});
let recentMovementItems;
let nextMovementCheck = 0;

function movementText(value, limit) {
  if (typeof value !== 'string' || value.length > limit) return '';
  return value.trim();
}

function movementItems(feed) {
  if (feed?.version !== 1 || !Array.isArray(feed.items)) {
    throw new Error('Invalid movement feed');
  }
  const items = [];
  const seen = new Set();
  for (const entry of feed.items) {
    if (!entry || !movementOrigins.includes(entry.origin) || !movementPlatforms.has(entry.kind)) continue;
    const title = movementText(entry.title, 320);
    const source = movementText(entry.source, 160);
    const published = movementText(entry.published, 10);
    if (!title || !source || !/^\d{4}-\d{2}-\d{2}$/.test(published)) continue;
    const date = new Date(published + 'T00:00:00Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== published) continue;
    let link;
    try { link = new URL(movementText(entry.url, 2000)); } catch { continue; }
    if (link.protocol !== 'https:' || link.username || link.password || link.port) continue;
    link.hash = '';
    for (const key of [...link.searchParams.keys()]) {
      if (/^(utm_|fbclid$|igsh$)/i.test(key)) link.searchParams.delete(key);
    }
    link.searchParams.sort();
    const key = link.href.replace(/\/$/, '');
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ title, source, published, url: link.href, date,
      kind: entry.kind, origin: entry.origin, summary: movementText(entry.summary, 600) });
  }
  if (feed.items.length && !items.length) throw new Error('No valid movement items');
  return items.sort((a, b) => b.date - a.date);
}

async function loadMovementItems() {
  if (Date.now() < nextMovementCheck) return recentMovementItems;
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 1600);
  try {
    const response = await fetch(movementFeedUrl, {
      signal: abort.signal, redirect: 'error', headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('Movement feed unavailable');
    const limit = 8 * 1024 * 1024;
    if (Number(response.headers.get('content-length')) > limit) throw new Error('Movement feed too large');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let size = 0;
    let data = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        abort.abort();
        throw new Error('Movement feed too large');
      }
      data += decoder.decode(value, { stream: true });
    }
    recentMovementItems = movementItems(JSON.parse(data + decoder.decode()));
    nextMovementCheck = Date.now() + 5 * 60_000;
  } catch {
    recentMovementItems ??= movementItems(MOVEMENT_FALLBACK);
    nextMovementCheck = Date.now() + 60_000;
  } finally {
    clearTimeout(timeout);
  }
  return recentMovementItems;
}

function movementHtml(text) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return text.replace(/[&<>"']/g, char => entities[char]);
}

function movementList(items) {
  return '<ul class="coverage-items">' + items.map(item => {
    const heading = '<h3 class="coverage-title"><a href="' + movementHtml(item.url) + '">' + movementHtml(item.title) + '</a></h3>';
    const credit = movementHtml(item.source) + ' · ' + movementPlatforms.get(item.kind);
    const date = '<time datetime="' + item.published + '">' + movementDateFormat.format(item.date) + '</time>';
    const summary = item.summary ? '<p>' + movementHtml(item.summary) + '</p>' : '';
    return '<li>' + heading + '<p class="source-line">' + credit + ' · ' + date + '</p>' + summary + '</li>';
  }).join('') + '</ul>';
}

async function renderMovementPage(bytes) {
  const items = await loadMovementItems();
  const groups = [
    ['community', 'From our community', 'Our own posts and conversations will appear here.'],
    ['business', 'On the menu', 'We’ll link to restaurants and food makers here when we can verify the Gemmy badge or a No Secretions label on their own menu, website or public post.'],
    ['independent', 'Elsewhere in the news and on social', 'We haven’t listed an independent mention yet. This is where you’ll find reporting and public posts from people outside our team.']
  ];
  const sections = groups.map(([origin, heading, empty]) => {
    const matching = items.filter(item => item.origin === origin);
    const content = matching.length ? movementList(matching.slice(0, 20)) : '<p>' + empty + '</p>';
    const badge = origin === 'business' ? '<p><a href="/menu-label">Put Gemmy on your menu</a></p>' : '';
    return '<section class="coverage-group" aria-labelledby="mentions-' + origin + '"><h2 id="mentions-' + origin + '">' + heading + '</h2>' + content + badge + '</section>';
  });
  const template = new TextDecoder().decode(bytes);
  return new TextEncoder().encode(template.replace('<!-- movement-links -->', () => sections.join('\n')));
}
