'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

type UseProfileResult =
  | { status: 'loading'; profile: null }
  | { status: 'loaded';  profile: Profile }
  | { status: 'error';   profile: null }

/**
 * Hook cliente para leer el perfil del usuario autenticado.
 * Útil en componentes que necesitan datos del perfil sin Server Components.
 */
export function useProfile(): UseProfileResult {
  const [result, setResult] = useState<UseProfileResult>({ status: 'loading', profile: null })

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setResult({ status: 'error', profile: null })
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !profile) {
        setResult({ status: 'error', profile: null })
        return
      }

      setResult({ status: 'loaded', profile: profile as Profile })
    }

    load()
  }, [])

  return result
}
