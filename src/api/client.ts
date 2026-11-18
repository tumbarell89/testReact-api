import type { NewPost, Post, User } from '../types'

export const API_BASE_URL = 'https://jsonplaceholder.typicode.com'

/** Tiempo máximo de espera por petición antes de abortar. */
export const REQUEST_TIMEOUT_MS = 10_000

/** Error de la capa de datos con un mensaje apto para mostrar al usuario. */
export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, options?: ErrorOptions & { status?: number }) {
    super(message, options)
    this.name = 'ApiError'
    this.status = options?.status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  // Cancela si el llamador aborta (p. ej. el componente se desmonta) o si se supera el timeout.
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const combinedSignal = signal ? AbortSignal.any([signal, timeout]) : timeout

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal: combinedSignal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json; charset=UTF-8' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new ApiError('El servidor tardó demasiado en responder.', { cause: err })
    }
    // La cancelación voluntaria se propaga tal cual para que el llamador la ignore.
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión.', { cause: err })
  }

  if (!response.ok) {
    throw new ApiError(`El servidor respondió con un error (${response.status}).`, {
      status: response.status,
    })
  }

  try {
    return (await response.json()) as T
  } catch (err) {
    throw new ApiError('La respuesta del servidor no es válida.', { cause: err })
  }
}

export function getUsers(signal?: AbortSignal): Promise<User[]> {
  return request<User[]>('/users', { signal })
}

export function getPostsByUser(userId: number, signal?: AbortSignal): Promise<Post[]> {
  const params = new URLSearchParams({ userId: String(userId) })
  return request<Post[]>(`/posts?${params}`, { signal })
}

/**
 * JSONPlaceholder simula la creación: responde 201 con el post y `id: 101`,
 * pero no lo persiste.
 */
export function createPost(newPost: NewPost, signal?: AbortSignal): Promise<Post> {
  return request<Post>('/posts', { method: 'POST', body: newPost, signal })
}

/** Convierte cualquier error en un mensaje legible para la interfaz. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'Ha ocurrido un error inesperado.'
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
