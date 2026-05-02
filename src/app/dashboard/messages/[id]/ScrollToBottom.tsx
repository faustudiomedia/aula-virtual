'use client'

import { useEffect } from 'react'

export function ScrollToBottom() {
  useEffect(() => {
    document.getElementById('messages-end')?.scrollIntoView({ behavior: 'smooth' })
  }, [])
  return null
}
