'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MeetingChatPanel } from './MeetingChatPanel'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: Record<string, unknown>) => {
      executeCommand: (command: string, ...args: unknown[]) => void
      addEventListeners: (listeners: Record<string, () => void>) => void
      dispose: () => void
    }
  }
}

interface Props {
  roomName: string
  displayName: string
  courseTitle: string
  meetingId: string
  userId: string
}

export function JitsiMeetEmbed({ roomName, displayName, courseTitle, meetingId, userId }: Props) {
  const [joined, setJoined]     = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef       = useRef<any>(null)
  const router       = useRouter()

  useEffect(() => {
    if (!joined) return

    let api: any = null

    const init = () => {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return
      const jitsiDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jitsi.at'
      api = new window.JitsiMeetExternalAPI(jitsiDomain, {
        roomName,
        parentNode: containerRef.current,
        userInfo:   { displayName },
        configOverwrite: {
          prejoinPageEnabled:     false,
          startWithAudioMuted:    false,
          startWithVideoMuted:    false,
          disableDeepLinking:     true,
          enableWelcomePage:      false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK:       false,
          SHOW_WATERMARK_FOR_GUESTS:  false,
          TOOLBAR_ALWAYS_VISIBLE:     false,
          HIDE_INVITE_MORE_HEADER:    true,
        },
        width:  '100%',
        height: '100%',
      })
      apiRef.current = api
      api.addEventListeners({
        readyToClose: () => {
          api.dispose()
          apiRef.current = null
          setJoined(false)
        },
      })
    }

    // Load external API script if not already present
    if (window.JitsiMeetExternalAPI) {
      init()
    } else {
      const script = document.createElement('script')
      const jitsiScriptDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jitsi.at'
      script.src = `https://${jitsiScriptDomain}/external_api.js`
      script.async = true
      script.onload = init
      document.head.appendChild(script)
    }

    return () => {
      api?.dispose()
      apiRef.current = null
    }
  }, [joined, roomName, displayName])

  function handleLeave() {
    apiRef.current?.dispose()
    apiRef.current = null
    setJoined(false)
    router.push('/dashboard/meetings')
  }

  /* ── Lobby ──────────────────────────────────────────────── */
  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-[rgba(30,58,95,0.08)] flex items-center justify-center text-4xl mb-6">
          🎥
        </div>
        <h2 className="text-xl font-bold text-[var(--ag-text)] mb-2">Sala de reunión</h2>
        <p className="text-[var(--ag-text-muted)] text-sm mb-1">{courseTitle}</p>
        <p className="text-xs text-[var(--ag-text)]/30 mb-8 max-w-xs">
          Al unirte se activará tu cámara y micrófono. Podés desactivarlos dentro de la reunión.
        </p>
        <button
          onClick={() => setJoined(true)}
          className="px-8 py-3 rounded-xl bg-[var(--ag-navy)] text-white font-semibold text-sm hover:bg-[var(--ag-navy)]/90 transition-all shadow-lg "
        >
          Unirse a la reunión
        </button>
      </div>
    )
  }

  /* ── Active meeting ─────────────────────────────────────── */
  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 130px)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <p className="text-sm font-medium text-[var(--ag-text-muted)] truncate">{courseTitle}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Chat toggle — mobile only */}
          <button
            onClick={() => setChatOpen(v => !v)}
            className="lg:hidden text-xs px-3 py-1.5 rounded-lg border border-[var(--ag-border)] text-[var(--ag-text-muted)] hover:bg-[var(--ag-surface-alt)] transition-all"
          >
            {chatOpen ? 'Ver video' : '💬 Chat'}
          </button>
          <button
            onClick={handleLeave}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 bg-red-50 hover:bg-red-200/60 transition-all font-medium"
          >
            Salir de la reunión
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Jitsi container — hidden on mobile when chat is open */}
        <div
          ref={containerRef}
          className={`rounded-2xl overflow-hidden border border-[var(--ag-border)] shadow-sm flex-1 min-w-0 ${chatOpen ? 'hidden lg:block' : 'block'}`}
        />

        {/* Chat — full width on mobile when open, fixed sidebar on desktop */}
        <div className={`w-full lg:w-72 lg:flex-shrink-0 ${chatOpen ? 'block' : 'hidden lg:block'}`}>
          <MeetingChatPanel meetingId={meetingId} userId={userId} displayName={displayName} />
