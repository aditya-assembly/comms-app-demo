import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { AppShell } from '@/components/app/AppShell'

export default function AppPage() {
  const { checkSession } = useAuthStore()

  useEffect(() => {
    void checkSession()
  }, [checkSession])

  return <AppShell />
}
