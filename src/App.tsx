import { useState } from 'react'
import { PostsDialog } from './components/PostsDialog'
import { UserList } from './components/UserList'
import { UserPosts } from './components/UserPosts'
import { NARROW_VIEWPORT_QUERY, useMediaQuery } from './hooks/useMediaQuery'
import type { User } from './types'

function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const isNarrow = useMediaQuery(NARROW_VIEWPORT_QUERY)

  return (
    <div className="app">
      <header className="app-header">
        <h1>Usuarios y publicaciones</h1>
        <p>Busca un usuario, consulta sus publicaciones y crea una nueva.</p>
      </header>

      <main className="layout">
        <UserList selectedUserId={selectedUser?.id ?? null} onSelect={setSelectedUser} />

        {/* Móvil: hoja flotante (<dialog>) sobre la lista. Escritorio: panel en la segunda columna. */}
        {isNarrow ? (
          selectedUser && <PostsDialog user={selectedUser} onClose={() => setSelectedUser(null)} />
        ) : selectedUser ? (
          <UserPosts user={selectedUser} />
        ) : (
          <section className="panel placeholder">
            <p>Selecciona un usuario para ver sus publicaciones.</p>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
