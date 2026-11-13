import { describe, expect, it, vi } from 'vitest'
import { renderBookingCalendarView } from './bookingCalendar'

describe('renderBookingCalendarView', () => {
  it('calls onBookDate with the chosen date', () => {
    const container = document.createElement('div')
    const onBookDate = vi.fn()

    renderBookingCalendarView(container, { bookedDates: ['2026-08-15'], onBookDate })

    const input = container.querySelector<HTMLInputElement>('input[type="date"]')!
    input.value = '2026-09-01'
    container.querySelector<HTMLFormElement>('form.booking-calendar')!.dispatchEvent(
      new Event('submit', { cancelable: true }),
    )

    expect(onBookDate).toHaveBeenCalledWith('2026-09-01')
  })

  it('shows an error and does not call onBookDate when the chosen date is already booked', () => {
    const container = document.createElement('div')
    const onBookDate = vi.fn()

    renderBookingCalendarView(container, { bookedDates: ['2026-08-15'], onBookDate })

    const input = container.querySelector<HTMLInputElement>('input[type="date"]')!
    input.value = '2026-08-15'
    container.querySelector<HTMLFormElement>('form.booking-calendar')!.dispatchEvent(
      new Event('submit', { cancelable: true }),
    )

    expect(onBookDate).not.toHaveBeenCalled()
    const errorEl = container.querySelector<HTMLParagraphElement>('.booking-calendar__error')!
    expect(errorEl.hidden).toBe(false)
  })
})
