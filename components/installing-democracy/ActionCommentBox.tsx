'use client'

import { useState } from 'react'
import { MessageSquarePlus, Pencil, Trash2, Loader2, Check, X } from 'lucide-react'
import { useTranslation } from '@/i18n'

const MAX_COMMENT_LENGTH = 2000

interface ActionCommentBoxProps {
  /** The expert's own comment on this action, or undefined if none yet. */
  comment: string | undefined
  onSave: (body: string) => Promise<{ ok: boolean; error?: string }>
  onDelete: () => Promise<{ ok: boolean; error?: string }>
  disabled?: boolean
}

/**
 * One expert's private note on one action (comment system spec: one note per
 * expert per action, private between experts, instant save). Purely local
 * UI state machine — every add/edit/delete round-trips to the server the
 * moment it's confirmed, independent of the score "Save progress" button.
 */
export function ActionCommentBox({ comment, onSave, onDelete, disabled }: ActionCommentBoxProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setDraft(comment ?? '')
    setError(null)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError(null)
  }

  async function handleSave() {
    if (!draft.trim()) return
    setSaving(true)
    setError(null)
    const result = await onSave(draft)
    setSaving(false)

    if (!result.ok) {
      setError(t('installingDemocracy.participate.comment.saveError'))
      return
    }
    setEditing(false)
  }

  async function handleDelete() {
    setSaving(true)
    setError(null)
    const result = await onDelete()
    setSaving(false)

    if (!result.ok) {
      setError(t('installingDemocracy.participate.comment.saveError'))
      return
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-1.5">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          maxLength={MAX_COMMENT_LENGTH}
          rows={3}
          disabled={saving}
          placeholder={t('installingDemocracy.participate.comment.placeholder')}
          className="w-full resize-none rounded-md border border-umbral-ash bg-umbral-charcoal px-2.5 py-2 text-xs text-white placeholder-umbral-muted focus:outline-none focus:border-signal-teal disabled:opacity-50"
        />
        {error && <p className="text-[10px] text-signal-red">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !draft.trim()}
            className="inline-flex items-center gap-1 rounded-md border border-signal-teal px-2.5 py-1 text-[10px] font-medium text-signal-teal hover:bg-signal-teal/10 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> : <Check className="w-3 h-3" aria-hidden="true" />}
            {t('installingDemocracy.participate.comment.save')}
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-md border border-umbral-ash px-2.5 py-1 text-[10px] text-umbral-muted hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-3 h-3" aria-hidden="true" />
            {t('installingDemocracy.participate.comment.cancel')}
          </button>
          {comment && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="ml-auto inline-flex items-center gap-1 rounded-md border border-signal-red/30 px-2.5 py-1 text-[10px] text-signal-red hover:bg-signal-red/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" aria-hidden="true" />
              {t('installingDemocracy.participate.comment.delete')}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (comment) {
    return (
      <div className="space-y-1">
        <p className="whitespace-pre-wrap rounded-md border border-umbral-ash bg-umbral-charcoal/60 px-2.5 py-2 text-xs text-umbral-light">
          {comment}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startEdit}
            disabled={disabled}
            className="inline-flex items-center gap-1 text-[10px] text-umbral-muted hover:text-white transition-colors disabled:opacity-50"
          >
            <Pencil className="w-3 h-3" aria-hidden="true" />
            {t('installingDemocracy.participate.comment.edit')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={disabled || saving}
            className="inline-flex items-center gap-1 text-[10px] text-signal-red hover:text-signal-red/80 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> : <Trash2 className="w-3 h-3" aria-hidden="true" />}
            {t('installingDemocracy.participate.comment.delete')}
          </button>
        </div>
        {error && <p className="text-[10px] text-signal-red">{error}</p>}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 text-[10px] text-umbral-muted hover:text-white transition-colors disabled:opacity-50"
    >
      <MessageSquarePlus className="w-3.5 h-3.5" aria-hidden="true" />
      {t('installingDemocracy.participate.comment.add')}
    </button>
  )
}
