import { useState, useEffect } from 'react'

export type ToastKind = 'error' | 'success' | 'info'

export interface Toast {
  id: string
  message: string
  kind: ToastKind
}

let toasts: Toast[] = []
const listeners = new Set<(t: Toast[]) => void>()

function emit() {
  listeners.forEach(l => l(toasts))
}

export function showToast(message: string, kind: ToastKind = 'info', ttlMs = 4000) {
  const id = `${Date.now()}-${Math.random()}`
  toasts = [...toasts, { id, message, kind }]
  emit()
  setTimeout(() => dismissToast(id), ttlMs)
}

export function dismissToast(id: string) {
  toasts = toasts.filter(t => t.id !== id)
  emit()
}

export function useToasts(): Toast[] {
  const [list, setList] = useState<Toast[]>(toasts)
  useEffect(() => {
    listeners.add(setList)
    return () => {
      listeners.delete(setList)
    }
  }, [])
  return list
}
