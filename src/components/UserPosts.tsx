import { useCallback } from 'react'
import { getErrorMessage, getPostsByUser } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import type { User } from '../types'
import { ErrorMessage } from './ErrorMessage'
import { Loading } from './Loading'

export function UserPosts({ user }: { user: User }) {
  // Se vuelve a pedir solo cuando cambia el usuario.
  const fetchPosts = useCallback((signal: AbortSignal) => getPostsByUser(user.id, signal), [user.id])
  const posts = useFetch(fetchPosts)

  return (
    <section className="panel" aria-labelledby="posts-title">
      <h2 id="posts-title">Publicaciones de {user.name}</h2>

      {posts.status === 'loading' && <Loading label="Cargando publicaciones…" />}

      {posts.status === 'error' && (
        <ErrorMessage message={getErrorMessage(posts.error)} onRetry={posts.reload} />
      )}

      {posts.status === 'success' &&
        (posts.data.length === 0 ? (
          <p className="empty">Este usuario no tiene publicaciones.</p>
        ) : (
          <ul className="post-list">
            {posts.data.map((post) => (
              <li key={post.id}>
                <article className="post">
                  <h3>{post.title}</h3>
                  <p>{post.body}</p>
                </article>
              </li>
            ))}
          </ul>
        ))}
    </section>
  )
}
