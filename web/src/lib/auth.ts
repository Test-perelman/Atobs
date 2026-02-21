import { AuthUser } from './types'

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('authUser')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user: AuthUser, accessToken: string): void {
  localStorage.setItem('authUser', JSON.stringify(user))
  localStorage.setItem('accessToken', accessToken)
}

export function clearAuth(): void {
  localStorage.removeItem('authUser')
  localStorage.removeItem('accessToken')
}

export function isAuthenticated(): boolean {
  return !!getStoredUser() && !!localStorage.getItem('accessToken')
}

export function hasRole(roles: string[]): boolean {
  const user = getStoredUser()
  return !!user && roles.includes(user.role)
}
