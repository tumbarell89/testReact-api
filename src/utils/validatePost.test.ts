import { describe, expect, it } from 'vitest'
import { validateField, validatePost } from './validatePost'

describe('validatePost', () => {
  it('no devuelve errores si título y texto tienen contenido', () => {
    expect(validatePost({ title: 'Hola', body: 'Mundo' })).toEqual({})
  })

  it('marca ambos campos vacíos como obligatorios', () => {
    expect(validatePost({ title: '', body: '' })).toEqual({
      title: 'El título es obligatorio.',
      body: 'El texto es obligatorio.',
    })
  })

  it('trata un valor con solo espacios como vacío', () => {
    expect(validateField('title', '   ')).toBe('El título es obligatorio.')
    expect(validateField('body', '\n\t ')).toBe('El texto es obligatorio.')
  })
})
