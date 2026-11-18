import type { User } from '../types'

/**
 * Normaliza texto para comparar sin distinguir mayúsculas ni tildes:
 * "  José  " → "jose". NFD separa la letra de su diacrítico y luego se elimina este.
 */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es').trim()
}

/** Filtra usuarios cuyo nombre contiene la búsqueda. Una búsqueda vacía devuelve todos. */
export function filterUsersByName(users: readonly User[], query: string): User[] {
  const needle = normalizeText(query)
  if (!needle) return [...users]
  return users.filter((user) => normalizeText(user.name).includes(needle))
}
