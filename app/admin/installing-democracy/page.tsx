'use client'

import { useEffect, useMemo, useState } from 'react'
import { getAllTransitionActions, updateTransitionActionAdmin, type TransitionActionPatch } from './actions'
import { Toast } from '@/components/admin/Toast'
import { PILLAR_ICONS } from '@/components/installing-democracy/icons'
import { phaseForMonth } from '@/data/transition-phases'
import { PHASE_KEY_BY_NUMBER } from '@/lib/transition'
import type { TransitionAction, TransitionSource, TransitionStatus } from '@/types'

type ToastState = { message: string; type: 'success' | 'error' } | null

const STATUSES: TransitionStatus[] = ['pending', 'in_progress', 'completed', 'stalled']

const STATUS_STYLES: Record<TransitionStatus, string> = {
  pending: 'bg-gray-800/50 text-gray-300 border border-gray-600/30',
  in_progress: 'bg-amber-950/30 text-amber-400 border border-amber-500/30',
  completed: 'bg-teal-950/30 text-teal-400 border border-teal-500/30',
  stalled: 'bg-red-950/30 text-red-400 border border-red-500/30',
}

// English display labels only — admin has no i18n (matches existing admin pages).
const PHASE_TITLES: Record<string, string> = {
  liberties: 'Freedoms (Month 3)',
  electoralInstitutions: 'Electoral institutions (Month 6)',
  competition: 'Competition (Month 7)',
  foundingElection: 'Founding election (Months 10-11)',
  transfer: 'Transfer (Month 12)',
  consolidation: 'Consolidation (Month 18)',
}
const PHASE_ORDER = ['liberties', 'electoralInstitutions', 'competition', 'foundingElection', 'transfer', 'consolidation']

interface EditFormState {
  status: TransitionStatus
  evidenceEs: string
  evidenceEn: string
  sources: TransitionSource[]
  completedDate: string
}

function toFormState(action: TransitionAction): EditFormState {
  return {
    status: action.status,
    evidenceEs: action.evidenceEs ?? '',
    evidenceEn: action.evidenceEn ?? '',
    sources: action.sources,
    completedDate: action.completedDate ?? '',
  }
}

