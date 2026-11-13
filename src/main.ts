import './style.css'
import { getPortfolioItems, getAboutPage, getSiteSettings, getProjectBySlug } from './sanity'
import { describeClick, getConsent, saveConsent, startAnalyticsIfConsented, track } from './lib/analytics'
import { heroSrc, heroSrcset, pickHeroUrl } from './lib/heroImage'
import { faqSection } from './lib/staticContent'
import { localizedTitle } from './lib/titleTranslation'
import { translations } from './translations'

const PHONE_DISPLAY = '+48 511 017 427';
const PHONE_HREF = 'tel:+48511017427';
const EMAIL = 'anna@kuczewska.com';
const INSTAGRAM_URL = 'https://instagram.com/wnetrzanka';
const LANGS = ['pl', 'en', 'es'];
// Simple one-colour Instagram glyph; inherits the text colour around it.
const INSTAGRAM_ICON = `<svg class="ig-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>`;

// --- State & Router ---
let currentPath = '';
const storedLang = localStorage.getItem('lang');
const browserLang = navigator.language.split('-')[0];
let currentLang = storedLang && LANGS.includes(storedLang) ? storedLang : (LANGS.includes(browserLang) ? browserLang : 'pl');

function t(key: string) {
  const keys = key.split('.');
  let value = translations[currentLang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
  ));
}

/** Sanity CDN images get resized/cropped on the fly; local fallbacks pass through. */
function img(url: string, w: number, h?: number): string {
  if (!url || !url.startsWith('https://cdn.sanity.io')) return url;
  return `${url}?auto=format&q=75&w=${w}${h ? `&h=${h}&fit=crop` : ''}`;
}

function setLanguage(lang: string) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  location.reload(); // Simplest way to re-render everything with new lang
}

async function router() {
  const path = window.location.hash || '#home';
  if (path === currentPath) return;
  currentPath = path;

  const appElement = document.querySelector<HTMLDivElement>('#app')!;

  const isAppShellRoute =
    path.startsWith('#/portal') ||
    path.startsWith('#/admin') ||
    path.startsWith('#/offer/') ||
    path.startsWith('#/contract/');
  appElement.classList.toggle('app-shell', isAppShellRoute);
  // Portal / CRM keep their own dark theme (app.css); the marketing site is light.
  document.body.classList.toggle('app-dark', isAppShellRoute);

  if (isAppShellRoute) {
    document.body.style.overflow = '';
  }

  if (path.startsWith('#/portal')) {
    const { renderPortalRoute } = await import('./portal/router');
    await renderPortalRoute(path, appElement);
    return;
  }

  if (path.startsWith('#/admin')) {
    const { renderAdminRoute } = await import('./admin/router');
    await renderAdminRoute(path, appElement);
    return;
  }

  if (path.startsWith('#/offer/') || path.startsWith('#/contract/')) {
    const { renderBookingRouterRoute } = await import('./booking/router');
    await renderBookingRouterRoute(path, appElement);
    return;
  }

  // Update HTML lang attribute and title for SEO
  document.documentElement.lang = currentLang;
  document.title = t('meta.title');

  // The static shell in index.html has no modal — that is how we know the
  // full home page still needs rendering (first load or return from the portal).
  const freshRender = !document.getElementById('project-modal');
  if (freshRender) {
    renderHomeShell(appElement);
    loadHomeData();
  }

  if (path.startsWith('#project/')) {
    showProjectModal(path.replace('#project/', ''));
  } else {
    closeProjectModal();
    if (freshRender && /^#[a-z-]+$/.test(path) && path !== '#home') {
      document.querySelector(path)?.scrollIntoView();
    }
  }

  observeReveals();
}

