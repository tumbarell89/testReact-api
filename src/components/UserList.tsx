import { useState } from 'react'
import { getErrorMessage, getUsers } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import type { User } from '../types'
import { filterUsersByName } from '../utils/search'
import { ErrorMessage } from './ErrorMessage'
import { Loading } from './Loading'
import { UserSearch } from './UserSearch'

interface UserListProps {
  selectedUserId: number | null
  onSelect: (user: User) => void
}

export function UserList({ selectedUserId, onSelect }: UserListProps) {
  // `getUsers` es una función de módulo: su identidad es estable y solo se pide una vez.
  const users = useFetch(getUsers)
  const [query, setQuery] = useState('')

  return (
    <section className="panel" aria-labelledby="users-title">
      <h2 id="users-title">Usuarios</h2>

      <UserSearch value={query} onChange={setQuery} />

      {users.status === 'loading' && <Loading label="Cargando usuarios…" />}

      {users.status === 'error' && (
        <ErrorMessage message={getErrorMessage(users.error)} onRetry={users.reload} />
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
  const visibleUsers = filterUsersByName(users, query)
  const isFiltering = query.trim() !== ''

  return (
    <>
      {/* Región viva: anuncia el número de resultados al filtrar, sin mover el foco. */}
      <p className="result-count" role="status">
        {isFiltering && visibleUsers.length > 0 && `${visibleUsers.length} de ${users.length} usuarios`}
        {isFiltering && visibleUsers.length === 0 && `Ningún usuario coincide con «${query.trim()}».`}
      </p>

      {visibleUsers.length > 0 && (
        <ul className="user-list">
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
