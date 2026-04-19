'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type UseAuthResult =
  | { status: 'loading'; user: null }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated'; user: null }

/**
 * Hook cliente para leer el usuario autenticado de Supabase Auth.
 * También escucha cambios de sesión (login / logout en tiempo real).
 */
export function useAuth(): UseAuthResult {
  const [result, setResult] = useState<UseAuthResult>({ status: 'loading', user: null })

  useEffect(() => {
    const supabase = createClient()

    // Carga inicial
    supabase.auth.getUser().then(({ data: { user } }) => {
      setResult(user
        ? { status: 'authenticated', user }
        : { status: 'unauthenticated', user: null }
      )
    })

    // Listener de cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setResult(session?.user
        ? { status: 'authenticated', user: session.user }
        : { status: 'unauthenticated', user: null }
      )
    })

    return () => subscription.unsubscribe()
  }, [])

  return result
}
