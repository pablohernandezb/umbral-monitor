import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { IS_MOCK_MODE } from './supabase'

export async function createClient() {
  if (IS_MOCK_MODE) {
    return null
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{name: string, value: string, options?: CookieOptions}>) {
          try {
            cookiesToSet.forEach(({ name, value }) =>
              cookieStore.set(name, value)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function getCurrentUser() {
  if (IS_MOCK_MODE) {
    const cookieStore = await cookies()
    const mockSession = cookieStore.get('mock-admin-session')

    if (mockSession?.value === 'authenticated') {
      return {
        id: 'mock-admin-id',
        email: 'admin@umbral.local',
      }
    }
    return null
  }

  const supabase = await createClient()
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function isAdmin() {
  const user = await getCurrentUser()
  return !!user
}
