# SPEC — Kuczewska.com: strona + portal klienta + CRM sprzedażowy

## 1. Cel (Objective)

Przebudowa strony fotografki wnętrz/nieruchomości Anny Kuczewskiej (obecnie na Wix; w tym repo trwa migracja na Vite + TypeScript + Sanity CMS, docelowy hosting Render) w trzech niezależnych torach pracy:

**Tor A — Strona wizytówka.** Refresh wizualny zbliżający obecną (Vite/Sanity) wersję do estetyki dotychczasowej strony kuczewska.com: minimalistyczny, gallery-focused układ, jasne tło, duże zdjęcia na pierwszym planie, stonowana luksusowa typografia (serif nagłówki + sans treść), sekcje: Główna, Realizacje (portfolio), O mnie, Kontakt. Model treści w Sanity (`portfolioItem`, `aboutPage`, `siteSettings`) już istnieje i **nie zmienia się** — to zadanie czysto warstwy prezentacji.

**Tor B — Portal klienta (zaimplementowany).** Backend: **Firebase** (Auth + Firestore + Storage). Przepływ: Anna zakłada sesję i wgrywa surowe zdjęcia (automatyczny, trwały znak wodny wypalony w pikselach) → klient loguje się, zaznacza zdjęcia do obróbki → Anna wgrywa gotowe zdjęcia → klient loguje się i pobiera gotowy album. Pełny opis w sekcji 2 i historii slice'ów w sekcji 6 (Tor B) — **status: zaimplementowany i przetestowany** (44 testy jednostkowe + 25 testów reguł na emulatorze).

**Tor C — CRM sprzedażowy (nowa funkcjonalność, ten dokument).** Proces od pierwszego kontaktu do rezerwacji terminu, spinający się z już istniejącym Torem B:

```
Lead → Oferta → Wysyłka oferty → Akceptacja/Odrzucenie → Umowa → Podpis → Rezerwacja terminu → (utworzenie Sesji z Toru B)
```

1. **Lead** trafia do systemu z formularza kontaktowego na stronie (zamiast dzisiejszego formsubmit.co) albo jest dodawany ręcznie przez Annę (telefon, Instagram DM).
2. Anna tworzy **Ofertę** w panelu CRM, wybierając jeden lub kilka pakietów z gotowego **katalogu cenowego** (nie dowolna wycena ręczna za każdym razem).
3. System (Cloud Function) generuje PDF oferty i wysyła klientowi mailem (Resend) link z unikalnym tokenem — bez potrzeby logowania.
4. Klient na publicznej stronie oferty klika **Akceptuję** albo **Odrzucam**.
5. Akceptacja automatycznie generuje **Umowę** (PDF) i wysyła kolejny link z tokenem.
6. Klient akceptuje umowę **prostym kliknięciem** ("Oświadczam, że zapoznałam/em się z treścią i akceptuję" + przycisk) — zapisujemy timestamp, IP, user-agent i treść umowy w danym momencie jako dowód. **Bez integracji z zewnętrznym dostawcą podpisu elektronicznego w v1.**
7. Po podpisaniu klient widzi kalendarz dostępnych terminów Anny i **sam wybiera datę sesji** — system pilnuje (transakcja Firestore), żeby dwie osoby nie zarezerwowały tego samego dnia.
8. Rezerwacja automatycznie tworzy **Sesję** w już istniejącym modelu Toru B (ten sam `sessions/{sessionId}`) i **konto klienta w Firebase Auth** (jeśli jeszcze nie istnieje) — klient dostaje mailem link do ustawienia hasła (Firebase `generatePasswordResetLink`, wysłany przez Resend), a dalej korzysta z już gotowego portalu (logowanie → album RAW z selekcją → gotowy album).

**Świadomie poza zakresem v1 (do potwierdzenia w kolejnej iteracji):**
- Płatność zadatku / integracja z bramką płatności (Przelewy24, PayU) — rezerwacja terminu **nie wymaga** wpłaty w v1.
- Multi-tenant SaaS dla wielu fotografów — v1 to rozbudowa dedykowana Annie (jeden zestaw uprawnień `admin`). Modelujemy dane tak, żeby nie zamykać sobie drogi (np. osobne kolekcje per typ danych, nie jeden "worek"), ale **nie budujemy** izolacji per-najemca, panelu rozliczeń SaaS ani onboardingu innych fotografów teraz — to świadomie odłożone na osobny, późniejszy projekt.
- Ochrona antyspamowa formularza kontaktowego (np. reCAPTCHA) — v1 ma tylko walidację pól w regułach Firestore.

