import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { createPost, getErrorMessage, isAbortError } from '../api/client'
import type { Post } from '../types'
import {
  POST_FORM_FIELDS,
  validateField,
  validatePost,
  type PostFormErrors,
  type PostFormField,
  type PostFormValues,
} from '../utils/validatePost'
import { ErrorMessage } from './ErrorMessage'

/** Retardo del anuncio de un error al salir de un campo, para no pisar la lectura del siguiente. */
const ERROR_ANNOUNCE_DELAY_MS = 500

const EMPTY_VALUES: PostFormValues = { title: '', body: '' }

const LABELS: Record<PostFormField, string> = { title: 'Título', body: 'Texto' }

interface PostFormProps {
  userId: number
  onCreated: (post: Post) => void
}

type SubmitState = { status: 'idle' } | { status: 'submitting' } | { status: 'error'; message: string }

/**
 * Formulario de nueva publicación, plegado tras un botón "Añadir publicación"
 * (patrón disclosure: aria-expanded + aria-controls).
 *
 * Validación accesible:
 * - Los errores aparecen al salir de un campo editado o al enviar, nunca antes de interactuar.
 * - Un error desaparece en cuanto el campo se corrige.
 * - Tras un envío fallido, el foco va al primer campo inválido (que anuncia su error).
 * - El botón sigue enabled; solo se bloquea (aria-disabled) mientras se envía, para evitar dobles envíos.
 *
 * Foco: al desplegar va al título; al plegar (Cancelar o publicación correcta) vuelve al
 * botón "Añadir publicación", porque el control que tenía el foco desaparece.
 */
