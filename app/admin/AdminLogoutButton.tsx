'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export function AdminLogoutButton() {
  const router = useRouter()
  const supabase = createClient()
  const isMockMode = !supabase

  const handleLogout = async () => {
    if (isMockMode) {
      // Clear mock session cookie
      document.cookie = 'mock-admin-session=; path=/; max-age=0'
    } else {
      await supabase.auth.signOut()
    }

    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors"
    >
      Logout
    </button>
  )
}
