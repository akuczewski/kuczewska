import type { NewPackage, Package } from '../../lib/packages'

export type PackagesCatalogDeps = {
  packages: Package[]
  createPackage: (input: NewPackage) => Promise<string>
  onPackageCreated: (packageId: string) => void
  onToggleActive: (packageId: string, active: boolean) => void
  onUpdatePackage: (packageId: string, input: NewPackage) => void
}

function formatGrosze(priceGrosze: number): string {
  return `${(priceGrosze / 100).toFixed(2).replace('.', ',')} zł`
}

function grosze2zl(priceGrosze: number): string {
  return (priceGrosze / 100).toFixed(2)
}

export function renderPackagesCatalogView(container: HTMLElement, deps: PackagesCatalogDeps): void {
  const items = deps.packages
    .map(
      (pkg) => `
        <li data-package-id="${pkg.id}">
          <strong>${pkg.name}</strong> — ${formatGrosze(pkg.priceGrosze)}
          <span class="status-badge status-badge--${pkg.active ? 'active' : 'inactive'}">${pkg.active ? 'aktywny' : 'nieaktywny'}</span>
          <p>${pkg.description}</p>
          <button type="button" data-action="toggle-active">
            ${pkg.active ? 'Dezaktywuj' : 'Aktywuj'}
          </button>
          <button type="button" data-action="edit">Edytuj</button>

          <form class="package-edit-form" hidden>
            <label>
              Nazwa
              <input type="text" name="name" value="${pkg.name}" required />
            </label>
            <label>
              Opis
              <textarea name="description" required>${pkg.description}</textarea>
            </label>
            <label>
              Cena (zł)
              <input type="number" name="priceZl" step="0.01" min="0" value="${grosze2zl(pkg.priceGrosze)}" required />
            </label>
            <button type="submit">Zapisz zmiany</button>
          </form>
        </li>
      `,
    )
    .join('')

  container.innerHTML = `
    <section class="admin-packages">
      <h1>Katalog pakietów</h1>
      <ul class="admin-packages-list">${items}</ul>
      <form class="admin-new-package" novalidate>
        <h2>Nowy pakiet</h2>
        <label>
          Nazwa
          <input type="text" name="name" required />
        </label>
        <label>
          Opis
          <textarea name="description" required></textarea>
        </label>
        <label>
          Cena (zł)
          <input type="number" name="priceZl" step="0.01" min="0" required />
        </label>
        <button type="submit">Dodaj pakiet</button>
      </form>
    </section>
  `

  container.querySelectorAll<HTMLLIElement>('.admin-packages-list li').forEach((item, index) => {
    const pkg = deps.packages[index]!
    const toggleBtn = item.querySelector<HTMLButtonElement>('[data-action="toggle-active"]')!
    toggleBtn.addEventListener('click', () => {
      deps.onToggleActive(pkg.id, !pkg.active)
    })

    const editForm = item.querySelector<HTMLFormElement>('.package-edit-form')!
    const editBtn = item.querySelector<HTMLButtonElement>('[data-action="edit"]')!
    editBtn.addEventListener('click', () => {
      editForm.hidden = !editForm.hidden
    })

    editForm.addEventListener('submit', (event) => {
      event.preventDefault()
      const formData = new FormData(editForm)
      const name = String(formData.get('name') ?? '')
      const description = String(formData.get('description') ?? '')
      const priceZl = Number(formData.get('priceZl') ?? 0)
      deps.onUpdatePackage(pkg.id, { name, description, priceGrosze: Math.round(priceZl * 100) })
    })
  })

  const form = container.querySelector<HTMLFormElement>('form.admin-new-package')!
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '')
    const description = String(formData.get('description') ?? '')
    const priceZl = Number(formData.get('priceZl') ?? 0)
    const priceGrosze = Math.round(priceZl * 100)

    deps.createPackage({ name, description, priceGrosze }).then((packageId) => {
      deps.onPackageCreated(packageId)
    })
  })
}
