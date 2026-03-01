const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/**
 * Returns today's date as a YYYY-MM-DD string in **local** time.
 * `new Date().toISOString()` uses UTC, which in negative-offset timezones
 * (e.g. UTC-3 / Brazil) can return the next calendar day after ~21:00.
 */
export function todayISODate(): string {
  return dateToISOLocal(new Date())
}

/**
 * Converts a Date object to a YYYY-MM-DD string using **local** date components.
 * `date.toISOString().slice(0, 10)` uses UTC, which can shift the date in any
 * timezone that is not exactly UTC (e.g. UTC+1 and above can shift forward,
 * UTC-1 and below can shift backward).
 */
export function dateToISOLocal(date: Date): string {
  const yyyy = date.getFullYear()
  const mm   = String(date.getMonth() + 1).padStart(2, '0')
  const dd   = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Parses a YYYY-MM-DD string as **local** midnight.
 * `new Date("YYYY-MM-DD")` is parsed as UTC, which shifts the date one day
 * back in negative-offset timezones (e.g. UTC-3 / Brazil).
 * Appending T00:00:00 (no timezone) forces local-time interpretation per spec.
 */
export function parseISODate(isoDate: string): Date {
  return new Date(isoDate + "T00:00:00")
}

export function formatDate(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  let d: Date
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    d = parseISODate(value)
  } else {
    d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value
  }
  if (isNaN(d.getTime())) return '—'
  return dateFormatter.format(d)
}

