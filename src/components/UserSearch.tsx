import { useId } from 'react'

interface UserSearchProps {
  value: string
  onChange: (value: string) => void
}

/**
 * Buscador de usuarios. `<search>` + `<form>` da semántica de búsqueda;
 * el filtrado es en vivo, así que el submit solo evita recargar la página al pulsar Enter.
 */
export function UserSearch({ value, onChange }: UserSearchProps) {
  const inputId = useId()
  return (
    <search>
      <form className="user-search" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor={inputId}>Buscar por nombre</label>
        <input
          id={inputId}
          name="q"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
        />
      </form>
    </search>
  )
}
