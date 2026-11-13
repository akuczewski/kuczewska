export type BookingCalendarDeps = {
  bookedDates: string[]
  onBookDate: (date: string) => void
}

export function renderBookingCalendarView(container: HTMLElement, deps: BookingCalendarDeps): void {
  container.innerHTML = `
    <section class="booking-calendar-view">
      <h1>Wybierz termin sesji</h1>
      <p>Umowa podpisana! Wybierz dostępny dzień na sesję zdjęciową.</p>
      <form class="booking-calendar">
        <label>
          Data sesji
          <input type="date" name="date" required />
        </label>
        <p class="booking-calendar__error" role="alert" hidden>Ten termin jest już zajęty. Wybierz inny.</p>
        <button type="submit">Rezerwuję termin</button>
      </form>
    </section>
  `

  const form = container.querySelector<HTMLFormElement>('form.booking-calendar')!
  const dateInput = container.querySelector<HTMLInputElement>('input[type="date"]')!
  const errorEl = container.querySelector<HTMLParagraphElement>('.booking-calendar__error')!

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const date = dateInput.value

    if (deps.bookedDates.includes(date)) {
      errorEl.hidden = false
      return
    }

    errorEl.hidden = true
    deps.onBookDate(date)
  })
}