// --- Home Shell (Static Structure) ---
function renderHomeShell(appElement: HTMLElement) {
  const tr = translations[currentLang];
  const steps: Array<{ title: string, text: string }> = tr.process.steps;
  const facts: Array<{ value: string, label: string }> = tr.facts;
  const types: string[] = tr.contact.types;

  // Keep the hero photo that came with the HTML: re-creating it would restart its download.
  const prebuiltHero = appElement.querySelector<HTMLImageElement>('#hero-img');

  appElement.innerHTML = `
    <header class="site-header">
      <nav class="container nav-container" aria-label="${t('nav.menu')}">
        <a href="#home" class="logo" aria-label="Kuczewska Fotografia">
          <img src="/logo-kuczewska.png" alt="Kuczewska Fotografia" class="logo-img" width="720" height="176">
        </a>
        <button class="mobile-menu-btn" type="button" aria-label="${t('nav.menu')}" aria-expanded="false" aria-controls="nav-links">
          <span></span><span></span><span></span>
        </button>
        <ul class="nav-links" id="nav-links">
          <li><a href="#portfolio">${t('nav.portfolio')}</a></li>
          <li><a href="#process">${t('nav.process')}</a></li>
          <li><a href="#about">${t('nav.about')}</a></li>
          <li><a href="#/portal/login" class="nav-login">${t('nav.login')}</a></li>
          <li class="lang-switcher">
            ${LANGS.map((lang) => `<button type="button" data-lang="${lang}" class="${currentLang === lang ? 'active' : ''}" ${currentLang === lang ? 'aria-current="true"' : ''}>${lang.toUpperCase()}</button>`).join('')}
          </li>
          <li><a href="#contact" class="btn btn-small">${t('cta.bookShort')}</a></li>
        </ul>
      </nav>
    </header>

    <main>
      <section id="home" class="hero">
        <div class="hero-photo"><img id="hero-img" alt="${t('hero.imageAlt')}" fetchpriority="high"></div>
        <div class="container hero-below">
          <div class="hero-card">
            <p class="eyebrow">${t('hero.eyebrow')}</p>
            <h1>${t('hero.title')}</h1>
            <p class="hero-sub">${t('hero.subtitle')}</p>
            <div class="hero-btns">
              <a href="#contact" class="btn">${t('cta.book')}</a>
              <a href="#portfolio" class="link-arrow">${t('hero.secondary')}</a>
            </div>
            <p class="hero-note">${t('hero.note')} <a href="${PHONE_HREF}">${PHONE_DISPLAY}</a></p>
          </div>
          <dl class="facts">
            ${facts.map((fact) => `<div><dt>${fact.value}</dt><dd>${fact.label}</dd></div>`).join('')}
          </dl>
        </div>
      </section>

      <section id="portfolio" class="portfolio-section">
        <div class="container">
          <div class="section-head reveal">
            <h2>${t('portfolio.title')}</h2>
            <p>${t('portfolio.subtitle')}</p>
          </div>
        </div>
        <div class="wall" id="portfolio-grid">
          <div class="loader-container"><div class="loader"></div></div>
        </div>
      </section>

      <section id="process" class="process-section">
        <div class="container">
          <div class="section-head reveal">
            <h2>${t('process.title')}</h2>
            <p>${t('process.subtitle')}</p>
          </div>
          <ol class="steps">
            ${steps.map((step, i) => `
              <li class="reveal">
                <span class="step-num" aria-hidden="true">${i + 1}</span>
                <h3>${step.title}</h3>
                <p>${step.text}</p>
              </li>`).join('')}
          </ol>
          <div class="process-cta reveal">
            <a href="#contact" class="btn">${t('cta.book')}</a>
          </div>
        </div>
      </section>

      ${faqSection(tr, { animated: true })}

      <section id="about" class="about-section">
        <div class="container about-container">
          <div class="about-visual reveal" id="about-image-container"></div>
          <div class="about-card reveal">
            <div id="about-bio"><div class="loader-container"><div class="loader"></div></div></div>
            <div class="about-stats" id="about-stats"></div>
            <div class="about-actions">
              <a href="#contact" class="btn">${t('cta.book')}</a>
              <a href="${INSTAGRAM_URL}" class="ig-link" target="_blank" rel="noopener" aria-label="Instagram @wnetrzanka">${INSTAGRAM_ICON}<span>@wnetrzanka</span></a>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" class="contact-section">
        <div class="container contact-grid">
          <div class="contact-info reveal">
            <h2>${t('contact.title')}</h2>
            <p class="contact-lead">${t('contact.subtitle')}</p>
            <p class="contact-direct-label">${t('contact.direct')}</p>
            <a class="contact-phone" href="${PHONE_HREF}">${PHONE_DISPLAY}</a>
            <a class="contact-mail" href="mailto:${EMAIL}">${EMAIL}</a>
            <a class="ig-link" href="${INSTAGRAM_URL}" target="_blank" rel="noopener" aria-label="Instagram @wnetrzanka">${INSTAGRAM_ICON}<span>@wnetrzanka</span></a>
          </div>
          <div class="contact-card reveal" id="contact-card">
            <form class="contact-form" id="contact-form" novalidate>
              <fieldset class="chips">
                <legend>${t('contact.type')}</legend>
                <div class="chips-row">
                  ${types.map((type, i) => `
                    <label class="chip"><input type="radio" name="type" value="${esc(translations.pl.contact.types[i])}"><span>${type}</span></label>`).join('')}
                </div>
              </fieldset>
              <div class="form-row">
                <div class="form-group">
                  <label for="cf-name">${t('contact.name')}</label>
                  <input id="cf-name" type="text" name="name" autocomplete="given-name" maxlength="120" required>
                </div>
                <div class="form-group">
                  <label for="cf-city">${t('contact.city')}</label>
                  <input id="cf-city" type="text" name="city" autocomplete="address-level2" maxlength="120">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="cf-email">${t('contact.email')}</label>
                  <input id="cf-email" type="email" name="email" autocomplete="email" maxlength="160" required>
                </div>
                <div class="form-group">
                  <label for="cf-phone">${t('contact.phone')} <span class="optional">(${t('contact.optional')})</span></label>
                  <input id="cf-phone" type="tel" name="phone" autocomplete="tel" maxlength="40">
                </div>
              </div>
              <div class="form-group">
                <label for="cf-message">${t('contact.message')} <span class="optional">(${t('contact.optional')})</span></label>
                <textarea id="cf-message" name="message" rows="3" maxlength="3000" aria-describedby="cf-message-hint"></textarea>
                <p class="hint" id="cf-message-hint">${t('contact.messageHint')}</p>
              </div>
              <div class="hp" aria-hidden="true">
                <label for="cf-website">Website</label>
                <input id="cf-website" type="text" name="website" tabindex="-1" autocomplete="off">
              </div>
              <p class="form-error" id="contact-error" role="alert" hidden></p>
              <button type="submit" class="btn btn-block">${t('contact.submit')}</button>
              <p class="hint">${t('hero.note')} ${t('contact.privacy')}</p>
            </form>
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container footer-content">
        <img src="/logo-kuczewska.png" alt="Kuczewska Fotografia" class="logo-img" id="footer-logo" width="720" height="176" loading="lazy">
        <div class="footer-links">
          <a href="${PHONE_HREF}">${PHONE_DISPLAY}</a>
          <a href="mailto:${EMAIL}">${EMAIL}</a>
          <a href="${INSTAGRAM_URL}" class="ig-link" target="_blank" rel="noopener" aria-label="Instagram @wnetrzanka">${INSTAGRAM_ICON}</a>
        </div>
        <p>&copy; ${new Date().getFullYear()} ${t('footer.rights')} · <button type="button" class="footer-cookies" id="cookie-settings">${t('footer.cookies')}</button></p>
      </div>
    </footer>

    <div class="consent" id="consent" role="region" aria-label="${t('footer.cookies')}" hidden>
      <p>${t('consent.text')}</p>
      <div class="consent-actions">
        <button type="button" class="btn btn-small btn-outline" data-consent="denied">${t('consent.reject')}</button>
        <button type="button" class="btn btn-small btn-outline" data-consent="granted">${t('consent.accept')}</button>
      </div>
    </div>

    <div class="mobile-cta" id="mobile-cta">
      <a href="${PHONE_HREF}" class="btn btn-outline">${t('cta.call')}</a>
      <a href="#contact" class="btn">${t('cta.bookShort')}</a>
    </div>

    <div id="project-modal" class="modal" role="dialog" aria-modal="true" aria-label="${t('portfolio.title')}">
      <div class="modal-bar">
        <a href="#portfolio" class="modal-back">&larr; ${t('project.back')}</a>
        <p class="modal-title" id="modal-title"></p>
        <a href="#contact" class="btn btn-small">${t('cta.bookShort')}</a>
      </div>
      <div id="modal-body"></div>
    </div>
  `;

  if (prebuiltHero) {
    prebuiltHero.alt = t('hero.imageAlt');
    appElement.querySelector('.hero-photo')!.replaceChildren(prebuiltHero);
  }

  // Language switcher
  appElement.querySelectorAll<HTMLButtonElement>('.lang-switcher button').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.lang!));
  });

  // Mobile menu
  const menuBtn = appElement.querySelector<HTMLButtonElement>('.mobile-menu-btn')!;
  const navLinks = appElement.querySelector<HTMLElement>('.nav-links')!;
  const setMenu = (open: boolean) => {
    menuBtn.classList.toggle('active', open);
    navLinks.classList.toggle('active', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('active')));
  navLinks.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setMenu(false);
  });

  // The sticky mobile bar steps aside once the booking form itself is on screen.
  const mobileCta = document.getElementById('mobile-cta')!;
  new IntersectionObserver(([entry]) => {
    mobileCta.classList.toggle('at-form', entry.isIntersecting);
  }, { threshold: 0.05 }).observe(document.getElementById('contact')!);

  // Analytics consent: ask once, let the visitor change their mind from the footer.
  const consentBox = document.getElementById('consent')!;
  consentBox.hidden = getConsent() !== null;
  consentBox.querySelectorAll<HTMLButtonElement>('[data-consent]').forEach((button) => {
    button.addEventListener('click', () => {
      const choice = button.dataset.consent as 'granted' | 'denied';
      const changedToDenied = choice === 'denied' && getConsent() === 'granted';
      saveConsent(choice);
      consentBox.hidden = true;
      if (changedToDenied) location.reload(); // drops the already loaded analytics script
      else startAnalyticsIfConsented();
    });
  });
  document.getElementById('cookie-settings')!.addEventListener('click', () => {
    consentBox.hidden = false;
    consentBox.querySelector<HTMLButtonElement>('button')?.focus();
  });
  startAnalyticsIfConsented();

  initContactForm();
  handleScroll();
}

