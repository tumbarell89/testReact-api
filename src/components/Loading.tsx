import { useId } from 'react'

/**
 * Indicador de carga: `<progress>` sin `value` es indeterminado de forma nativa
 * y los lectores de pantalla lo anuncian como "ocupado". El texto visible lo etiqueta
 * y `role="status"` lo anuncia al aparecer.
 */
export function Loading({ label }: { label: string }) {
  const labelId = useId()
  return (
    <div className="loading" role="status">
      <progress className="loading-spinner" aria-labelledby={labelId} />
      <span id={labelId}>{label}</span>
    </div>
  )
}
