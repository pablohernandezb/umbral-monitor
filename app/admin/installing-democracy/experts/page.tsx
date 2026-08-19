'use client'

import { useEffect, useState } from 'react'
import {
  listApplications,
  approveApplication,
  rejectApplication,
  regenerateCode,
} from './actions'
import { Toast } from '@/components/admin/Toast'
import type { MonitoringExpert, MonitoringStatus } from '@/types'

type ToastState = { message: string; type: 'success' | 'error' } | null
type Tab = MonitoringStatus

const TABS: Tab[] = ['pending', 'approved', 'rejected']

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="px-2 py-1 text-[11px] text-teal-400 border border-teal-500/30 rounded hover:bg-teal-950/30 transition-colors shrink-0"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function MonitoringExpertsAdminPage() {
  const [experts, setExperts] = useState<MonitoringExpert[]>([])
  const [ratedCounts, setRatedCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('pending')
  const [toast, setToast] = useState<ToastState>(null)
  // Held after Approve so the fresh code stays visible even once the row
  // itself has moved out of the Pending tab on refetch.
  const [revealed, setRevealed] = useState<{ name: string; code: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function reload() {
    setLoading(true)
    const res = await listApplications()
    setExperts(res.data)
    setRatedCounts(res.ratedCounts)
    if (res.error) setToast({ message: res.error, type: 'error' })
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleApprove(expert: MonitoringExpert) {
    setBusyId(expert.id)
    const res = await approveApplication(expert.id)
    setBusyId(null)

    if (res.error || !res.data?.accessCode) {
      setToast({ message: res.error || 'Approval failed', type: 'error' })
      return
    }
    setRevealed({ name: expert.name, code: res.data.accessCode })
    setToast({ message: `${expert.name} approved`, type: 'success' })
    reload()
  }

  async function handleReject(expert: MonitoringExpert) {
    setBusyId(expert.id)
    const res = await rejectApplication(expert.id)
    setBusyId(null)
    if (res.error) {
      setToast({ message: res.error, type: 'error' })
      return
    }
    setToast({ message: `${expert.name} rejected`, type: 'success' })
    reload()
  }

  async function handleRegenerate(expert: MonitoringExpert) {
    setBusyId(expert.id)
    const res = await regenerateCode(expert.id)
    setBusyId(null)
    if (res.error || !res.data?.accessCode) {
      setToast({ message: res.error || 'Could not regenerate code', type: 'error' })
      return
    }
    setRevealed({ name: expert.name, code: res.data.accessCode })
    reload()
  }

  const rows = experts.filter(e => e.status === tab)

  if (loading) {
    return <div className="text-gray-400">Loading monitoring applications...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Installing Democracy — Expert Monitoring</h1>
        <p className="text-sm text-gray-400">
          {experts.filter(e => e.status === 'pending').length} pending ·{' '}
          {experts.filter(e => e.status === 'approved').length} approved ·{' '}
          {experts.filter(e => e.status === 'rejected').length} rejected
        </p>
      </div>

      {revealed && (
        <div className="bg-teal-950/30 border border-teal-500/30 rounded-lg p-4 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-teal-100">
              Access code for <span className="font-semibold">{revealed.name}</span>:
            </p>
            <p className="font-mono text-lg text-white tracking-wider break-all">{revealed.code}</p>
            <p className="text-xs text-teal-200/70 mt-1">
              Send this code to the expert; it won&apos;t be emailed automatically.
            </p>
          </div>
          <CopyButton text={revealed.code} />
          <button
            onClick={() => setRevealed(null)}
            className="text-xs text-gray-400 hover:text-white shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors capitalize ${
              tab === t
                ? 'bg-teal-950/40 border-teal-500/40 text-teal-300'
                : 'border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t} ({experts.filter(e => e.status === t).length})
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {rows.length === 0 && (
          <div className="text-center py-16 text-gray-500 text-sm">No {tab} applications.</div>
        )}

        {rows.map(expert => (
          <div
            key={expert.id}
            className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center gap-4 flex-wrap"
          >
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-medium text-white">{expert.name}</p>
              <p className="text-xs text-gray-400">{expert.email} · {expert.institution}</p>
            </div>
            <p className="text-xs text-gray-500 shrink-0">{formatDate(expert.createdAt)}</p>

            {tab === 'approved' && (
              <>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-xs text-gray-300 tracking-wider">
                    {expert.accessCode}
                  </span>
                  {expert.accessCode && <CopyButton text={expert.accessCode} />}
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {ratedCounts[expert.id] ?? 0}/62 rated
                </span>
                <button
                  onClick={() => handleRegenerate(expert)}
                  disabled={busyId === expert.id}
                  className="px-3 py-1 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-md shrink-0 disabled:opacity-50"
                >
                  Regenerate
                </button>
              </>
            )}

            {tab === 'pending' && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleApprove(expert)}
                  disabled={busyId === expert.id}
                  className="px-3 py-1 text-xs text-teal-400 hover:text-teal-300 border border-teal-500/30 rounded-md disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(expert)}
                  disabled={busyId === expert.id}
                  className="px-3 py-1 text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-md disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