// --- Booking enquiry form — creates a Lead in the CRM (Tor C) ---
function initContactForm() {
  const form = document.getElementById('contact-form') as HTMLFormElement;
  const errorBox = document.getElementById('contact-error')!;

  // "Started the form" vs "sent it" shows where enquiries are lost.
  form.addEventListener('input', () => track('form_start'), { once: true });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.hidden = true;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const field = (name: string) => String(data.get(name) ?? '').trim();
    const name = field('name');
    const email = field('email');

    // Anna reads these in the CRM, so the composed summary stays in Polish.
    const summary = [
      field('type') && `Rodzaj nieruchomości: ${field('type')}`,
      field('city') && `Miejscowość: ${field('city')}`,
      currentLang !== 'pl' && `Język klienta: ${currentLang.toUpperCase()}`,
    ].filter(Boolean).join('\n');
    const message = [summary, field('message')].filter(Boolean).join('\n\n');

    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    btn.textContent = t('contact.sending');
    btn.disabled = true;

    try {
      // Honeypot: bots fill the hidden field; real visitors never see it.
      if (!field('website')) {
        // Firebase is only downloaded when someone actually sends the form.
        const { submitContactFormLead } = await import('./lib/leads');
        await submitContactFormLead({ name, email, phone: field('phone') || null, message });
        // The conversion. No personal data — only what kind of property it was.
        track('generate_lead', { property_type: field('type') || 'nie podano', has_phone: Boolean(field('phone')) });
      }
      document.getElementById('contact-card')!.innerHTML = `
        <div class="form-success" role="status" tabindex="-1">
          <h3>${t('contact.successTitle')}</h3>
          <p>${t('contact.successText')} <strong>${esc(email)}</strong>.</p>
          <p><a href="${PHONE_HREF}">${PHONE_DISPLAY}</a></p>
        </div>`;
      document.querySelector<HTMLElement>('.form-success')?.focus();
    } catch (err) {
      console.warn('Lead submit failed:', err);
      track('form_error');
      errorBox.innerHTML = `${t('contact.error')} <a href="${PHONE_HREF}">${PHONE_DISPLAY}</a>`;
      errorBox.hidden = false;
      btn.textContent = t('contact.submit');
      btn.disabled = false;
    }
  });
}

