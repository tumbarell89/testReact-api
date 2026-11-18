import { useCallback, useSyncExternalStore } from 'react'

/**
 * Punto de corte entre la vista de una columna (móvil) y la de dos columnas.
 * Debe coincidir con el `@media (width >= 50rem)` de index.css: JS decide si el detalle
 * se abre en un <dialog> y CSS decide el layout, así que ambos usan la misma condición.
 */
export const NARROW_VIEWPORT_QUERY = '(width < 50rem)'

/**
 * Devuelve si `query` coincide y se actualiza al cambiar (girar el móvil, redimensionar).
 * useSyncExternalStore se suscribe al evento `change` sin setState dentro de un efecto.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia?.(query)
      mql?.addEventListener('change', onChange)
      return () => mql?.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia?.(query).matches ?? false)
}
