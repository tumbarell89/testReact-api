import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Post, User } from './types'

const users: User[] = [
  { id: 1, name: 'Leanne Graham', username: 'Bret', email: 'leanne@example.com' },
  { id: 2, name: 'Ervin Howell', username: 'Antonette', email: 'ervin@example.com' },
]

const posts: Post[] = [{ id: 11, userId: 2, title: 'Post de Ervin', body: 'Contenido del post' }]

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
}

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    if (url.endsWith('/users')) return jsonResponse(users)
    if (url.includes('/posts?userId=2')) return jsonResponse(posts)
    return new Response(null, { status: 404 })
  })
})

describe('App', () => {
  it('muestra la carga, la lista de usuarios y las publicaciones del elegido', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: /usuarios y publicaciones/i })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: /cargando usuarios/i })).toBeInTheDocument()

    const ervin = await screen.findByRole('button', { name: /ervin howell/i })
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByText(/selecciona un usuario/i)).toBeInTheDocument()

    await user.click(ervin)

    expect(ervin).toHaveAttribute('aria-current', 'true')
    const postsHeading = screen.getByRole('heading', { name: /publicaciones de ervin howell/i })
    expect(postsHeading).toHaveFocus()
    expect(document.title).toBe('Publicaciones de Ervin Howell | Usuarios y publicaciones')
    expect(await screen.findByRole('heading', { name: 'Post de Ervin' })).toBeInTheDocument()
  })
})