// Fallback static data (used only when Sanity is unreachable or empty)
const fallbackPortfolio = [
  { title: 'Apartament Modern', location: 'Warszawa', slug: 'apartament-modern', imageUrl: '/interior_1.png' },
  { title: 'Minimalistyczny Loft', location: 'Białystok', slug: 'minimalistyczny-loft', imageUrl: '/interior_2.png' },
  { title: 'Rezydencja nad Jeziorem', location: 'Ełk', slug: 'rezydencja-nad-jeziorem', imageUrl: '/interior_3.png' }
];

function setHeroImage(url: string) {
  const heroImg = document.getElementById('hero-img') as HTMLImageElement | null;
  // Already showing this photo (put into the HTML at build time)? Leave it alone.
  if (!heroImg || !url || heroImg.dataset.source === url) return;
  heroImg.dataset.source = url;
  heroImg.classList.remove('loaded');
  heroImg.addEventListener('load', () => heroImg.classList.add('loaded'), { once: true });
  heroImg.sizes = '100vw';
  heroImg.srcset = heroSrcset(url);
  heroImg.src = heroSrc(url);
}

// --- Background Data Updates ---
function loadHomeData() {
  // Settings + portfolio together: the hero photo comes from settings, or else from a landscape cover.
  Promise.all([getSiteSettings(), getPortfolioItems()]).then(([settings, items]) => {
    const data: any[] = (items && items.length > 0) ? items : fallbackPortfolio;

    if (settings) {
      const title = currentLang === 'en' ? settings.heroTitle_en : (currentLang === 'es' ? settings.heroTitle_es : settings.heroTitle);
      const subtitle = currentLang === 'en' ? settings.heroSubtitle_en : (currentLang === 'es' ? settings.heroSubtitle_es : settings.heroSubtitle);
      const h1 = document.querySelector('.hero h1');
      const sub = document.querySelector('.hero-sub');
      if (title && h1) h1.textContent = title;
      if (subtitle && sub) sub.textContent = subtitle;

      // The logo in Sanity is the white variant made for the old dark theme, so it
      // would vanish on the white header. The black wordmark ships in /public instead.
    }

    const heroSource = pickHeroUrl(settings?.heroImageUrl, items ?? []) || '/hero.png';
    setHeroImage(heroSource);

    renderWall(data);
  });

  getAboutPage().then(renderAbout);
}

