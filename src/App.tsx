import { useState } from 'react'
import { UserList } from './components/UserList'
import { UserPosts } from './components/UserPosts'
import type { User } from './types'

function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  return (
    <main className="app">
      <h1>Usuarios y publicaciones</h1>

      <div className="layout">
        <UserList selectedUserId={selectedUser?.id ?? null} onSelect={setSelectedUser} />

        {selectedUser ? (
          <UserPosts user={selectedUser} />
        ) : (
          <section className="panel placeholder">
            <p>Selecciona un usuario para ver sus publicaciones.</p>
          </section>
        )}
      </div>
    </main>
  )
}

export default App
