import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useFetch } from './useFetch'

describe('useFetch', () => {
  it('pasa de loading a success con los datos', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a', 'b'])
    const { result } = renderHook(() => useFetch<string[]>(fetcher))

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.data).toEqual(['a', 'b'])
  })

  it('expone el error y permite reintentar', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('falló')).mockResolvedValueOnce('ok')
    const { result } = renderHook(() => useFetch<string>(fetcher))

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toEqual(new Error('falló'))

    act(() => result.current.reload())
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.data).toBe('ok')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('setData actualiza los datos cargados en local', async () => {
    const fetcher = vi.fn().mockResolvedValue([1])
    const { result } = renderHook(() => useFetch<number[]>(fetcher))
    await waitFor(() => expect(result.current.status).toBe('success'))

    act(() => result.current.setData((nums) => [0, ...nums]))
    expect(result.current.data).toEqual([0, 1])
  })

  it('aborta la petición anterior al cambiar el fetcher', async () => {
    const signals: AbortSignal[] = []
    const makeFetcher = (value: string) => (signal: AbortSignal) => {
      signals.push(signal)
      return Promise.resolve(value)
    }
    const { result, rerender } = renderHook(({ fetcher }) => useFetch<string>(fetcher), {
      initialProps: { fetcher: makeFetcher('primero') },
    })

    rerender({ fetcher: makeFetcher('segundo') })
    await waitFor(() => expect(result.current.data).toBe('segundo'))
    expect(signals[0].aborted).toBe(true)
  })
})
