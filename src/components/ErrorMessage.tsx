interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

/** Mensaje de error anunciado por lectores de pantalla, con opción de reintentar. */
export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="error-message" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}
