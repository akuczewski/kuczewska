import './style.css'
import { getPortfolioItems, getAboutPage, getSiteSettings } from './sanity'

async function initApp() {
  let settings, portfolioItems, aboutData;

  try {
    [settings, portfolioItems, aboutData] = await Promise.all([
      getSiteSettings(),
      getPortfolioItems(),
      getAboutPage()
    ]);
  } catch (err) {
    console.warn('Data fetching failed, using fallbacks', err);
  }

  const appElement = document.querySelector<HTMLDivElement>('#app')!;

  appElement.innerHTML = `
    <header class="glass">
      <nav class="container nav-container">
        <div class="logo serif">
          ${settings?.logoImageUrl ? `<img src="${settings.logoImageUrl}" alt="Logo" class="logo-img">` : (settings?.logoText || 'KUCZEWSKA')}
        </div>
        <ul class="nav-links">
          <li><a href="#home">Główna</a></li>
          <li><a href="#portfolio">Realizacje</a></li>
          <li><a href="#about">O mnie</a></li>
          <li><a href="#contact">Kontakt</a></li>
        </ul>
        <div class="mobile-menu-btn">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </nav>
    </header>

    <main>
      <section id="home" class="hero">
        <div class="hero-overlay"></div>
        <div class="container hero-content">
          <h1 class="reveal">FOTOGRAFIA WNĘTRZ</h1>
          <p class="reveal">Zatrzymaj piękno swojej przestrzeni. Profesjonalne sesje zdjęciowe nieruchomości, które budują wartość i przyciągają klientów.</p>
          <div class="hero-btns reveal">
            <a href="#portfolio" class="btn">Moje prace</a>
            <a href="#contact" class="btn btn-outline">Kontakt</a>
          </div>
        </div>
      </section>

      <section id="portfolio" class="portfolio-section container">
        <h2 class="section-title reveal">Wybrane Realizacje</h2>
        <div class="portfolio-grid">
          ${portfolioItems?.length > 0 ? portfolioItems.map((item: any) => `
            <div class="portfolio-item reveal">
              <div class="portfolio-img" style="background-image: url('${item.imageUrl}')"></div>
              <div class="portfolio-info">
                <h3>${item.title}</h3>
                <p>${item.location}</p>
              </div>
            </div>
          `).join('') : `
            <div class="portfolio-item reveal">
              <div class="portfolio-img" style="background-image: url('/apartment.png')"></div>
              <div class="portfolio-info">
                <h3>Apartamenty Premium</h3>
                <p>Warszawa</p>
              </div>
            </div>
            <div class="portfolio-item reveal">
              <div class="portfolio-img" style="background-image: url('/loft.png')"></div>
              <div class="portfolio-info">
                <h3>Nowoczesne Lofty</h3>
                <p>Białystok</p>
              </div>
            </div>
            <div class="portfolio-item reveal">
              <div class="portfolio-img" style="background-image: url('/residence.png')"></div>
              <div class="portfolio-info">
                <h3>Rezydencje Marzeń</h3>
                <p>Ełk</p>
              </div>
            </div>
          `}
        </div>
      </section>

      <section id="about" class="about-section glass">
        <div class="container about-container">
          <div class="about-content reveal">
            <h2 class="section-title">O mnie</h2>
            ${aboutData?.bio ? aboutData.bio.map((block: any) => `<p>${block.children[0].text}</p>`).join('') : `
              <p>Cześć! Nazywam się <strong>Anka Kuczewska</strong> i od ponad 8 lat z pasją i zaangażowaniem fotografuję nieruchomości, dbając o to, by każda z nich zachwycała i przyciągała uwagę.</p>
              <p>Współpracuję zarówno z klientami indywidualnymi jak i biznesowymi oferując fotografie, które wspierają sprzedaż i wynajem nieruchomości. Moje doświadczenie łączy się z dokładnością i indywidualnym podejściem do każdego projektu.</p>
            `}
            <a href="#contact" class="btn">Poznajmy się</a>
          </div>
          <div class="about-visual reveal">
             <img src="${aboutData?.imageUrl || '/profile.png'}" alt="Anka Kuczewska" class="about-img">
             <div class="about-stats">
              ${aboutData?.stats ? aboutData.stats.map((stat: any) => `
                <div class="stat-item">
                  <span class="stat-number">${stat.number}</span>
                  <span class="stat-label">${stat.label}</span>
                </div>
              `).join('') : `
                <div class="stat-item">
                  <span class="stat-number">8+</span>
                  <span class="stat-label">Lat doświadczenia</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">500+</span>
                  <span class="stat-label">Zrealizowanych sesji</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">100%</span>
                  <span class="stat-label">Zadowolonych klientów</span>
                </div>
              `}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" class="contact-section container">
        <div class="contact-grid">
          <div class="contact-info reveal">
            <h2 class="section-title">Kontakt</h2>
            <p>Zainteresowany współpracą? Chętnie omówię szczegóły Twojego projektu.</p>
            <div class="contact-details">
              <div class="contact-detail">
                <i class="icon-email"></i>
                <div>
                  <h4>Email</h4>
                  <a href="mailto:anna@kuczewska.com">anna@kuczewska.com</a>
                </div>
              </div>
              <div class="contact-detail">
                <i class="icon-phone"></i>
                <div>
                  <h4>Telefon</h4>
                  <a href="tel:+48511017427">+48 511 017 427</a>
                </div>
              </div>
            </div>
          </div>
          <form class="contact-form reveal">
            <div class="form-group">
              <input type="text" placeholder="Imię i Nazwisko" required>
            </div>
            <div class="form-group">
              <input type="email" placeholder="Email" required>
            </div>
            <div class="form-group">
              <textarea placeholder="W czym mogę pomóc?" rows="5" required></textarea>
            </div>
            <button type="submit" class="btn">Wyślij wiadomość</button>
          </form>
        </div>
      </section>
    </main>

    <footer class="container">
      <div class="footer-content">
        <div class="logo serif">
          ${settings?.logoImageUrl ? `<img src="${settings.logoImageUrl}" alt="Logo" class="logo-img">` : (settings?.logoText || 'KUCZEWSKA')}
        </div>
        <p>&copy; ${new Date().getFullYear()} Kuczewska Fotografia. Wszystkie prawa zastrzeżone.</p>
        <div class="social-links">
          <a href="#">Instagram</a>
          <a href="#">Facebook</a>
        </div>
      </div>
    </footer>
  `

  // Scroll Reveal Logic
  const revealElements = document.querySelectorAll('.reveal');
  const revealOnScroll = () => {
    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight - 100;
      if (isVisible) {
        el.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', revealOnScroll);
  window.addEventListener('load', revealOnScroll);

  // Header background change on scroll
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });
}

initApp();

