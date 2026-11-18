/** Modelos de JSONPlaceholder (solo los campos que usa la app). */

export interface User {
  id: number
  name: string
  username: string
  email: string
}

export interface Post {
  id: number
  userId: number
  title: string
  body: string
}

/** Datos que el usuario introduce en el formulario de nueva publicación. */
export type NewPost = Pick<Post, 'userId' | 'title' | 'body'>
