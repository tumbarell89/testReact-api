import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Sin `globals: true`, Testing Library no puede registrar su limpieza automática.
afterEach(() => {
  cleanup()
})

// --- APIs del navegador que jsdom no implementa -----------------------------

// matchMedia: por defecto ninguna media query coincide (vista de escritorio).
// Los tests de móvil lo sustituyen con vi.spyOn(window, 'matchMedia').
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

// <dialog>: versión mínima de showModal()/close() con el comportamiento que usa la app
// (atributo open, foco al primer control y evento `close`).
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
    this.querySelector<HTMLElement>('button, [href], input, textarea, select')?.focus()
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement, returnValue?: string) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    if (returnValue !== undefined) this.returnValue = returnValue
    this.dispatchEvent(new Event('close'))
  }
}
