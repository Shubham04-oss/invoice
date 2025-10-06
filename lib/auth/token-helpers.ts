/**
 * Token Management Helpers
 * Handles JWT token storage and retrieval for authentication
 */

const TOKEN_KEY = 'token'  // Changed from 'auth_token' to match middleware

/**
 * Save JWT token to cookie
 * @param token - JWT token string
 * @param days - Number of days until expiration (default: 7)
 */
export function saveToken(token: string, days: number = 7): void {
  if (typeof window === 'undefined') return
  
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  
  document.cookie = `${TOKEN_KEY}=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

/**
 * Get JWT token from cookie
 * @returns Token string or null if not found
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === TOKEN_KEY) {
      return value
    }
  }
  
  return null
}

/**
 * Remove JWT token from cookie (logout)
 */
export function clearToken(): void {
  if (typeof window === 'undefined') return
  
  document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

/**
 * Check if user is authenticated (has valid token)
 * @returns boolean
 */
export function isAuthenticated(): boolean {
  return getToken() !== null
}

/**
 * Make an authenticated API request
 * Since we use HTTP-only cookies, the cookie is automatically sent with requests
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Fetch response
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important: include cookies in request
  })
}

/**
 * Logout user - clear token and redirect to login
 */
export async function logout(): Promise<void> {
  // Call logout API to clear HTTP-only cookie
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
  } catch (error) {
    console.error('Logout error:', error)
  }
  
  // Clear any client-side token
  clearToken()
  
  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login'
  }
}
