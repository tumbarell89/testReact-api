import { useId } from 'react'

/**
 * Indicador de carga: `<progress>` sin `value` es indeterminado de forma nativa
 * y los lectores de pantalla lo anuncian como "ocupado". No se usa una región viva:
 * los estados intermedios tipo "Cargando…" solo generarían ruido.
 */
export function Loading({ label }: { label: string }) {
  const labelId = useId()
  return (
    <div className="loading">
      <progress className="loading-spinner" aria-labelledby={labelId} />
      <span id={labelId}>{label}</span>
    </div>
  )
}
