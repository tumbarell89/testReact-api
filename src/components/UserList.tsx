import { useRef, useState } from 'react'
import { getErrorMessage, getUsers } from '../api/client'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useFetch } from '../hooks/useFetch'
import type { User } from '../types'
import { filterUsersByName } from '../utils/search'
import { ErrorMessage } from './ErrorMessage'
import { Loading } from './Loading'
import { UserSearch } from './UserSearch'

/** Espera antes de anunciar el nº de resultados, para no saturar al lector de pantalla al teclear. */
const ANNOUNCE_DELAY_MS = 400

interface UserListProps {
  selectedUserId: number | null
  onSelect: (user: User) => void
}

export function UserList({ selectedUserId, onSelect }: UserListProps) {
  // `getUsers` es una función de módulo: su identidad es estable y solo se pide una vez.
  const users = useFetch(getUsers)
  const [query, setQuery] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  // "Reintentar" desaparece al empezar la recarga: el foco pasa al encabezado
  // del panel para que no caiga en <body> y el usuario de teclado no pierda su posición.
  function handleRetry() {
    headingRef.current?.focus()
    users.reload()
  }

  return (
    <section className="panel">
      <h2 ref={headingRef} tabIndex={-1}>
        Usuarios
      </h2>

      <UserSearch value={query} onChange={setQuery} />

      {users.status === 'loading' && <Loading label="Cargando usuarios…" />}

      {users.status === 'error' && (
        <ErrorMessage message={getErrorMessage(users.error)} onRetry={handleRetry} />
      )}

      {users.status === 'success' && (
        <FilteredUsers
          users={users.data}
          query={query}
          selectedUserId={selectedUserId}
          onSelect={onSelect}
        />
      )}
    </section>
  )
}

interface FilteredUsersProps extends UserListProps {
  users: User[]
  query: string
}

function FilteredUsers({ users, query, selectedUserId, onSelect }: FilteredUsersProps) {
  // La lista se filtra al instante; solo el anuncio del recuento espera a que se deje de teclear.
  const visibleUsers = filterUsersByName(users, query)
  const announcedQuery = useDebouncedValue(query.trim(), ANNOUNCE_DELAY_MS)
  const announcedCount = filterUsersByName(users, announcedQuery).length

  let announcement = ''
  if (announcedQuery !== '') {
    announcement =
      announcedCount > 0
        ? `${announcedCount} de ${users.length} usuarios`
        : `Ningún usuario coincide con «${announcedQuery}».`
  }

  return (
    <>
      {/* Región viva "polite": anuncia el recuento al filtrar, sin mover el foco. */}
      <p className="result-count" role="status">
        {announcement}
      </p>

      {visibleUsers.length > 0 && (
        // role="list" restaura la semántica que Safari quita con list-style: none.
        <ul className="user-list" role="list">
          {visibleUsers.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                className="user-item"
                aria-current={user.id === selectedUserId ? 'true' : undefined}
                onClick={() => onSelect(user)}
              >
                <span className="user-name">{user.name}</span>
                <span className="user-meta">@{user.username}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
