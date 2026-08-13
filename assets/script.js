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

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  document.documentElement.classList.add('motion-ready');

  const revealSelectors = [
    '.feature-copy > *',
    '.feature-photo',
    '.dog-photo',
    '.dog-title',
    '.dog-card > p',
    '.sides-inner > *',
    '.story-image',
    '.story-text > p',
    '.pillars > span',
    '.form-intro > *',
    '.contact-form > *',
    '.jotform-wrap',
    '.footer-main',
    '.copyright'
  ];

  const revealItems = [...document.querySelectorAll(revealSelectors.join(','))];

  revealItems.forEach((item, index) => {
    item.classList.add('reveal-item');
    item.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 70}ms`);
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px' });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
}
