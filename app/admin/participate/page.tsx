'use client'

import { useEffect, useState } from 'react'
import type { ExpertSubmission, PublicSubmission } from '@/types'
import {
  getAllExpertSubmissionsAction,
  getAllPublicSubmissionsAction,
  updateExpertStatusAction,
  deletePublicSubmissionAction,
} from './actions'
import { Toast } from '@/components/admin/Toast'

type ToastState = { message: string; type: 'success' | 'error' } | null
type ActiveTab = 'expert' | 'public'
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

const SCENARIOS = [
  { number: 1, name: 'Regressed Autocracy', color: 'bg-red-500', textColor: 'text-red-400', bgLight: 'bg-red-950/30', borderColor: 'border-red-500/30' },
  { number: 2, name: 'Reverted Liberalization', color: 'bg-red-500', textColor: 'text-red-400', bgLight: 'bg-red-950/30', borderColor: 'border-red-500/30' },
  { number: 3, name: 'Stabilized Electoral Autocracy', color: 'bg-amber-500', textColor: 'text-amber-400', bgLight: 'bg-amber-950/30', borderColor: 'border-amber-500/30' },
  { number: 4, name: 'Preempted Democratic Transition', color: 'bg-amber-500', textColor: 'text-amber-400', bgLight: 'bg-amber-950/30', borderColor: 'border-amber-500/30' },
  { number: 5, name: 'Democratic Transition', color: 'bg-blue-500', textColor: 'text-blue-400', bgLight: 'bg-blue-950/30', borderColor: 'border-blue-500/30' },
]

const LIKERT_LABELS: Record<number, string> = {
  1: 'Very Unlikely',
  2: 'Unlikely',
  3: 'Possible',
  4: 'Likely',
  5: 'Very Likely',
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-950/30 text-amber-400 border border-amber-500/30',
  approved: 'bg-teal-950/30 text-teal-400 border border-teal-500/30',
  rejected: 'bg-red-950/30 text-red-400 border border-red-500/30',
}