**Kryteria akceptacji (v1, Tor C):**
- Lead utworzony przez formularz publiczny nie jest nigdzie czytelny publicznie (tylko `create`, nigdy `read/update/delete` bez roli admina).
- Link do oferty/umowy działa tylko z poprawnym tokenem; zgadywanie/błędny token nie ujawnia żadnych danych.
- Nie da się zarezerwować tego samego terminu dwa razy (test współbieżności / transakcji).
- Umowa nie może zostać podpisana dwa razy ani zmieniona po podpisaniu (status `signed` jest końcowy).
- Od momentu rezerwacji terminu klient korzysta z Toru B bez żadnych zmian w tamtym kodzie — Tor C tylko **tworzy** dane wejściowe (`sessions/{sessionId}`, konto klienta), nie modyfikuje logiki portalu.

## 2. Decyzje architektoniczne (skrót ustaleń)

| Decyzja | Wybór |
|---|---|
| Backend (Tor B) | Firebase (Auth + Firestore + Storage) |
| Backend (Tor C) | **Firebase Cloud Functions** (Node) — jedyny bezpieczny sposób generowania PDF i wysyłki maili; wymaga planu Blaze (i tak potrzebnego pod Storage) |
| Onboarding klienta (Tor B, ścieżka ręczna) | Anna może nadal ręcznie założyć sesję + konto — zostaje jako "furtka" dla klientów spoza lejka CRM |
| Onboarding klienta (Tor C, ścieżka przez CRM) | Konto zakładane **automatycznie** po rezerwacji terminu (Admin SDK), klient ustawia hasło przez link resetu wysłany mailem |
| Panel fotografki | Jeden, dedykowany panel w tej samej appce (nie w Sanity Studio), rozszerzony o widoki CRM |
| Hosting | Render (statyczny build Vite) dla frontendu; Cloud Functions hostowane przez Firebase |
| Znak wodny (Tor B) | Wypalany w przeglądarce fotografki (canvas) przed uploadem — bez zmian |
| Podpis umowy | Proste potwierdzenie kliknięciem (checkbox + timestamp + IP + user-agent + snapshot treści) — **nie** kwalifikowany podpis elektroniczny |
| Struktura oferty | Katalog gotowych pakietów (`packages`), oferta zamraża (snapshot) nazwę i cenę pakietu w momencie utworzenia |
| Rezerwacja terminu | Klient sam wybiera datę z kalendarza dostępności Anny, po podpisaniu umowy |
| Płatność/zadatek | Poza zakresem v1 |
| Generator PDF | `pdf-lib` w Cloud Functions (lekki, bez headless Chrome/Puppeteer — szybszy cold start) |
| Dostawca e-mail | Resend (wymaga weryfikacji domeny kuczewska.com: rekordy SPF/DKIM) |
| Dostęp publiczny do ofert/umów | **Wyłącznie przez Cloud Functions (callable)**, nigdy bezpośredni odczyt Firestore z klienta — token weryfikowany po stronie serwera, Firestore rules dla `leads`/`packages`/`offers`/`contracts`/`bookings` są w 100% `admin`-only |
| Multi-tenant SaaS | Świadomie odłożone — osobny projekt po walidacji MVP na Annie |

## 3. Komendy (Commands)

```bash
npm run dev             # vite dev server — strona + portal + panel admina (jedna SPA)
npm run test            # vitest run — testy jednostkowe (web app)
npm run test:watch      # vitest --watch — pętla red/green/refactor podczas TDD
npm run test:rules      # firebase emulators:exec — testy reguł Firestore/Storage (rules-unit-testing)
npm run emulators       # firebase emulators:start (auth, firestore, storage[, functions]) — lokalny backend
npm run build           # tsc && vite build
npm run typecheck       # tsc --noEmit
```

Nowe komendy w `functions/` (osobny pakiet Node, patrz sekcja 4):
```bash
cd functions
npm run test            # vitest run — czyste funkcje (kalkulacja ceny, treść PDF/maila, weryfikacja tokenu)
npm run build            # tsc
```

Deploy (rozdzielony, żeby nie mieszać ryzyka):
```bash
firebase deploy --only firestore:rules,storage:rules   # reguły bezpieczeństwa
firebase deploy --only functions                       # Cloud Functions (osobno, po testach)
```
Deploy frontendu: push do gałęzi połączonej z Render (auto-deploy) — bez ręcznej komendy w tym repo.

## 4. Struktura projektu (Project structure)

