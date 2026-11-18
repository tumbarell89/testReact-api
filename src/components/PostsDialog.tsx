import { useEffect, useId, useRef } from 'react'
import type { User } from '../types'
import { UserPosts } from './UserPosts'

interface PostsDialogProps {
  user: User
  onClose: () => void
}

/**
 * En móvil, las publicaciones se abren en una hoja flotante: un <dialog> modal nativo.
 * El navegador aporta sin código propio: página de fondo inerte, foco contenido,
 * cierre con Esc y con el gesto/botón "atrás" de Android, y devolución del foco
 * al usuario que lo abrió. Además hay un botón visible "← Usuarios" para volver.
 */
export function PostsDialog({ user, onClose }: PostsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const headingId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    // Sin role="dialog" ni aria-modal: el <dialog> abierto con showModal() ya los aporta.
    <dialog ref={dialogRef} className="posts-dialog" aria-labelledby={headingId} onClose={onClose}>
      <div className="dialog-bar">
        {/* Primer control: showModal() le da el foco, como el "atrás" de una app nativa. */}
        {/* Nombre accesible "Volver a Usuarios" (incluye el texto visible "Usuarios").
            Los espacios van fuera de los <span>: dentro, el cálculo del nombre los recorta. */}
        <button type="button" className="back-button" onClick={() => dialogRef.current?.close()}>
          <span aria-hidden="true">←</span> <span className="visually-hidden">Volver a</span> Usuarios
        </button>
      </div>
      <UserPosts user={user} headingId={headingId} focusHeadingOnSelect={false} />
    </dialog>
  )
}
