/** Belső link a `base` figyelembevételével (GitHub Pages alútvonal). */
export function url(utvonal = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const ut = utvonal.replace(/^\//, '');
  return `${base}/${ut}`;
}
