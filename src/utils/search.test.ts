import { describe, expect, it } from 'vitest'
import type { User } from '../types'
import { filterUsersByName, normalizeText } from './search'

const user = (id: number, name: string): User => ({ id, name, username: `u${id}`, email: `u${id}@x.com` })
const users = [user(1, 'Leanne Graham'), user(2, 'Ervin Howell'), user(3, 'José Martínez')]

describe('normalizeText', () => {
  it('quita tildes, pasa a minúsculas y recorta espacios', () => {
    expect(normalizeText('  JOSÉ Martínez ')).toBe('jose martinez')
  })
})

describe('filterUsersByName', () => {
  it('devuelve todos los usuarios si la búsqueda está vacía o solo tiene espacios', () => {
    expect(filterUsersByName(users, '')).toEqual(users)
    expect(filterUsersByName(users, '   ')).toEqual(users)
  })

  it('filtra por coincidencia parcial sin distinguir mayúsculas', () => {
    expect(filterUsersByName(users, 'GRAH').map((u) => u.id)).toEqual([1])
  })

  it('ignora las tildes en ambos sentidos', () => {
    expect(filterUsersByName(users, 'jose').map((u) => u.id)).toEqual([3])
    expect(filterUsersByName(users, 'Ervín').map((u) => u.id)).toEqual([2])
  })

  it('devuelve una lista vacía si nada coincide', () => {
    expect(filterUsersByName(users, 'zzz')).toEqual([])
  })
})
