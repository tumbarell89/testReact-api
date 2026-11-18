import { describe, expect, it, vi } from 'vitest'
import { ApiError, API_BASE_URL, createPost, getErrorMessage, getPostsByUser, getUsers } from './client'

function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

describe('api client', () => {
  it('getUsers pide /users y devuelve el JSON', async () => {
    const users = [{ id: 1, name: 'Leanne Graham', username: 'Bret', email: 'a@b.c' }]
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(users))

    await expect(getUsers()).resolves.toEqual(users)
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/users`, expect.objectContaining({ method: 'GET' }))
  })

  it('getPostsByUser filtra por userId en la query', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse([]))

    await getPostsByUser(3)
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/posts?userId=3`)
  })

  it('createPost envía un POST con el cuerpo en JSON', async () => {
    const created = { id: 101, userId: 1, title: 'Hola', body: 'Mundo' }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(created, { status: 201 }))

    await expect(createPost({ userId: 1, title: 'Hola', body: 'Mundo' })).resolves.toEqual(created)
    const init = fetchMock.mock.calls[0][1]
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({ userId: 1, title: 'Hola', body: 'Mundo' })
  })

  it('convierte una respuesta HTTP no OK en ApiError con el status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}, { status: 500 }))

    const error = await getUsers().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(500)
    expect(getErrorMessage(error)).toMatch(/500/)
  })

  it('convierte un fallo de red en ApiError conservando la causa', async () => {
    const networkError = new TypeError('Failed to fetch')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(networkError)

    const error = await getUsers().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).cause).toBe(networkError)
    expect(getErrorMessage(error)).toMatch(/no se pudo conectar/i)
  })

  it('convierte un timeout en ApiError con mensaje propio', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('timeout', 'TimeoutError'))

    const error = await getUsers().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(getErrorMessage(error)).toBe('El servidor tardó demasiado en responder.')
  })

  it('propaga la cancelación voluntaria sin convertirla en error de la app', async () => {
    const abort = new DOMException('aborted', 'AbortError')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(abort)

    await expect(getUsers()).rejects.toBe(abort)
  })

  it('detecta una respuesta que no es JSON válido', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>oops</html>', { status: 200 }))

    const error = await getUsers().catch((e: unknown) => e)
    expect(getErrorMessage(error)).toBe('La respuesta del servidor no es válida.')
  })

  it('da un mensaje genérico para errores desconocidos', () => {
    expect(getErrorMessage('boom')).toBe('Ha ocurrido un error inesperado.')
  })
})
