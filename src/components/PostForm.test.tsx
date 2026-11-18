import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PostForm } from './PostForm'

function jsonResponse(data: unknown, status = 201) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

/** Renderiza el formulario y lo despliega pulsando "Añadir publicación". */
async function renderForm() {
  const onCreated = vi.fn()
  const user = userEvent.setup()
  render(<PostForm userId={7} onCreated={onCreated} />)
  const toggle = screen.getByRole('button', { name: /añadir publicación/i })
  await user.click(toggle)
  return {
    user,
    onCreated,
    toggle,
    title: screen.getByRole('textbox', { name: /título/i }),
    body: screen.getByRole('textbox', { name: /texto/i }),
    submit: screen.getByRole('button', { name: /^publicar$/i }),
  }
}

describe('PostForm: plegado', () => {
  it('empieza plegado: solo se ve el botón "Añadir publicación"', () => {
    render(<PostForm userId={7} onCreated={vi.fn()} />)
    const toggle = screen.getByRole('button', { name: /añadir publicación/i })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('al desplegar muestra el formulario y lleva el foco al título', async () => {
    const { toggle, title } = await renderForm()

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('form', { name: /nueva publicación/i })).toBeVisible()
    expect(title).toHaveFocus()
  })

  it('Cancelar pliega, descarta el borrador y devuelve el foco al botón', async () => {
    const { user, toggle, title } = await renderForm()
    await user.type(title, 'Borrador')

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
    await user.click(toggle)
    expect(screen.getByRole('textbox', { name: /título/i })).toHaveValue('')
  })

  it('plegar con el propio botón conserva el borrador', async () => {
    const { user, toggle, title } = await renderForm()
    await user.type(title, 'Borrador')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(screen.getByRole('textbox', { name: /título/i })).toHaveValue('Borrador')
  })
})

describe('PostForm: validación', () => {
  it('no muestra errores antes de interactuar', async () => {
    const { title, body } = await renderForm()
    expect(title).toHaveAttribute('aria-invalid', 'false')
    expect(body).toHaveAttribute('aria-invalid', 'false')
    expect(title).toBeRequired()
    expect(screen.queryByText(/es obligatorio/i)).not.toBeInTheDocument()
  })

  it('al enviar vacío muestra ambos errores, enfoca el primero y no llama a la API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const { user, title, body, submit } = await renderForm()

    await user.click(submit)

    expect(screen.getByText('El título es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('El texto es obligatorio.')).toBeInTheDocument()
    expect(title).toHaveAttribute('aria-invalid', 'true')
    expect(title).toHaveAccessibleDescription(/el título es obligatorio/i)
    expect(body).toHaveAttribute('aria-invalid', 'true')
    expect(title).toHaveFocus()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('considera vacío un valor con solo espacios', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const { user, title, body, submit } = await renderForm()

    await user.type(title, '   ')
    await user.type(body, 'Texto válido')
    await user.click(submit)

    expect(screen.getByText('El título es obligatorio.')).toBeInTheDocument()
    expect(screen.queryByText('El texto es obligatorio.')).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('valida al salir de un campo editado y borra el error al corregirlo', async () => {
    const { user, title } = await renderForm()

    await user.type(title, 'a')
    await user.clear(title)
    await user.tab()
    expect(screen.getByText('El título es obligatorio.')).toBeInTheDocument()

    await user.type(title, 'Hola')
    expect(screen.queryByText('El título es obligatorio.')).not.toBeInTheDocument()
    expect(title).toHaveAttribute('aria-invalid', 'false')
  })

  it('no marca error al pasar por un campo sin editarlo', async () => {
    const { user } = await renderForm()
    await user.tab() // entra en título
    await user.tab() // sale sin escribir
    expect(screen.queryByText(/es obligatorio/i)).not.toBeInTheDocument()
  })
})

describe('PostForm: envío', () => {
  it('envía los datos recortados, avisa del éxito, limpia y pliega el formulario', async () => {
    const created = { id: 101, userId: 7, title: 'Mi título', body: 'Mi texto' }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(created))
    const { user, onCreated, toggle, title, body, submit } = await renderForm()

    await user.type(title, '  Mi título  ')
    await user.type(body, 'Mi texto')
    await user.click(submit)

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created))
    const init = fetchMock.mock.calls[0][1]
    expect(JSON.parse(init?.body as string)).toEqual({ userId: 7, title: 'Mi título', body: 'Mi texto' })
    // El aviso queda fuera del formulario plegado, visible y anunciado.
    expect(screen.getByRole('status')).toHaveTextContent('Publicación «Mi título» creada.')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
    expect(title).toHaveValue('')
    expect(body).toHaveValue('')
  })

  it('bloquea los envíos dobles mientras se publica', async () => {
    let resolveFetch!: (response: Response) => void
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockReturnValue(new Promise<Response>((resolve) => (resolveFetch = resolve)))
    const { user, onCreated, title, body, submit } = await renderForm()

    await user.type(title, 'Título')
    await user.type(body, 'Texto')
    await user.click(submit)

    expect(submit).toHaveAttribute('aria-disabled', 'true')
    expect(submit).toHaveTextContent('Publicando…')
    expect(submit).toHaveFocus() // aria-disabled (no disabled) mantiene el foco en el botón

    await user.click(submit)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    resolveFetch(jsonResponse({ id: 101, userId: 7, title: 'Título', body: 'Texto' }))
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    expect(submit).not.toHaveAttribute('aria-disabled')
  })

  it('muestra el error de la API y conserva lo escrito', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}, 500))
    const { user, onCreated, title, body, submit } = await renderForm()

    await user.type(title, 'Título')
    await user.type(body, 'Texto')
    await user.click(submit)

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo publicar.*500/i)
    expect(onCreated).not.toHaveBeenCalled()
    expect(title).toHaveValue('Título')
    expect(submit).not.toHaveAttribute('aria-disabled')
  })
})
