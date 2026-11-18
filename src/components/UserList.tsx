import { getErrorMessage, getUsers } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import type { User } from '../types'
import { ErrorMessage } from './ErrorMessage'
import { Loading } from './Loading'

interface UserListProps {
  selectedUserId: number | null
  onSelect: (user: User) => void
}

export function UserList({ selectedUserId, onSelect }: UserListProps) {
  // `getUsers` es una función de módulo: su identidad es estable y solo se pide una vez.
  const users = useFetch(getUsers)

  return (
    <section className="panel" aria-labelledby="users-title">
      <h2 id="users-title">Usuarios</h2>

      {users.status === 'loading' && <Loading label="Cargando usuarios…" />}

      {users.status === 'error' && (
        <ErrorMessage message={getErrorMessage(users.error)} onRetry={users.reload} />
      )}

      {users.status === 'success' && (
        <ul className="user-list">
          {users.data.map((user) => (
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
    </section>
  )
}