export default function ParticipateAdminPage() {
  const [expertSubmissions, setExpertSubmissions] = useState<ExpertSubmission[]>([])
  const [publicSubmissions, setPublicSubmissions] = useState<PublicSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('expert')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [expertRes, publicRes] = await Promise.all([
        getAllExpertSubmissionsAction(),
        getAllPublicSubmissionsAction(),
      ])
      if (expertRes.data) setExpertSubmissions(expertRes.data)
      if (publicRes.data) setPublicSubmissions(publicRes.data)
      if (expertRes.error || publicRes.error) {
        setToast({ message: expertRes.error || publicRes.error || 'Failed to load', type: 'error' })
      }
    } catch {
      setToast({ message: 'Failed to load submissions', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Expert actions
  const handleApprove = async (id: string) => {
    try {
      const result = await updateExpertStatusAction(id, 'approved')
      if (result.error) {
        setToast({ message: result.error, type: 'error' })
      } else {
        setToast({ message: 'Expert submission approved', type: 'success' })
        setExpertSubmissions(prev =>
          prev.map(s => s.id === id ? { ...s, status: 'approved' as const, reviewed_at: new Date().toISOString() } : s)
        )
      }
    } catch {
      setToast({ message: 'Failed to approve submission', type: 'error' })
    }
  }

  const handleReject = async (id: string) => {
    try {
      const result = await updateExpertStatusAction(id, 'rejected')
      if (result.error) {
        setToast({ message: result.error, type: 'error' })
      } else {
        setToast({ message: 'Expert submission rejected', type: 'success' })
        setExpertSubmissions(prev =>
          prev.map(s => s.id === id ? { ...s, status: 'rejected' as const, reviewed_at: new Date().toISOString() } : s)
        )
      }
    } catch {
      setToast({ message: 'Failed to reject submission', type: 'error' })
    }
  }

  const handleDeletePublic = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return

    try {
      const result = await deletePublicSubmissionAction(id)
      if (result.error) {
        setToast({ message: result.error, type: 'error' })
      } else {
        setToast({ message: 'Public submission removed', type: 'success' })
        setPublicSubmissions(prev => prev.filter(s => s.id !== id))
      }
    } catch {
      setToast({ message: 'Failed to delete submission', type: 'error' })
    }
  }

  // Filtering
  const filteredExperts = expertSubmissions.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.institution.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Stats
  const pendingCount = expertSubmissions.filter(s => s.status === 'pending').length
  const approvedCount = expertSubmissions.filter(s => s.status === 'approved').length
  const rejectedCount = expertSubmissions.filter(s => s.status === 'rejected').length
  const approvalRate = (approvedCount + rejectedCount) > 0
    ? Math.round((approvedCount / (approvedCount + rejectedCount)) * 100)
    : 0

  // Public scenario distribution
  const scenarioCounts = [1, 2, 3, 4, 5].map(n => publicSubmissions.filter(s => s.resolved_scenario === n).length)
  const maxCount = Math.max(...scenarioCounts, 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Participate</h1>
        <p className="text-gray-400">Manage expert and public poll submissions</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111113] border border-gray-800 rounded-lg p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-teal-950/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Expert Submissions</p>
              <p className="text-white text-2xl font-bold">{expertSubmissions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111113] border border-gray-800 rounded-lg p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-950/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pending Review</p>
              <p className={`text-2xl font-bold ${pendingCount > 0 ? 'text-amber-400' : 'text-white'}`}>{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111113] border border-gray-800 rounded-lg p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-950/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Public Responses</p>
              <p className="text-white text-2xl font-bold">{publicSubmissions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111113] border border-gray-800 rounded-lg p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-950/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Approval Rate</p>
              <p className="text-white text-2xl font-bold">{approvalRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('expert')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'expert'
              ? 'bg-teal-600 text-white'
              : 'bg-[#111113] border border-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Expert Submissions ({expertSubmissions.length})
        </button>
        <button
          onClick={() => setActiveTab('public')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'public'
              ? 'bg-teal-600 text-white'
              : 'bg-[#111113] border border-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Public Submissions ({publicSubmissions.length})
        </button>
      </div>

      {/* ============================================================ */}
      {/* EXPERT TAB */}
      {/* ============================================================ */}
      {activeTab === 'expert' && (
        <div>
          {/* Filter Bar */}
          <div className="bg-[#111113] border border-gray-800 rounded-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, email, or institution..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0a0b] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full md:w-48 px-4 py-2 bg-[#0a0a0b] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Showing {filteredExperts.length} of {expertSubmissions.length} submissions
            </div>
          </div>

          {/* Expert Submissions List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredExperts.map((sub) => (
              <div key={sub.id} className="bg-[#111113] border border-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-bold text-lg">{sub.name}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded ${statusStyles[sub.status]}`}>
                        {sub.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{sub.institution}</p>
                    <p className="text-gray-500 text-sm">{sub.email}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-500 font-mono">
                      {new Date(sub.submitted_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">{sub.id}</p>
                  </div>
                </div>

                {/* Ideology Score */}
                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-2">Ideological Self-Placement</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">LEFT</span>
                    <div className="flex-1 flex gap-0.5">
                      {Array.from({ length: 11 }, (_, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-3 rounded-sm ${
                            i === sub.ideology_score
                              ? 'bg-teal-500'
                              : i < sub.ideology_score
                                ? 'bg-teal-900/50'
                                : 'bg-gray-800'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">RIGHT</span>
                    <span className="text-teal-400 font-mono font-bold ml-2">{sub.ideology_score}</span>
                  </div>
                </div>

                {/* Scenario Ratings */}
                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-2">Scenario Probability Ratings</p>
                  <div className="flex flex-wrap gap-2">
                    {SCENARIOS.map((s) => {
                      const rating = sub.scenario_probabilities[s.number]
                      return (
                        <span
                          key={s.number}
                          className={`px-2.5 py-1 text-xs rounded ${s.bgLight} ${s.textColor} border ${s.borderColor}`}
                        >
                          S{s.number}: {LIKERT_LABELS[rating] || '—'}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Actions */}
                {sub.status === 'pending' && (
                  <div className="flex gap-2 pt-3 border-t border-gray-800">
                    <button
                      onClick={() => handleApprove(sub.id)}
                      className="px-4 py-1.5 text-sm text-teal-400 hover:text-teal-300 border border-teal-500/30 hover:border-teal-500/50 rounded transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(sub.id)}
                      className="px-4 py-1.5 text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {sub.reviewed_at && (
                  <p className="text-gray-600 text-xs mt-3">
                    Reviewed: {new Date(sub.reviewed_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            ))}

            {filteredExperts.length === 0 && (
              <div className="bg-[#111113] border border-gray-800 rounded-lg p-12 text-center">
                <p className="text-gray-400">No expert submissions found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PUBLIC TAB */}
      {/* ============================================================ */}
      {activeTab === 'public' && (
        <div>
          {/* Scenario Distribution */}
          <div className="bg-[#111113] border border-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-white font-semibold mb-4">Scenario Distribution</h3>
            <div className="space-y-3">
              {SCENARIOS.map((s, i) => {
                const count = scenarioCounts[i]
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
                return (
                  <div key={s.number}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className={`${s.textColor} font-medium`}>
                        S{s.number} — {s.name}
                      </span>
                      <span className="text-white font-bold font-mono">{count}</span>
                    </div>
                    <div className="h-4 bg-gray-800/50 rounded overflow-hidden">
                      <div
                        className={`h-full ${s.color} rounded transition-all duration-500`}
                        style={{ width: `${pct}%`, minWidth: count > 0 ? '4px' : '0' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-gray-500 text-xs mt-4">
              {publicSubmissions.length} total responses
            </p>
          </div>

          {/* Public Submissions List */}
          <div className="bg-[#111113] border border-gray-800 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">All Submissions</h3>
            <div className="space-y-2">
              {publicSubmissions.map((sub) => {
                const scenario = SCENARIOS[sub.resolved_scenario - 1]
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between py-3 px-4 border border-gray-800/50 rounded-lg hover:bg-gray-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-0.5 text-xs rounded font-bold ${scenario.bgLight} ${scenario.textColor} border ${scenario.borderColor}`}>
                        S{sub.resolved_scenario}
                      </span>
                      <div>
                        <p className="text-gray-300 text-sm">{sub.email}</p>
                        <p className="text-gray-600 text-xs">{sub.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 text-sm font-mono">
                        {new Date(sub.submitted_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric',
                        })}
                      </span>
                      <button
                        onClick={() => handleDeletePublic(sub.id)}
                        className="p-1.5 text-red-400/50 hover:text-red-400 transition-colors rounded hover:bg-red-950/30"
                        title="Delete submission"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}

              {publicSubmissions.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-gray-400">No public submissions yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