```
src/
  marketing/                # Tor A
  portal/                   # Tor B (zaimplementowane) — logowanie klienta, album RAW/gotowe
  admin/                    # Tor B + Tor C — panel fotografki
    views/
      sessionsList.ts / sessionUpload.ts / selectionsReview.ts   # Tor B (gotowe)
      leadsList.ts          # Tor C — lista leadów + ręczne dodawanie (NOWE)
      packagesCatalog.ts    # Tor C — CRUD katalogu pakietów (NOWE)
      offerBuilder.ts       # Tor C — tworzenie i wysyłka oferty dla leada (NOWE)
  booking/                  # Tor C — publiczne, token-gated widoki dla leada/klienta (NOWE, bez logowania)
    views/
      offerView.ts          # akceptacja/odrzucenie oferty
      contractView.ts       # podpis umowy
      bookingCalendar.ts    # wybór terminu z dostępnego kalendarza
  lib/
    firebase.ts / auth.ts / sessions.ts / photos.ts / watermark.ts   # Tor B (gotowe)
    leads.ts / offers.ts / contracts.ts / bookings.ts / packages.ts  # Tor C — dostęp do danych CRM (NOWE)
firebase/
  firestore.rules
  storage.rules
functions/                  # NOWY pakiet — Cloud Functions (Node, osobny package.json/tsconfig)
  src/
    lib/                    # czyste funkcje testowane Vitestem, bez efektów ubocznych
      pricing.ts            # sumowanie cen pakietów -> totalPriceGrosze
      tokens.ts             # generowanie/weryfikacja publicznych tokenów
      offerPdf.ts           # budowanie treści PDF oferty (pdf-lib)
      contractPdf.ts        # budowanie treści PDF umowy
      emailTemplates.ts     # treść maili (temat + HTML) do Resend
    sendOffer.ts            # callable: generuje PDF, zapisuje Storage, wysyła mail, status -> 'sent'
    respondToOffer.ts       # callable (publiczny + token): accept/reject
    signContract.ts         # callable (publiczny + token): zapisuje podpis
    getAvailableDates.ts    # callable (publiczny): zwraca tylko zajęte daty, bez danych leada
    createBooking.ts        # callable (publiczny + token): transakcja rezerwacji + tworzy Session + konto klienta
```

**Model danych — nowe kolekcje Firestore (Tor C):**
```
packages/{packageId}
  name: string
  description: string
  priceGrosze: number
  active: boolean

leads/{leadId}
  name: string
  email: string
  phone: string | null
  message: string | null
  source: 'contact_form' | 'manual'
  status: 'new' | 'offer_sent' | 'accepted' | 'rejected' | 'archived'
  createdAt: timestamp

offers/{offerId}
  leadId: string
  lines: Array<{ packageId: string, name: string, priceGrosze: number }>   # snapshot, nie referencja
  totalPriceGrosze: number
  publicToken: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  pdfStoragePath: string | null
  validUntil: timestamp
  createdAt: timestamp
  respondedAt: timestamp | null

contracts/{contractId}
  offerId: string
  leadId: string
  publicToken: string
  status: 'pending' | 'signed'
  pdfStoragePath: string | null
  contentSnapshot: string
  signedAt: timestamp | null
  signedIp: string | null
  signedUserAgent: string | null
  createdAt: timestamp

bookings/{dateId}            # dateId = 'YYYY-MM-DD' — klucz dokumentu = naturalna blokada podwójnej rezerwacji
  contractId: string
  leadId: string
  sessionId: string           # link do sessions/{sessionId} z Toru B
  createdAt: timestamp
```

**Reguły dostępu (Tor C):** wszystkie powyższe kolekcje są **admin-only** w `firestore.rules` (bez wyjątków dla publicznych/tokenowych odczytów — te idą wyłącznie przez Cloud Functions z Admin SDK, który omija reguły po weryfikacji tokenu w kodzie funkcji). Wyjątek: `leads` pozwala też na `create` (bez `read/update/delete`) dla niezalogowanych, z walidacją wymaganych pól w regule — to obsługuje publiczny formularz kontaktowy.

## 5. Styl kodu (Code style)

- Kontynuacja stylu Toru B: vanilla TypeScript, bez frameworka UI, funkcje nie klasy, logika oddzielona od DOM, plik testu obok modułu.
- `functions/` to osobny pakiet Node (własny `package.json`, `tsconfig.json`) — Cloud Functions też w TypeScript, też bez `any`, też z czystymi funkcjami testowanymi Vitestem tam, gdzie to możliwe (patrz `functions/src/lib/`).
- Granica "impure" (Admin SDK, Storage, Resend, pdf-lib rendering) jest cienka i **celowo nietestowana jednostkowo** — dokładnie ten sam wyjątek co dla `watermarkImage()` w Torze B: logika (ceny, treść PDF/maila, weryfikacja tokenu) jest wydzielona do czystych funkcji i testowana, sama integracja nie.
- Ceny w groszach (liczba całkowita), nie w złotówkach jako float — unika błędów zaokrągleń.

