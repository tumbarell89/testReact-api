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