function renderWall(data: any[]) {
  const grid = document.getElementById('portfolio-grid');
  if (!grid) return;

  grid.innerHTML = data.map((item, index) => {
    const isLast = index === data.length - 1;
    const href = `#project/${encodeURIComponent(item.slug)}`;
    const title = esc(localizedTitle(item, currentLang));
    const previews: string[] = (item.preview?.map((p: any) => p?.url).filter(Boolean) as string[] | undefined)
      ?? fallbackPortfolio.filter((p) => p.slug !== item.slug).map((p) => p.imageUrl);
    // The last project gives two of its small tiles to the booking tile.
    const smalls = previews.slice(0, isLast ? 2 : 4);

    return `
      <div class="wall-block reveal">
        <a href="${href}" class="tile tile-cover">
          <img src="${img(item.imageUrl, 1200, 1200)}" alt="${title}" loading="lazy">
          <span class="tile-label">
            <span class="tile-title">${title}</span>
            <span class="tile-meta">${esc(item.location || '')}</span>
            <span class="tile-more">${t('portfolio.view')}${item.count ? ` (${item.count})` : ''} &rarr;</span>
          </span>
        </a>
        ${smalls.map((url) => `
          <a href="${href}" class="tile${!isLast && smalls.length < 4 ? ' tile-tall' : ''}" tabindex="-1" aria-hidden="true">
            <img src="${img(url, 640, 640)}" alt="" loading="lazy">
          </a>`).join('')}
        ${isLast ? `
          <a href="#contact" class="tile tile-cta">
            <span class="tile-cta-title">${t('portfolio.tileTitle')}</span>
            <span class="btn">${t('cta.book')}</span>
          </a>` : ''}
      </div>`;
  }).join('');

  observeReveals();
}

