export type LoginDeps = {
  signIn: (email: string, password: string) => Promise<unknown>
  onSuccess: () => void
}

export function renderLoginView(container: HTMLElement, deps: LoginDeps): void {
  container.innerHTML = `
    <form class="portal-login" novalidate>
      <h1>Logowanie klienta</h1>
      <label>
        E-mail
        <input type="email" name="email" required autocomplete="username" />
      </label>
      <label>
        Hasło
        <input type="password" name="password" required autocomplete="current-password" />
      </label>
      <p class="portal-login__error" role="alert" hidden></p>
      <button type="submit">Zaloguj się</button>
    </form>
  `

  const form = container.querySelector<HTMLFormElement>('form.portal-login')!
  const errorEl = container.querySelector<HTMLParagraphElement>('.portal-login__error')!

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    errorEl.hidden = true

    const formData = new FormData(form)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    deps.signIn(email, password).then(
      () => deps.onSuccess(),
      (err: unknown) => {
        errorEl.textContent = err instanceof Error ? err.message : 'Nie udało się zalogować.'
        errorEl.hidden = false
      },
    )
  })
}
