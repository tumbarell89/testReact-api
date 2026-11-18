import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '../types'
import { UserList } from './UserList'

const users: User[] = [
  { id: 1, name: 'Leanne Graham', username: 'Bret', email: 'leanne@example.com' },
  { id: 2, name: 'Ervin Howell', username: 'Antonette', email: 'ervin@example.com' },
  { id: 3, name: 'Clementine Bauch', username: 'Samantha', email: 'clementine@example.com' },
]

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(users), { headers: { 'Content-Type': 'application/json' } }),
  )
})

function renderList() {
  render(<UserList selectedUserId={null} onSelect={vi.fn()} />)
  return { user: userEvent.setup(), search: screen.getByRole('searchbox', { name: /buscar por nombre/i }) }
}

describe('UserList: búsqueda por nombre', () => {
  it('filtra la lista mientras se escribe, sin distinguir mayúsculas', async () => {
    const { user, search } = renderList()
    const list = await screen.findByRole('list')
    expect(within(list).getAllByRole('button')).toHaveLength(3)

    await user.type(search, 'ERVIN')

    expect(within(screen.getByRole('list')).getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: /ervin howell/i })).toBeInTheDocument()
    // El recuento se anuncia con un pequeño retardo (debounce) tras dejar de teclear.
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1 de 3 usuarios'))
  })

  it('avisa cuando ningún usuario coincide y se recupera al borrar', async () => {
    const { user, search } = renderList()
    await screen.findByRole('list')

    await user.type(search, 'zzz')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Ningún usuario coincide con «zzz».'),
    )

    await user.clear(search)
    expect(within(screen.getByRole('list')).getAllByRole('button')).toHaveLength(3)
    await waitFor(() => expect(screen.getByRole('status')).toBeEmptyDOMElement())
  })
})