## 6. Strategia testowania (Testing strategy) — TDD + vertical slices

Zasada i wyjątki jak w Torze B (patrz historia poniżej) — dotyczy też Toru C.

### Historia slice'ów — Tor B (zaimplementowane)
1. Fundament `lib/firebase.ts` + emulator. 2. Logowanie klienta + guard + reguły sesji. 3. Panel admina — tworzenie sesji + reguły. 4. Watermark + upload RAW + reguły Storage. 5. Album klienta (RAW). 6. Selekcja klienta + reguły photos. 7. Panel admina — przegląd selekcji. 8. Upload gotowych zdjęć + status sesji + reguły Storage `finished/`. 9. Album klienta (gotowe).

### Kolejność slice'ów — Tor C (do zrobienia, w tej kolejności)

1. **Katalog pakietów (admin):** `lib/packages.ts` (CRUD) + `admin/views/packagesCatalog.ts`. Reguły: tylko admin czyta/pisze `packages`.
2. **Leady — model + panel admina:** `lib/leads.ts` + `admin/views/leadsList.ts` (lista + ręczne dodawanie). Reguły: admin pełny dostęp.
3. **Publiczny formularz kontaktowy → Lead:** zamiana istniejącego formsubmit.co na zapis do `leads` (source: `contact_form`). Reguła Firestore: `create`-only dla niezalogowanych, z walidacją pól (brak `read/update/delete`). Test reguł: niezalogowany może utworzyć poprawny dokument, nie może go odczytać ani utworzyć z brakującymi/dodatkowymi polami.
4. **Generator oferty (admin):** `lib/offers.ts` (tworzenie oferty z listy `packageIds` → snapshot `lines` + `totalPriceGrosze`, funkcja licząca sumę testowana jednostkowo w `functions/src/lib/pricing.ts` i reużyta/lustrzana we froncie). `admin/views/offerBuilder.ts`.
5. **Wysyłka oferty (Cloud Function `sendOffer`):** `functions/src/lib/offerPdf.ts` (czysta funkcja: dane oferty → struktura treści PDF) + `functions/src/lib/tokens.ts` (generowanie/weryfikacja) testowane jednostkowo. `sendOffer.ts` (impure: pdf-lib render, Storage upload, Resend) — bez testu jednostkowego, zgodnie z wyjątkiem w sekcji 5.
6. **Publiczny widok oferty + akceptacja/odrzucenie:** `booking/views/offerView.ts` (DOM, DI callback) + `functions/respondToOffer.ts` (callable, weryfikuje token, accept → generuje umowę).
7. **Generator umowy (Cloud Function `generateContract`, wywoływany wewnętrznie z `respondToOffer` przy akceptacji):** analogicznie do slice'u 5 — `functions/src/lib/contractPdf.ts` testowane jednostkowo.
8. **Publiczny widok umowy + podpis:** `booking/views/contractView.ts` (checkbox + przycisk) + `functions/signContract.ts` (callable: token, status `pending`→`signed`, zapisuje timestamp/IP/user-agent/snapshot). Test reguł/funkcji: nie da się podpisać dwa razy, nie da się podpisać bez poprawnego tokenu.
9. **Kalendarz dostępności + rezerwacja terminu:** `functions/getAvailableDates.ts` (callable, zwraca tylko zajęte daty) + `booking/views/bookingCalendar.ts` + `functions/createBooking.ts` (callable: transakcja Firestore na `bookings/{dateId}` — zapobiega podwójnej rezerwacji; tworzy `sessions/{sessionId}` w modelu Toru B; tworzy/odnajduje konto klienta w Auth i wysyła link resetu hasła). Test: dwie równoczesne próby rezerwacji tej samej daty — dokładnie jedna się udaje (test transakcji na emulatorze).

### Tor B — rozszerzenie: wygodny wybór zdjęć (zaimplementowane 2026-11-13)

Zmiana świadomie dotyka Toru B (na prośbę właściciela), bez zmian w Torze C poza nową funkcją `submitSelection`.

