import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Post, User } from '../types'
import { UserPosts } from './UserPosts'

const ervin: User = { id: 2, name: 'Ervin Howell', username: 'Antonette', email: 'ervin@example.com' }
const existing: Post[] = [{ id: 11, userId: 2, title: 'Post existente', body: 'Ya estaba' }]

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('UserPosts: estados de carga, error y vacío', () => {
  it('muestra el error al cargar publicaciones y las recupera al reintentar', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse(existing))
    const user = userEvent.setup()
    render(<UserPosts user={ervin} />)

    expect(screen.getByRole('progressbar', { name: /cargando publicaciones/i })).toBeInTheDocument()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('(503)')
    // Sin publicaciones cargadas no se ofrece el formulario.
    expect(screen.queryByRole('form', { name: /nueva publicación/i })).not.toBeInTheDocument()

    await user.click(within(alert).getByRole('button', { name: 'Reintentar' }))

    expect(screen.getByRole('heading', { name: /publicaciones de ervin howell/i })).toHaveFocus()
    expect(await screen.findByRole('heading', { name: 'Post existente' })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: /nueva publicación/i })).toBeInTheDocument()
  })

  it('indica cuando el usuario no tiene publicaciones', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse([]))
    render(<UserPosts user={ervin} />)

    expect(await screen.findByText('Este usuario no tiene publicaciones.')).toBeInTheDocument()
  })
})

describe('UserPosts: crear publicación', () => {
  it('añade la publicación nueva al principio de la lista', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      if (init?.method === 'POST') {
        // La API real responde siempre con id 101 y no guarda nada.
        return jsonResponse({ ...JSON.parse(init.body as string), id: 101 }, 201)
      }
      return jsonResponse(existing)
    })
    const user = userEvent.setup()
    render(<UserPosts user={ervin} />)

    await screen.findByRole('heading', { name: 'Post existente' })

    await user.type(screen.getByRole('textbox', { name: /título/i }), 'Mi nuevo post')
    await user.type(screen.getByRole('textbox', { name: /texto/i }), 'Contenido nuevo')
    await user.click(screen.getByRole('button', { name: /publicar/i }))

    const items = await screen.findAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByRole('heading')).toHaveTextContent('Mi nuevo post')
    expect(within(items[0]).getByText(/nueva/i)).toBeInTheDocument()
    expect(within(items[1]).getByRole('heading')).toHaveTextContent('Post existente')
  })
})
