export interface PostFormValues {
  title: string
  body: string
}

export type PostFormField = keyof PostFormValues
export type PostFormErrors = Partial<Record<PostFormField, string>>

/** Orden de los campos en el formulario: decide a cuál se mueve el foco tras un envío fallido. */
export const POST_FORM_FIELDS: readonly PostFormField[] = ['title', 'body']

const REQUIRED_MESSAGES: Record<PostFormField, string> = {
  title: 'El título es obligatorio.',
  body: 'El texto es obligatorio.',
}

/** Valida un campo. Un valor con solo espacios cuenta como vacío. */
export function validateField(field: PostFormField, value: string): string | undefined {
  return value.trim() === '' ? REQUIRED_MESSAGES[field] : undefined
}

/** Valida todo el formulario y devuelve solo los campos con error. */
export function validatePost(values: PostFormValues): PostFormErrors {
  const errors: PostFormErrors = {}
  for (const field of POST_FORM_FIELDS) {
    const error = validateField(field, values[field])
    if (error) errors[field] = error
  }
  return errors
}
