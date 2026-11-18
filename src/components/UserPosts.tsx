import { useCallback, useEffect, useRef } from 'react'
import { getErrorMessage, getPostsByUser } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import type { Post, User } from '../types'
import { ErrorMessage } from './ErrorMessage'
import { Loading } from './Loading'
import { PostForm } from './PostForm'

/**
 * JSONPlaceholder devuelve siempre `id: 101` al crear, así que se asigna un id local
 * negativo y único: no choca con los ids reales y distingue los posts creados en esta sesión.
 */
let lastLocalId = 0
const nextLocalId = () => --lastLocalId
const isLocalPost = (post: Post) => post.id < 0

export function UserPosts({ user }: { user: User }) {
  // Se vuelve a pedir solo cuando cambia el usuario.
  const fetchPosts = useCallback((signal: AbortSignal) => getPostsByUser(user.id, signal), [user.id])
  const posts = useFetch(fetchPosts)
  const { setData: setPosts } = posts

  // Al elegir un usuario, el foco pasa al encabezado del panel: los lectores de pantalla
  // anuncian el contexto nuevo y, en móvil (una columna), el navegador lo desplaza a la vista.
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [user.id])

  const handleCreated = useCallback(
    (created: Post) => setPosts((current) => [{ ...created, id: nextLocalId() }, ...current]),
    [setPosts],
  )

  return (
    <section className="panel">
      {/* React 19 lleva <title> al <head>: el título de la pestaña refleja la vista actual. */}
      <title>{`Publicaciones de ${user.name} | Usuarios y publicaciones`}</title>

      <h2 ref={headingRef} tabIndex={-1}>
        Publicaciones de {user.name}
      </h2>

      {posts.status === 'loading' && <Loading label="Cargando publicaciones…" />}

      {posts.status === 'error' && (
        <ErrorMessage message={getErrorMessage(posts.error)} onRetry={posts.reload} />
      )}

      {posts.status === 'success' && (
        <>
          <PostForm key={user.id} userId={user.id} onCreated={handleCreated} />

          {posts.data.length === 0 ? (
            <p className="empty">Este usuario no tiene publicaciones.</p>
          ) : (
            <ul className="post-list" role="list">
              {posts.data.map((post) => (
                <li key={post.id}>
                  <article className="post">
                    <h3>
                      {post.title}
                      {isLocalPost(post) && <span className="badge"> Nueva</span>}
                    </h3>
                    <p>{post.body}</p>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