- **Nazwy plików:** przy wgrywaniu zapisujemy `originalName` (nazwa pliku z dysku fotografki). Panel pokazuje listę nazw wybranych zdjęć z przyciskami „Kopiuj listę plików" i „Kopiuj bez rozszerzeń, w jednej linii" (do filtra w Lightroomie / wyszukiwarce — pasuje też do plików RAW). Zdjęcia wgrane wcześniej nie mają `originalName` i pokazują nazwę ze Storage.
- **Serduszka zamiast pól wyboru**, licznik „Wybrano X z Y w pakiecie" (`sessions.selectionLimit`, opcjonalne pole przy tworzeniu sesji). Limit jest **miękki**: klient może wybrać więcej, widzi „N ponad pakiet".
- **Powiększenie** zdjęcia (strzałki, Esc) i **uwaga do obróbki** (`photos.clientNote`, max 1000 znaków) dla wybranych kadrów.
- **„Zatwierdzam wybór"** → callable `submitSelection` (tylko przypisany klient, tylko status `raw`, min. 1 zdjęcie, w transakcji): status sesji → `selection_done`, e-mail do fotografki (`ADMIN_NOTIFY_EMAIL`, domyślnie anna@kuczewska.com) z listą plików i uwagami. Błąd wysyłki maila nie cofa zatwierdzenia.
- **Blokada po zatwierdzeniu** w `firestore.rules`: klient zmienia `selectedByClient`/`clientNote` wyłącznie gdy sesja ma status `raw`. Fotografka może odblokować wybór („Odblokuj wybór klienta" → status wraca do `raw`).
- **Gotowy album:** „Pobierz wszystkie" pobiera pliki po kolei pod oryginalnymi nazwami (bez ZIP — płaskie zużycie pamięci na telefonie). Wymaga konfiguracji CORS na buckecie Storage (`storage.cors.json`).
- **Wgrywanie:** pliki idą pojedynczo z licznikiem postępu; widok odświeża się po zakończeniu.
- **Wygląd:** portal, CRM i widoki ofert/umów używają jasnej palety strony (biel/grafit/niebieski akcent).

## 7. Granice (Boundaries)

**Zawsze (dotyczy też Toru C):**
- Test przed implementacją dla każdej nowej logiki (red → green → refactor); czyste funkcje w `functions/src/lib/` zawsze testowane jednostkowo przed spięciem z Admin SDK/Resend/pdf-lib.
- Firestore rules dla `leads`/`packages`/`offers`/`contracts`/`bookings` są domyślnie `admin`-only; jedyny wyjątek to `create` na `leads` z publicznego formularza (z walidacją pól).
- Publiczny dostęp do oferty/umowy/kalendarza **wyłącznie** przez callable Cloud Functions z weryfikacją tokenu po stronie serwera — nigdy bezpośredni odczyt Firestore z niezalogowanej przeglądarki.
- Ceny przechowywane w groszach (liczba całkowita).
- Umowa `signed` jest stanem końcowym — brak ścieżki edycji/ponownego podpisu w kodzie.
- Sekrety (Resend API key, ewentualne klucze płatności w przyszłości) tylko jako Firebase Functions config/secret — nigdy w repo.

**Zapytaj najpierw:**
- Wszystko z dotychczasowej listy (produkcyjny Firebase, Blaze, deploy Render, DNS kuczewska.com) — bez zmian.
- Założenie konta Resend i weryfikacja domeny kuczewska.com (rekordy SPF/DKIM) — wymaga dostępu do panelu DNS.
- Pierwszy realny `firebase deploy --only functions` na produkcyjnym projekcie.
- Wysyłka pierwszego prawdziwego maila do prawdziwego leada/klienta (nie testowego adresu).
- Treść prawna umowy/regulaminu — to nie jest coś, co powinienem redagować bez Twojej weryfikacji (albo prawnika) przed pierwszym realnym użyciem.
- Ostateczna treść i ceny w katalogu pakietów.

**Nigdy:**
- Nigdy nie loguj/nie zwracaj publicznie treści `leads`/`offers`/`contracts` bez poprawnego tokenu zweryfikowanego po stronie serwera.
- Nigdy nie dodawaj płatności/zadatku bez wyraźnej, osobnej decyzji (poza zakresem v1).
- Nigdy nie zmieniaj Toru B (portal klienta) w ramach budowy Toru C — Tor C tylko tworzy dane wejściowe (Session, konto klienta), nie modyfikuje logiki albumu/watermarku/selekcji.
- Nigdy nie commituj kluczy Resend/Firebase service account do repozytorium.

---

**Otwarta kwestia do potwierdzenia:** treść/wzór umowy i regulaminu — potrzebuję od Ciebie (lub Twojego prawnika) rzeczywistej treści prawnej do wypełnienia szablonu w `functions/src/lib/contractPdf.ts`. Do tego czasu w kodzie/testach będzie działał tylko przykładowy tekst placeholder, wyraźnie oznaczony jako niegotowy do realnego użycia.
