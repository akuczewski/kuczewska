import type { Package } from '../../lib/packages'
import { sumOfferLines, packagesToOfferLines } from '../../lib/offers'

export type OfferBuilderDeps = {
  leadName: string
  availablePackages: Package[]
  createOffer: (selected: Package[]) => Promise<string>
  onOfferCreated: (offerId: string) => void
}

function formatGrosze(priceGrosze: number): string {
  return `${(priceGrosze / 100).toFixed(2).replace('.', ',')} zł`
}

export function renderOfferBuilderView(container: HTMLElement, deps: OfferBuilderDeps): void {
  const items = deps.availablePackages
    .map(
      (pkg) => `
        <li>
          <label>
            <input type="checkbox" data-package-id="${pkg.id}" />
            ${pkg.name} — ${formatGrosze(pkg.priceGrosze)}
          </label>
        </li>
      `,
    )
    .join('')

  container.innerHTML = `
    <section class="offer-builder">
      <h1>Nowa oferta dla: ${deps.leadName}</h1>
      <form class="offer-builder">
        <ul class="offer-builder__packages">${items}</ul>
        <p class="offer-builder__total">Razem: 0,00 zł</p>
        <button type="submit">Utwórz ofertę</button>
      </form>
    </section>
  `

  const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
  const totalEl = container.querySelector<HTMLParagraphElement>('.offer-builder__total')!

  function selectedPackages(): Package[] {
    return deps.availablePackages.filter((_pkg, index) => checkboxes[index]!.checked)
  }

  function updateTotal() {
    const total = sumOfferLines(packagesToOfferLines(selectedPackages()))
    totalEl.textContent = `Razem: ${formatGrosze(total)}`
  }

  checkboxes.forEach((checkbox) => checkbox.addEventListener('change', updateTotal))
  updateTotal()

  const form = container.querySelector<HTMLFormElement>('form.offer-builder')!
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    deps.createOffer(selectedPackages()).then((offerId) => {
      deps.onOfferCreated(offerId)
    })
  })
}