export default function InstallingDemocracyAdminPage() {
  const [actions, setActions] = useState<TransitionAction[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EditFormState | null>(null)
  const [saving, setSaving] = useState(false)

  const [pillarFilter, setPillarFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const res = await getAllTransitionActions()
    if (res.data) setActions(res.data)
    if (res.error) setToast({ message: res.error, type: 'error' })
    setLoading(false)
  }

  const pillarKeys = Object.keys(PILLAR_ICONS)

  const filtered = useMemo(() => {
    let result = [...actions]
    if (pillarFilter !== 'all') result = result.filter(a => a.pillar === pillarFilter)
    if (statusFilter !== 'all') result = result.filter(a => a.status === statusFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a =>
        a.actionEn.toLowerCase().includes(q) ||
        a.actionEs.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      )
    }
    return result
  }, [actions, pillarFilter, statusFilter, searchQuery])

  const grouped = useMemo(() => {
    const map = new Map<string, TransitionAction[]>()
    for (const key of PHASE_ORDER) map.set(key, [])
    for (const action of filtered) {
      const key = PHASE_KEY_BY_NUMBER[phaseForMonth(action.month)]
      map.get(key)?.push(action)
    }
    return map
  }, [filtered])

  function startEdit(action: TransitionAction) {
    setEditingId(action.id)
    setForm(toFormState(action))
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(null)
  }

  async function saveEdit(id: string) {
    if (!form) return
    setSaving(true)
    const patch: TransitionActionPatch = {
      status: form.status,
      evidenceEs: form.evidenceEs.trim() || null,
      evidenceEn: form.evidenceEn.trim() || null,
      sources: form.sources.filter(s => s.url.trim()),
      completedDate: form.completedDate || null,
    }

    const result = await updateTransitionActionAdmin(id, patch)
    setSaving(false)

    if (result.error) {
      setToast({ message: result.error, type: 'error' })
      return
    }

    setToast({ message: 'Action updated', type: 'success' })
    setActions(prev => prev.map(a => (a.id === id && result.data ? result.data : a)))
    cancelEdit()
  }

  function addSourceRow() {
    if (!form) return
    setForm({ ...form, sources: [...form.sources, { url: '', title: '', date: '' }] })
  }

  function updateSourceRow(index: number, patch: Partial<TransitionSource>) {
    if (!form) return
    const sources = form.sources.map((s, i) => (i === index ? { ...s, ...patch } : s))
    setForm({ ...form, sources })
  }

  function removeSourceRow(index: number) {
    if (!form) return
    setForm({ ...form, sources: form.sources.filter((_, i) => i !== index) })
  }

  if (loading) {
    return <div className="text-gray-400">Loading transition checklist...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Installing Democracy — Transition Checklist</h1>
        <p className="text-sm text-gray-400">
          {actions.length} actions · {actions.filter(a => a.status === 'completed').length} completed ·{' '}
          {actions.filter(a => a.status === 'in_progress').length} in progress
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search actions..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 min-w-[220px]"
        />
        <select
          value={pillarFilter}
          onChange={e => setPillarFilter(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:border-teal-500"
        >
          <option value="all">All pillars</option>
          {pillarKeys.map(key => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:border-teal-500"
        >
          <option value="all">All statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Grouped list */}
      {PHASE_ORDER.map(phaseKey => {
        const rows = grouped.get(phaseKey) ?? []
        if (rows.length === 0) return null

        return (
          <div key={phaseKey} className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide pt-2">
              {PHASE_TITLES[phaseKey]} — {rows.length} action{rows.length === 1 ? '' : 's'}
            </h2>

            <div className="space-y-2">
              {rows.map(action => {
                const PillarIcon = PILLAR_ICONS[action.pillar]
                const isEditing = editingId === action.id

                return (
                  <div key={action.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 p-3">
                      {PillarIcon && <PillarIcon className="w-4 h-4 text-teal-400 shrink-0" />}
                      <span className="text-xs text-gray-500 font-mono shrink-0">{action.id}</span>
                      <span className="text-xs text-gray-500 shrink-0">Month {action.month}</span>
                      <p className="text-sm text-white flex-1 min-w-0 truncate" title={action.actionEn}>
                        {action.actionEn}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wide shrink-0 ${STATUS_STYLES[action.status]}`}>
                        {action.status}
                      </span>
                      <button
                        onClick={() => (isEditing ? cancelEdit() : startEdit(action))}
                        className="px-3 py-1 text-xs text-teal-400 hover:text-teal-300 border border-teal-500/30 rounded-md shrink-0"
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                    </div>

                    {isEditing && form && (
                      <div className="border-t border-gray-800 p-4 space-y-4 bg-gray-950/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Status</label>
                            <select
                              value={form.status}
                              onChange={e => setForm({ ...form, status: e.target.value as TransitionStatus })}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:border-teal-500"
                            >
                              {STATUSES.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Completed date</label>
                            <input
                              type="date"
                              value={form.completedDate}
                              onChange={e => setForm({ ...form, completedDate: e.target.value })}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Evidence (Spanish)</label>
                            <textarea
                              value={form.evidenceEs}
                              onChange={e => setForm({ ...form, evidenceEs: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                              placeholder="Qué ocurrió..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Evidence (English)</label>
                            <textarea
                              value={form.evidenceEn}
                              onChange={e => setForm({ ...form, evidenceEn: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                              placeholder="What happened..."
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs text-gray-400">Sources</label>
                            <button
                              onClick={addSourceRow}
                              className="text-xs text-teal-400 hover:text-teal-300"
                            >
                              + Add source
                            </button>
                          </div>
                          <div className="space-y-2">
                            {form.sources.map((source, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="URL"
                                  value={source.url}
                                  onChange={e => updateSourceRow(i, { url: e.target.value })}
                                  className="flex-1 px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Title (optional)"
                                  value={source.title ?? ''}
                                  onChange={e => updateSourceRow(i, { title: e.target.value })}
                                  className="w-40 px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                                />
                                <input
                                  type="date"
                                  value={source.date ?? ''}
                                  onChange={e => updateSourceRow(i, { date: e.target.value })}
                                  className="px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-teal-500"
                                />
                                <button
                                  onClick={() => removeSourceRow(i)}
                                  className="text-xs text-red-400 hover:text-red-300 px-2"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            {form.sources.length === 0 && (
                              <p className="text-xs text-gray-600">No sources added yet.</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => saveEdit(action.id)}
                            disabled={saving}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500 text-sm">No actions match your filters.</div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
