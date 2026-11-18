import { useCallback, useEffect, useState } from 'react'
import { isAbortError } from '../api/client'

type Fetcher<T> = (signal: AbortSignal) => Promise<T>

export type FetchState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: unknown }

export type FetchResult<T> = FetchState<T> & {
  /** Repite la petición (botón "Reintentar"). */
  reload: () => void
  /** Modifica los datos ya cargados en local (p. ej. añadir un post creado). */
  setData: (updater: (current: T) => T) => void
}

/** Resultado de una petición concreta, identificada por su fetcher y su token de recarga. */
type Settled<T> = { fetcher: Fetcher<T>; token: number } & (
  | { status: 'success'; data: T }
  | { status: 'error'; error: unknown }
)

/**
 * Ejecuta `fetcher` al montar y cada vez que cambia su identidad.
 * El llamador debe memorizarlo con `useCallback` para controlar cuándo se repite.
 *
 * - El estado `loading` se deriva en el render (no hay `setState` síncrono en el efecto):
 *   si el último resultado no corresponde a la petición actual, se está cargando.
 * - Las peticiones obsoletas se abortan, así una respuesta lenta nunca pisa a una más reciente.
 */
export function useFetch<T>(fetcher: Fetcher<T>): FetchResult<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null)
  const [token, setToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetcher(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setSettled({ fetcher, token, status: 'success', data })
      },
      (error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return
        setSettled({ fetcher, token, status: 'error', error })
      },
    )

    return () => controller.abort()
  }, [fetcher, token])

  const reload = useCallback(() => setToken((n) => n + 1), [])

  const setData = useCallback((updater: (current: T) => T) => {
    setSettled((current) =>
      current?.status === 'success' ? { ...current, data: updater(current.data) } : current,
    )
  }, [])

  const isCurrent = settled !== null && settled.fetcher === fetcher && settled.token === token
  let state: FetchState<T>
  if (!isCurrent) state = { status: 'loading' }
  else if (settled.status === 'success') state = { status: 'success', data: settled.data }
  else state = { status: 'error', error: settled.error }

  return { ...state, reload, setData }
}
