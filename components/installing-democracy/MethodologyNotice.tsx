'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { MethodologyPanel } from './MethodologyPanel'

/** Query flag that makes the methodology view linkable and back-button aware. */
const PARAM = 'methodology'

export function MethodologyNotice() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  // Whether this component pushed the history entry. Someone arriving on a
  // shared ?methodology=1 link has no entry to pop, and calling back() would
  // send them off the site entirely.
  const pushedRef = useRef(false)

  // Open state lives in the URL rather than only in React, so the view can be
  // shared and the back button closes it. `history.pushState` is used directly
  // instead of the router: this only ever touches the query on the current
  // path, and it avoids pulling `useSearchParams` into a page that would then
  // need a Suspense boundary to prerender.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has(PARAM)) setOpen(true)

    function onPopState() {
      const current = new URLSearchParams(window.location.search)
      const isOpen = current.has(PARAM)
      setOpen(isOpen)
      if (!isOpen) pushedRef.current = false
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const handleOpen = useCallback(() => {
    const params = new URLSearchParams(window.location.search)
    params.set(PARAM, '1')
    window.history.pushState({}, '', `${window.location.pathname}?${params}`)
    pushedRef.current = true
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    if (pushedRef.current) {
      // Pop our own entry so the URL and the back stack stay in step.
      pushedRef.current = false
      window.history.back()
      setOpen(false)
    } else {
      const params = new URLSearchParams(window.location.search)
      params.delete(PARAM)
      const query = params.toString()
      window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''))
      setOpen(false)
    }
    triggerRef.current?.focus()
  }, [])

  // The notice reads as one sentence with the link inside it, so the copy is a
  // single translated string split on its {link} placeholder.
  const [before, after] = t('installingDemocracy.methodology.notice').split('{link}')

  return (
    <>
      <div className="card flex items-start gap-3 p-4 md:p-5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-signal-teal" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-umbral-muted">
          {before}
          <button
            ref={triggerRef}
            type="button"
            onClick={handleOpen}
            className="text-signal-teal underline underline-offset-2 transition-colors hover:text-white"
          >
            {t('installingDemocracy.methodology.noticeLink')}
          </button>
          {after}
        </p>
      </div>

      <MethodologyPanel open={open} onClose={handleClose} />
    </>
  )
}
