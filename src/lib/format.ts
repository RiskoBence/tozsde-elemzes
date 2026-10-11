const TZ = 'Europe/Budapest';

/** 'YYYY-MM-DD' → Date délben (UTC), hogy az időzóna ne tolja el a napot. */
function datumbol(datum: string): Date {
  const [ev, ho, nap] = datum.split('-').map(Number);
  return new Date(Date.UTC(ev, ho - 1, nap, 12));
}

/** „2026. október 12.” */
export function datumHosszu(datum: string): string {
  return new Intl.DateTimeFormat('hu-HU', { timeZone: TZ, year: 'numeric', month: 'long', day: 'numeric' }).format(datumbol(datum));
}

/** „2026. 10. 12.” */
export function datumRovid(datum: string): string {
  return new Intl.DateTimeFormat('hu-HU', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(datumbol(datum));
}

/** „hétfő” */
export function napNeve(datum: string): string {
  return new Intl.DateTimeFormat('hu-HU', { timeZone: TZ, weekday: 'long' }).format(datumbol(datum));
}

/** „2026. október” */
export function honapNeve(honap: string): string {
  return new Intl.DateTimeFormat('hu-HU', { timeZone: TZ, year: 'numeric', month: 'long' }).format(datumbol(`${honap}-15`));
}
