(async function () {
  const fallbackUrl = 'assets/content.json';
  const page = document.body.dataset.page;
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safeUrl = (value = '') => /^(https?:\/\/|assets\/|[\w.-]+\.html(?:#.*)?$|#)/i.test(value) ? value : '#';
  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
  const setText = (selector, value) => { const el = document.querySelector(selector); if (el && value !== undefined) el.textContent = value; };
  const setImage = (selector, value) => { const el = document.querySelector(selector); if (el && value) el.src = safeUrl(value); };
  const setLink = (selector, item) => { const el = document.querySelector(selector); if (el && item) { el.textContent = item.text || item.linkText || ''; el.href = safeUrl(item.url || item.linkUrl || ''); } };

  let content;
  try {
    const response = await fetch('/api/content', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('No live content API');
    content = await response.json();
  } catch (_) {
    content = await fetch(fallbackUrl).then(r => r.json());
  }

  window.siteContent = content;
  document.querySelectorAll('[data-section]').forEach(el => {
    if (content.sections?.[el.dataset.section] === false) el.hidden = true;
  });
  const sectionSelectors = { sides: '.sides', story: '.story-copy', catering: '.form-layout', contact: '.form-layout' };
  Object.entries(sectionSelectors).forEach(([key, selector]) => { if (content.sections?.[key] === false) document.querySelector(selector)?.setAttribute('hidden', ''); });

  const bars = [content.site?.announcement, content.site?.temporaryBanner].filter(x => x?.enabled && x.text);
  if (bars.length) {
    const wrap = document.createElement('div');
    wrap.className = 'site-announcements';
    wrap.innerHTML = bars.map(bar => `<div class="announcement"><span>${escapeHtml(bar.text)}</span>${bar.linkText ? `<a href="${safeUrl(bar.linkUrl)}">${escapeHtml(bar.linkText)} →</a>` : ''}</div>`).join('');
    document.body.prepend(wrap);
    document.body.classList.add('has-announcement');
  }

  setText('.footer-brand p', content.site?.tagline);
  const social = content.site?.social || {};
  const socialLinks = Object.entries(social).filter(([, url]) => url).map(([name, url]) => `<a href="${safeUrl(url)}" target="_blank" rel="noopener">${escapeHtml(name)}</a>`).join('');
  if (socialLinks) document.querySelectorAll('.footer-links').forEach(el => el.insertAdjacentHTML('afterend', `<div class="footer-social">${socialLinks}</div>`));
  const contactBits = [content.site?.contact?.phone, content.site?.contact?.email, content.site?.contact?.address].filter(Boolean);
  const manualStatus = content.site?.hours?.manualStatus;
  if (manualStatus && manualStatus !== 'auto') contactBits.unshift(manualStatus === 'open' ? 'Open now' : 'Currently closed');
  if (contactBits.length) document.querySelectorAll('.site-footer').forEach(footer => footer.insertAdjacentHTML('afterbegin', `<div class="business-summary page-width">${contactBits.map(escapeHtml).join(' <span>•</span> ')}</div>`));

  if (page === 'home') {
    const home = content.home;
    const headline = document.querySelector('.hero-content h1');
    if (headline) headline.innerHTML = home.headlineLines.map(line => `<span>${escapeHtml(line)}</span>`).join('');
    setText('.hero-content > p', home.description); setImage('.hero-image', home.heroImage);
    setLink('[data-content="primary-button"]', home.primaryButton); setLink('[data-content="secondary-button"]', home.secondaryButton);
    document.querySelectorAll('.home-ticker div').forEach(el => el.textContent = `${home.ticker} ${home.ticker} ${home.ticker} ${home.ticker}`);
    setText('.feature-copy .kicker', home.feature.kicker); setText('.feature-copy h2', home.feature.heading); setText('.feature-copy > p:not(.kicker)', home.feature.description);
    setLink('.feature-copy .text-link', { text: `${home.feature.linkText} →`, url: home.feature.linkUrl }); setImage('.feature-photo img', home.feature.image);
    const feature = document.querySelector('.home-feature');
    if (feature && content.sections?.events !== false && content.events?.some(event => event.enabled)) {
      const events = content.events.filter(event => event.enabled);
      feature.insertAdjacentHTML('afterend', `<section class="dynamic-section events-section" id="events"><div class="page-width"><p class="kicker">Find us</p><h2>Upcoming pop-ups</h2><div class="event-grid">${events.map(event => `<article><time datetime="${escapeHtml(event.date)}">${escapeHtml(event.date)}</time><h3>${escapeHtml(event.title)}</h3><p>${escapeHtml([event.startTime && `${event.startTime}${event.endTime ? `–${event.endTime}` : ''}`, event.location].filter(Boolean).join(' · '))}</p>${event.announcement ? `<p>${escapeHtml(event.announcement)}</p>` : ''}</article>`).join('')}</div></div></section>`);
    }
    if (feature && content.sections?.gallery !== false && content.gallery?.length) {
      document.querySelector('main').insertAdjacentHTML('beforeend', `<section class="dynamic-section gallery-section"><div class="page-width"><p class="kicker">From the grill</p><h2>Gallery</h2><div class="gallery-grid">${content.gallery.map(photo => `<figure><img src="${safeUrl(photo.src)}" alt="${escapeHtml(photo.alt)}">${photo.caption ? `<figcaption>${escapeHtml(photo.caption)}</figcaption>` : ''}</figure>`).join('')}</div></div></section>`);
    }
  }

  if (page === 'menu') {
    setText('.page-hero p', content.menu.eyebrow); setText('.page-hero h1', content.menu.heading);
    const hotDogs = content.menu.categories.find(c => c.id === 'hot-dogs') || content.menu.categories[0];
    const grid = document.querySelector('.dog-grid');
    if (grid) grid.innerHTML = hotDogs.items.map((item, index) => `<article class="dog-card ${index % 2 ? 'right' : 'left'} availability-${escapeHtml(item.availability)}">${item.image ? `<div class="dog-photo"><img src="${safeUrl(item.image)}" alt="${escapeHtml(item.name)}"></div>` : ''}<div class="dog-title"><h2>${escapeHtml(item.name)}</h2><strong>${money(item.price)}</strong></div><div class="item-flags">${item.featured ? '<span>Featured</span>' : ''}${item.availability !== 'available' ? `<span>${escapeHtml(item.availability === 'sold-out' ? 'Sold Out' : 'Coming Soon')}</span>` : ''}</div><p>${escapeHtml(item.description)}</p></article>`).join('');
    const sides = content.menu.categories.find(c => c.id === 'drinks-sides');
    const list = document.querySelector('.price-list');
    if (list && sides) list.innerHTML = sides.items.map(item => `<p class="availability-${escapeHtml(item.availability)}"><span>${escapeHtml(item.name)}</span><strong>${money(item.price)}</strong></p>`).join('');
    setText('.toppings h3', content.menu.toppings.heading); setText('.toppings strong', content.menu.toppings.priceLabel); setText('.toppings p', content.menu.toppings.items.join('\n'));
  }

  if (page === 'story') {
    setText('.page-hero p', content.story.eyebrow); setText('.page-hero h1', content.story.heading); setImage('.story-image img', content.story.image);
    const text = document.querySelector('.story-text'); if (text) text.innerHTML = content.story.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
    const pillars = document.querySelector('.pillars'); if (pillars) pillars.innerHTML = content.story.pillars.map(p => `<span>${escapeHtml(p)}</span>`).join('');
  }

  if (page === 'catering') {
    setText('.page-hero p', content.catering.eyebrow); setText('.page-hero h1', content.catering.heading); setText('.form-intro h2', content.catering.title); setText('.form-intro p', content.catering.description); setText('.form-intro span', content.catering.availabilityText);
  }
  if (page === 'contact') {
    setText('.page-hero p', content.contact.eyebrow); setText('.page-hero h1', content.contact.heading); setText('.form-intro h2', content.contact.title); setText('.form-intro p', content.contact.description);
    const form = document.querySelector('.contact-form'); if (form) form.action = safeUrl(content.contact.formAction);
  }
})();