function renderAbout(about: any) {
  const bioContainer = document.getElementById('about-bio');
  if (bioContainer) {
    const blocks: any[] | undefined = about
      ? (currentLang === 'en' ? about.bio_en : (currentLang === 'es' ? about.bio_es : about.bio))
      : undefined;

    let heading = t('about.title');
    let paragraphs: string[] = translations[currentLang].about.bio;

    if (blocks && blocks.length > 0) {
      const texts = blocks
        .map((block) => ({
          style: block.style,
          text: (block.children || []).map((child: any) => child.text).join('').trim(),
        }))
        .filter((block) => block.text);
      const headingBlock = texts.find((block) => /^h\d$/.test(block.style));
      if (headingBlock) heading = headingBlock.text;
      paragraphs = texts.filter((block) => block !== headingBlock).map((block) => block.text);
    }

    bioContainer.innerHTML = `<h2>${esc(heading)}</h2>` + paragraphs.map((p) => `<p>${esc(p)}</p>`).join('');
  }

  const imgContainer = document.getElementById('about-image-container');
  if (imgContainer) {
    imgContainer.innerHTML = `<img src="${img(about?.imageUrl || '/profile.png', 900)}" alt="${t('about.imageAlt')}" class="about-img" loading="lazy">`;
  }

  const statsContainer = document.getElementById('about-stats');
  if (statsContainer && about?.stats?.length) {
    statsContainer.innerHTML = about.stats.map((stat: any) => {
      const label = currentLang === 'en' ? stat.label_en : (currentLang === 'es' ? stat.label_es : stat.label);
      return `
        <div class="stat-item">
          <span class="stat-number">${esc(stat.number)}</span>
          <span class="stat-label">${esc(label || stat.label)}</span>
        </div>`;
    }).join('');
  }
}

// --- Project gallery (full-screen) ---
async function showProjectModal(slug: string) {
  const modal = document.getElementById('project-modal')!;
  const body = document.getElementById('modal-body')!;
  const titleEl = document.getElementById('modal-title')!;

  modal.classList.add('open');
  modal.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  titleEl.textContent = '';
  body.innerHTML = '<div class="loader-container" style="height: 60vh; align-items:center;"><div class="loader"></div></div>';

  const decodedSlug = decodeURIComponent(slug);
  const projectFromSanity = await getProjectBySlug(decodedSlug);
  const fallbackProject = fallbackPortfolio.find(p => p.slug === decodedSlug);
  const project = projectFromSanity || (fallbackProject ? {
    ...fallbackProject,
    mainImageUrl: fallbackProject.imageUrl,
    description: null,
    gallery: fallbackPortfolio.map((p) => ({ url: p.imageUrl, alt: p.title }))
  } : null);

  // The visitor may have closed the gallery while it was loading.
  if (!window.location.hash.startsWith('#project/')) return;

  if (!project) {
    body.innerHTML = `<div class="container modal-end"><h2>${t('project.notFound')}</h2><a href="#portfolio" class="btn">${t('project.back')}</a></div>`;
    return;
  }

  const projectTitle = localizedTitle(project, currentLang);
  titleEl.textContent = [projectTitle, project.location].filter(Boolean).join(' · ');
  const description: string[] = (project.description || [])
    .map((block: any) => (block.children || []).map((child: any) => child.text).join('').trim())
    .filter(Boolean);

  body.innerHTML = `
    <div class="container modal-project-content">
      <h1>${esc(projectTitle)}</h1>
      ${project.location ? `<p class="modal-location">${esc(project.location)}</p>` : ''}
      ${description.length ? `<div class="project-description">${description.map((p) => `<p>${esc(p)}</p>`).join('')}</div>` : ''}
      <div class="gallery-grid">
        ${project.gallery?.map((image: any) => `
          <div class="gallery-item">
            <img src="${img(image.url, 1000)}" alt="${esc(image.alt || projectTitle)}" loading="lazy">
          </div>`).join('') || `<p>${t('portfolio.empty')}</p>`}
      </div>
      <div class="modal-end">
        <h2>${t('project.endTitle')}</h2>
        <a href="#contact" class="btn">${t('cta.book')}</a>
      </div>
    </div>
  `;
}

function closeProjectModal() {
  const modal = document.getElementById('project-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// --- Shared Logic ---
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

function observeReveals() {
  document.querySelectorAll('.reveal:not(.active)').forEach(el => revealObserver.observe(el));
}

function handleScroll() {
  document.querySelector('.site-header')?.classList.toggle('scrolled', window.scrollY > 8);
  document.getElementById('mobile-cta')?.classList.toggle('visible', window.scrollY > 420);
}

// Clicks that matter on the public site (booking buttons, phone, e-mail, projects).
document.addEventListener('click', (event) => {
  if (document.body.classList.contains('app-dark')) return; // portal & CRM are never tracked
  const described = describeClick(event.target as Element | null);
  if (described) track(described.name, described.params);
});

window.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && window.location.hash.startsWith('#project/')) {
    window.location.hash = '#portfolio';
  }
});
window.addEventListener('hashchange', router);
window.addEventListener('load', router);
