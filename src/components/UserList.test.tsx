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

describe('UserList: estados de carga y error', () => {
  it('muestra el error de la API y recupera la lista al reintentar', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(users), { headers: { 'Content-Type': 'application/json' } }),
      )
    const user = userEvent.setup()
    render(<UserList selectedUserId={null} onSelect={vi.fn()} />)

    expect(screen.getByRole('progressbar', { name: /cargando usuarios/i })).toBeInTheDocument()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('El servidor respondió con un error (500).')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()

    await user.click(within(alert).getByRole('button', { name: 'Reintentar' }))

    // El foco no se pierde al desaparecer el botón: pasa al encabezado del panel.
    expect(screen.getByRole('heading', { name: 'Usuarios' })).toHaveFocus()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(await screen.findAllByRole('button', { name: /@/ })).toHaveLength(3)
  })

  it('muestra un mensaje de conexión si falla la red', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    render(<UserList selectedUserId={null} onSelect={vi.fn()} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo conectar con el servidor/i)
  })
})

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
