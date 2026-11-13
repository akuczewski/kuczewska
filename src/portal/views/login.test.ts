import { describe, expect, it, vi } from 'vitest'
import { renderLoginView } from './login'

function submitForm(container: HTMLElement, email: string, password: string) {
  const emailInput = container.querySelector<HTMLInputElement>('input[name="email"]')!
  const passwordInput = container.querySelector<HTMLInputElement>('input[name="password"]')!
  emailInput.value = email
  passwordInput.value = password
  const form = container.querySelector<HTMLFormElement>('form.portal-login')!
  form.dispatchEvent(new Event('submit', { cancelable: true }))
}

describe('renderLoginView', () => {
  it('calls onSuccess after a successful sign-in', async () => {
    const container = document.createElement('div')
    const signIn = vi.fn().mockResolvedValue({ uid: 'client-1' })
    const onSuccess = vi.fn()

    renderLoginView(container, { signIn, onSuccess })
    submitForm(container, 'client@example.com', 'secret123')

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    expect(signIn).toHaveBeenCalledWith('client@example.com', 'secret123')
  })

  it('shows an error message and does not call onSuccess when sign-in fails', async () => {
    const container = document.createElement('div')
    const signIn = vi.fn().mockRejectedValue(new Error('Nieprawidłowy e-mail lub hasło.'))
    const onSuccess = vi.fn()

    renderLoginView(container, { signIn, onSuccess })
    submitForm(container, 'client@example.com', 'wrong')

    const errorEl = container.querySelector<HTMLParagraphElement>('.portal-login__error')!
    await vi.waitFor(() => expect(errorEl.hidden).toBe(false))

    expect(errorEl.textContent).toBe('Nieprawidłowy e-mail lub hasło.')
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
