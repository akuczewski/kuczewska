import { describe, expect, it, vi } from 'vitest'
import { renderContractView } from './contractView'

const pendingContract = {
  title: 'Umowa o świadczenie usług fotograficznych',
  leadName: 'Jan Kowalski',
  lines: [{ text: 'Sesja mieszkanie — 800,00 zł' }],
  totalLine: 'Wynagrodzenie łącznie: 800,00 zł',
  termsText: 'Treść umowy...',
  status: 'pending',
}

describe('renderContractView', () => {
  it('renders the contract content with a disabled sign button until the checkbox is checked', () => {
    const container = document.createElement('div')

    renderContractView(container, { contract: pendingContract, onSign: vi.fn() })

    expect(container.textContent).toContain('Jan Kowalski')
    expect(container.textContent).toContain('800,00 zł')
    expect(container.textContent).toContain('Treść umowy...')

    const signBtn = container.querySelector<HTMLButtonElement>('.contract-view__sign')!
    expect(signBtn.disabled).toBe(true)
  })

  it('enables the sign button once the acceptance checkbox is checked', () => {
    const container = document.createElement('div')

    renderContractView(container, { contract: pendingContract, onSign: vi.fn() })

    const checkbox = container.querySelector<HTMLInputElement>('.contract-view__ack')!
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))

    const signBtn = container.querySelector<HTMLButtonElement>('.contract-view__sign')!
    expect(signBtn.disabled).toBe(false)
  })

  it('calls onSign when the sign button is clicked after acknowledging', () => {
    const container = document.createElement('div')
    const onSign = vi.fn()

    renderContractView(container, { contract: pendingContract, onSign })

    const checkbox = container.querySelector<HTMLInputElement>('.contract-view__ack')!
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))

    container.querySelector<HTMLButtonElement>('.contract-view__sign')!.click()

    expect(onSign).toHaveBeenCalledOnce()
  })

  it('shows a signed confirmation instead of the form when status is "signed"', () => {
    const container = document.createElement('div')

    renderContractView(container, {
      contract: { ...pendingContract, status: 'signed' },
      onSign: vi.fn(),
    })

    expect(container.querySelector('.contract-view__sign')).toBeNull()
    expect(container.textContent).toContain('podpisana')
  })
})
