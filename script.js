const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');

function setHeader() {
  if (!header?.classList.contains('over-hero')) return;
  header.classList.toggle('scrolled', window.scrollY > 30);
}

menuButton?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  header.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'Close' : 'Menu';
});

window.addEventListener('scroll', setHeader, { passive: true });
setHeader();
