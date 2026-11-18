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

interface UserPostsProps {
  user: User
  /** id del encabezado, para que un contenedor (el <dialog> en móvil) se nombre con él. */
  headingId?: string
  /**
   * Mover el foco al encabezado al elegir usuario (vista de escritorio).
   * Dentro del <dialog> es `false`: allí el foco lo gestiona showModal().
   */
  focusHeadingOnSelect?: boolean
}

export function UserPosts({ user, headingId, focusHeadingOnSelect = true }: UserPostsProps) {
  // Se vuelve a pedir solo cuando cambia el usuario.
  const fetchPosts = useCallback((signal: AbortSignal) => getPostsByUser(user.id, signal), [user.id])
  const posts = useFetch(fetchPosts)
  const { setData: setPosts } = posts

  // Al elegir un usuario, el foco pasa al encabezado del panel (los lectores de pantalla
  // anuncian el contexto nuevo). Si el usuario había bajado por la página y el encabezado
  // queda fuera de la vista (o en la mitad de abajo), se lleva arriba.
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    const heading = headingRef.current
    if (!heading || !focusHeadingOnSelect) return
    heading.focus({ preventScroll: true })
    const { top } = heading.getBoundingClientRect()
    if (top < 0 || top > window.innerHeight / 2) {
      // El suavizado lo decide CSS (scroll-behavior), que respeta prefers-reduced-motion.
      heading.scrollIntoView?.({ block: 'start' })
    }
  }, [user.id, focusHeadingOnSelect])

  // Igual que en la lista: al reintentar, el foco no se pierde al desaparecer el botón.
  function handleRetry() {
    headingRef.current?.focus()
    posts.reload()
  }

  const handleCreated = useCallback(
    (created: Post) => setPosts((current) => [{ ...created, id: nextLocalId() }, ...current]),
    [setPosts],
  )

  return (
    <section className="panel posts-panel">
      {/* React 19 lleva <title> al <head>: el título de la pestaña refleja la vista actual. */}
      <title>{`Publicaciones de ${user.name} | Usuarios y publicaciones`}</title>

      <h2 id={headingId} ref={headingRef} tabIndex={-1}>
        Publicaciones de {user.name}
      </h2>

      {posts.status === 'loading' && <Loading label="Cargando publicaciones…" />}

      {posts.status === 'error' && (
        <ErrorMessage message={getErrorMessage(posts.error)} onRetry={handleRetry} />
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
