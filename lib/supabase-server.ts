import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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

/**
 * Admin client using service role key — bypasses RLS.
 * Only use in server actions that are already auth-protected.
 */
export function createAdminClient() {
  if (IS_MOCK_MODE) {
    return null
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceKey) {
    return null
  }

  return createSupabaseClient(url, serviceKey)
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

/**
 * PostgREST caps every response at `max-rows` (1000 on Supabase) and returns
 * the truncated page **without an error** — so an unpaginated `.select()` over
 * a table that has outgrown 1000 rows silently reports partial data.
 *
 * This bit twice, both against `transition_evaluations` (1232 rows and growing
 * by 60 for every expert who completes the checklist):
 *   - the admin Experts tab counted 0 rated actions for the most recently
 *     added evaluators, because the rows past the cap were theirs;
 *   - the SQL backup exported only the first 1000 evaluations while its own
 *     header claimed to be a complete module dump.
 *
 * `fetchAllRows` re-runs the caller's query over successive `.range()` windows
 * until a short page comes back. Prefer it over a bare `.select()` for any
 * table whose row count scales with actions (60) times experts — those cross
 * 1000 quickly and fail silently when they do.
 *
 * The caller supplies a `page(from, to)` closure so it keeps full control of
 * columns, filters and ordering; it must not set its own `.range()`/`.limit()`.
 *
 * NOTE: paging is only consistent under a stable sort. Callers that care about
 * row order across pages should `.order()` on a unique column.
 */
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{
    data: T[] | null
    error: { message: string } | null
  }>,
  pageSize = 1000
): Promise<{ data: T[]; error: string | null }> {
  const all: T[] = []

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1)
    if (error) return { data: [], error: error.message }

    const rows = data ?? []
    all.push(...rows)

    // A short page means we reached the end. An exactly-full page is
    // ambiguous, so we loop once more and take the empty page as the signal.
    if (rows.length < pageSize) break
  }

  return { data: all, error: null }
}
