import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { isDemoMode as configIsDemoMode } from './config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isDemoMode(): boolean {
  // Use the centralized configuration
  return configIsDemoMode()
}

// Demo mode data persistence helpers
export function getDemoData(key: string): unknown[] {
  if (typeof window === 'undefined') return []
  
  try {
    const data = localStorage.getItem(`demo_${key}`)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function setDemoData(key: string, data: unknown[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(`demo_${key}`, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving demo data:', error)
  }
}

export function addDemoData(key: string, item: Record<string, unknown>): void {
  const currentData = getDemoData(key)
  const newData = [...currentData, { ...item, id: Date.now().toString() }]
  setDemoData(key, newData)
}