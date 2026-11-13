import type { ContractSummary } from '../../lib/functionsClient'

export type ContractViewDeps = {
  contract: ContractSummary
  onSign: () => void
}

export function renderContractView(container: HTMLElement, deps: ContractViewDeps): void {
  const { contract } = deps

  if (contract.status !== 'pending') {
    container.innerHTML = `
      <section class="contract-view">
        <h1>${contract.title}</h1>
        <p class="contract-view__status">Ta umowa została już podpisana. Dziękujemy!</p>
      </section>
    `
    return
  }

  const lines = contract.lines.map((line) => `<li>${line.text}</li>`).join('')
  const termsParagraphs = contract.termsText
    .split('\n')
    .filter((p) => p.trim().length > 0)
    .map((p) => `<p>${p}</p>`)
    .join('')

  container.innerHTML = `
    <section class="contract-view">
      <h1>${contract.title}</h1>
      <p>Klient: ${contract.leadName}</p>
      <ul class="contract-view__lines">${lines}</ul>
      <p class="contract-view__total">${contract.totalLine}</p>
      <div class="contract-view__terms">${termsParagraphs}</div>
      <label>
        <input type="checkbox" class="contract-view__ack" />
        Oświadczam, że zapoznałam/em się z treścią umowy i akceptuję jej warunki.
      </label>
      <button type="button" class="contract-view__sign" disabled>Podpisuję i rezerwuję termin</button>
    </section>
  `

  const ack = container.querySelector<HTMLInputElement>('.contract-view__ack')!
  const signBtn = container.querySelector<HTMLButtonElement>('.contract-view__sign')!

  ack.addEventListener('change', () => {
    signBtn.disabled = !ack.checked
  })

  signBtn.addEventListener('click', () => {
    deps.onSign()
  })
}
