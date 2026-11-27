const toggle = document.querySelector('.nav-disclosure');
const links = document.getElementById('main-links');
const header = toggle.closest('header');
const compact = window.matchMedia('(max-width: 850px)');

function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  links.hidden = compact.matches && !open;
}

function syncLayout() {
  toggle.hidden = !compact.matches;
  setMenu(false);
}

toggle.addEventListener('click', () => setMenu(links.hidden));
links.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && compact.matches && !links.hidden) {
    setMenu(false);
    toggle.focus();
  }
});
header.addEventListener('focusout', event => {
  if (event.relatedTarget && !header.contains(event.relatedTarget)) setMenu(false);
});
document.addEventListener('click', event => {
  if (!header.contains(event.target) && compact.matches && !links.hidden) setMenu(false);
});
compact.addEventListener('change', syncLayout);
syncLayout();
