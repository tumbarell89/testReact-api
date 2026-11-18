interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

/** Mensaje de error anunciado por lectores de pantalla, con opción de reintentar. */
export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="error-message" role="alert">
      {/* El icono refuerza el estado sin depender solo del color; el texto ya lo explica. */}
      <p>
        <span aria-hidden="true">⚠ </span>
        {message}
      </p>
      {onRetry && (
        <button type="button" className="button-secondary" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}
