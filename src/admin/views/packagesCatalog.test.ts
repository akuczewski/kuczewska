import { describe, expect, it, vi } from 'vitest'
import { renderPackagesCatalogView } from './packagesCatalog'

function submitNewPackageForm(
  container: HTMLElement,
  name: string,
  description: string,
  priceZl: string,
) {
  const nameInput = container.querySelector<HTMLInputElement>('input[name="name"]')!
  const descriptionInput = container.querySelector<HTMLTextAreaElement>('textarea[name="description"]')!
  const priceInput = container.querySelector<HTMLInputElement>('input[name="priceZl"]')!
  nameInput.value = name
  descriptionInput.value = description
  priceInput.value = priceZl
  const form = container.querySelector<HTMLFormElement>('form.admin-new-package')!
  form.dispatchEvent(new Event('submit', { cancelable: true }))
}

describe('renderPackagesCatalogView', () => {
  it('renders each package with its price formatted in złoty', () => {
    const container = document.createElement('div')

    renderPackagesCatalogView(container, {
      packages: [
        { id: 'p1', name: 'Sesja mieszkanie', description: 'Do 25 zdjęć', priceGrosze: 80000, active: true },
        { id: 'p2', name: 'Premium', description: 'Do 60 zdjęć', priceGrosze: 150050, active: false },
      ],
      createPackage: vi.fn(),
      onPackageCreated: vi.fn(),
      onToggleActive: vi.fn(),
      onUpdatePackage: vi.fn(),
    })

    const items = container.querySelectorAll('.admin-packages-list li')
    expect(items).toHaveLength(2)
    expect(items[0]!.textContent).toContain('Sesja mieszkanie')
    expect(items[0]!.textContent).toContain('800,00 zł')
    expect(items[1]!.textContent).toContain('1500,50 zł')
  })

  it('creates a new package from the form, converting złoty to grosze', async () => {
    const container = document.createElement('div')
    const createPackage = vi.fn().mockResolvedValue('package-42')
    const onPackageCreated = vi.fn()

    renderPackagesCatalogView(container, {
      packages: [],
      createPackage,
      onPackageCreated,
      onToggleActive: vi.fn(),
      onUpdatePackage: vi.fn(),
    })

    submitNewPackageForm(container, 'Sesja domu', 'Do 40 zdjęć', '1200.50')

    await vi.waitFor(() => expect(onPackageCreated).toHaveBeenCalledWith('package-42'))
    expect(createPackage).toHaveBeenCalledWith({
      name: 'Sesja domu',
      description: 'Do 40 zdjęć',
      priceGrosze: 120050,
    })
  })

  it('calls onToggleActive with the flipped state when a toggle button is clicked', () => {
    const container = document.createElement('div')
    const onToggleActive = vi.fn()

    renderPackagesCatalogView(container, {
      packages: [{ id: 'p1', name: 'A', description: 'a', priceGrosze: 1000, active: true }],
      createPackage: vi.fn(),
      onPackageCreated: vi.fn(),
      onToggleActive,
      onUpdatePackage: vi.fn(),
    })

    container.querySelector<HTMLButtonElement>('[data-action="toggle-active"]')!.click()

    expect(onToggleActive).toHaveBeenCalledWith('p1', false)
  })

  it('reveals an edit form pre-filled with the package data when "Edytuj" is clicked', () => {
    const container = document.createElement('div')

    renderPackagesCatalogView(container, {
      packages: [{ id: 'p1', name: 'Sesja mieszkanie', description: 'Do 25 zdjęć', priceGrosze: 80000, active: true }],
      createPackage: vi.fn(),
      onPackageCreated: vi.fn(),
      onToggleActive: vi.fn(),
      onUpdatePackage: vi.fn(),
    })

    const editForm = container.querySelector<HTMLFormElement>('.package-edit-form')!
    expect(editForm.hidden).toBe(true)

    container.querySelector<HTMLButtonElement>('[data-action="edit"]')!.click()

    expect(editForm.hidden).toBe(false)
    expect(editForm.querySelector<HTMLInputElement>('input[name="name"]')!.value).toBe('Sesja mieszkanie')
    expect(editForm.querySelector<HTMLInputElement>('input[name="priceZl"]')!.value).toBe('800.00')
  })

  it('calls onUpdatePackage with the edited values converted to grosze', () => {
    const container = document.createElement('div')
    const onUpdatePackage = vi.fn()

    renderPackagesCatalogView(container, {
      packages: [{ id: 'p1', name: 'Sesja mieszkanie', description: 'Do 25 zdjęć', priceGrosze: 80000, active: true }],
      createPackage: vi.fn(),
      onPackageCreated: vi.fn(),
      onToggleActive: vi.fn(),
      onUpdatePackage,
    })

    container.querySelector<HTMLButtonElement>('[data-action="edit"]')!.click()
    const editForm = container.querySelector<HTMLFormElement>('.package-edit-form')!
    editForm.querySelector<HTMLInputElement>('input[name="name"]')!.value = 'Sesja mieszkanie XL'
    editForm.querySelector<HTMLTextAreaElement>('textarea[name="description"]')!.value = 'Do 35 zdjęć'
    editForm.querySelector<HTMLInputElement>('input[name="priceZl"]')!.value = '950.00'
    editForm.dispatchEvent(new Event('submit', { cancelable: true }))

    expect(onUpdatePackage).toHaveBeenCalledWith('p1', {
      name: 'Sesja mieszkanie XL',
      description: 'Do 35 zdjęć',
      priceGrosze: 95000,
    })
  })
})