export function PostForm({ userId, onCreated }: PostFormProps) {
  const ids = {
    form: useId(),
    heading: useId(),
    title: useId(),
    body: useId(),
    titleError: useId(),
    bodyError: useId(),
  }
  const errorIds: Record<PostFormField, string> = { title: ids.titleError, body: ids.bodyError }

  const [expanded, setExpanded] = useState(false)
  const [values, setValues] = useState<PostFormValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<PostFormErrors>({})
  const [edited, setEdited] = useState<Partial<Record<PostFormField, boolean>>>({})
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' })
  const [successMessage, setSuccessMessage] = useState('')
  const [announcement, setAnnouncement] = useState('')

  const toggleRef = useRef<HTMLButtonElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const announceTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const requestController = useRef<AbortController | null>(null)

  // Al desmontar (p. ej. cambiar de usuario) se cancela el envío en curso y el anuncio pendiente.
  useEffect(
    () => () => {
      requestController.current?.abort()
      clearTimeout(announceTimer.current)
    },
    [],
  )

  const isSubmitting = submit.status === 'submitting'

  function announce(message: string) {
    clearTimeout(announceTimer.current)
    setAnnouncement('')
    announceTimer.current = setTimeout(() => setAnnouncement(message), ERROR_ANNOUNCE_DELAY_MS)
  }

  function resetForm() {
    clearTimeout(announceTimer.current)
    setAnnouncement('')
    setValues(EMPTY_VALUES)
    setEdited({})
    setErrors({})
    setSubmit({ status: 'idle' })
  }

  /** Pliega el formulario y devuelve el foco al botón que lo abre. */
  function collapse() {
    flushSync(() => setExpanded(false))
    toggleRef.current?.focus()
  }

  function handleToggle() {
    if (expanded) {
      // Plegar desde el propio botón conserva el borrador; "Cancelar" lo descarta.
      setExpanded(false)
      return
    }
    // flushSync: el campo tiene que estar visible para poder enfocarlo en este mismo gesto.
    flushSync(() => {
      setExpanded(true)
      setSuccessMessage('')
    })
    titleRef.current?.focus()
  }

  function handleCancel() {
    requestController.current?.abort()
    resetForm()
    collapse()
  }

  function handleChange(field: PostFormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setEdited((current) => ({ ...current, [field]: true }))
    // Mientras se escribe solo se BORRA un error ya visible (si se ha corregido); nunca se añade.
    if (errors[field] && !validateField(field, value)) {
      setErrors((current) => ({ ...current, [field]: undefined }))
      clearTimeout(announceTimer.current)
      setAnnouncement('')
    }
  }

  function handleBlur(field: PostFormField) {
    if (!edited[field]) return
    const error = validateField(field, values[field])
    if (error && error !== errors[field]) announce(`${LABELS[field]}: ${error}`)
    setErrors((current) => ({ ...current, [field]: error }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const validationErrors = validatePost(values)
    setErrors(validationErrors)
    const firstInvalid = POST_FORM_FIELDS.find((field) => validationErrors[field])
    if (firstInvalid) {
      // El foco anuncia el error del campo; no hace falta la región viva.
      clearTimeout(announceTimer.current)
      setAnnouncement('')
      const firstInvalidRef = firstInvalid === 'title' ? titleRef : bodyRef
      firstInvalidRef.current?.focus()
      return
    }

    const controller = new AbortController()
    requestController.current = controller
    setSubmit({ status: 'submitting' })

    try {
      const created = await createPost(
        { userId, title: values.title.trim(), body: values.body.trim() },
        controller.signal,
      )
      onCreated(created)
      resetForm()
      setSuccessMessage(`Publicación «${created.title}» creada.`)
      collapse()
    } catch (error) {
      if (isAbortError(error)) return
      setSubmit({ status: 'error', message: getErrorMessage(error) })
    }
  }

  function fieldProps(field: PostFormField) {
    const error = errors[field]
    return {
      id: ids[field],
      name: field,
      value: values[field],
      required: true,
      // "false" explícito: Firefox/Safari exponen un campo required vacío como inválido desde el inicio.
      'aria-invalid': error ? true : false,
      // El mensaje solo se vincula mientras se muestra.
      'aria-describedby': error ? errorIds[field] : undefined,
      onBlur: () => handleBlur(field),
    } as const
  }

  return (
    <div className="post-form-container">
      <button
        ref={toggleRef}
        type="button"
        className="button-primary add-post-toggle"
        aria-expanded={expanded}
        aria-controls={ids.form}
        onClick={handleToggle}
      >
        <span className="toggle-icon" aria-hidden="true">
          +
        </span>
        Añadir publicación
      </button>

      <form
        id={ids.form}
        className="post-form"
        aria-labelledby={ids.heading}
        noValidate
        hidden={!expanded}
        onSubmit={handleSubmit}
      >
        <h3 id={ids.heading}>Nueva publicación</h3>
        <p className="form-hint">
          Los campos marcados con <span aria-hidden="true">*</span>
          <span className="visually-hidden">asterisco</span> son obligatorios.
        </p>

        <div className="field">
          <label htmlFor={ids.title}>
            {LABELS.title} <span aria-hidden="true">*</span>
          </label>
          <input
            ref={titleRef}
            type="text"
            enterKeyHint="next"
            {...fieldProps('title')}
            onChange={(event) => handleChange('title', event.target.value)}
          />
          {errors.title && <FieldError id={ids.titleError} message={errors.title} />}
        </div>

        <div className="field">
          <label htmlFor={ids.body}>
            {LABELS.body} <span aria-hidden="true">*</span>
          </label>
          <textarea
            ref={bodyRef}
            rows={4}
            {...fieldProps('body')}
            onChange={(event) => handleChange('body', event.target.value)}
          />
          {errors.body && <FieldError id={ids.bodyError} message={errors.body} />}
        </div>

        {submit.status === 'error' && <ErrorMessage message={`No se pudo publicar. ${submit.message}`} />}

        <div className="form-actions">
          <button type="submit" className="button-primary" aria-disabled={isSubmitting || undefined}>
            {isSubmitting ? 'Publicando…' : 'Publicar'}
          </button>
          <button type="button" className="button-secondary" onClick={handleCancel}>
            Cancelar
          </button>
        </div>

        {/* Única región viva para los errores que aparecen al salir de un campo. */}
        <div className="visually-hidden" aria-live="polite">
          {announcement}
        </div>
      </form>

      {/* Fuera del formulario: sigue visible y se anuncia aunque el formulario se pliegue. */}
      <p className="form-success" role="status">
        {successMessage && (
          <>
            <span aria-hidden="true">✓ </span>
            {successMessage}
          </>
        )}
      </p>
    </div>
  )
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="field-error">
      <span aria-hidden="true">⚠ </span>
      {message}
    </p>
  )
}
