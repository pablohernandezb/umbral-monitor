'use client'

import { useEffect, useState } from 'react'
import { Toast } from '@/components/admin/Toast'
import {
  getAllGdeltEventsAction,
  createGdeltEventAction,
  updateGdeltEventAction,
  deleteGdeltEventAction,
} from './actions'
import type { GdeltEvent, GdeltAnnotationTier } from '@/types/gdelt'

type ToastState = { message: string; type: 'success' | 'error' } | null

const TIERS: GdeltAnnotationTier[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

const TIER_ES_MAP: Record<GdeltAnnotationTier, string> = {
  CRITICAL: 'CRÍTICO',
  HIGH: 'ALTA',
  MEDIUM: 'MEDIA',
  LOW: 'BAJA',
}

const TIER_COLORS: Record<GdeltAnnotationTier, string> = {
  CRITICAL: 'text-red-400 bg-red-950/30 border-red-500/30',
  HIGH: 'text-orange-400 bg-orange-950/30 border-orange-500/30',
  MEDIUM: 'text-yellow-400 bg-yellow-950/30 border-yellow-500/30',
  LOW: 'text-cyan-400 bg-cyan-950/30 border-cyan-500/30',
}

const emptyForm = (): Partial<GdeltEvent> => ({
  date: '',
  tier_en: 'MEDIUM',
  tier_es: 'MEDIA',
  label_en: '',
  label_es: '',
})

export default function GdeltEventsAdminPage() {
  const [items, setItems] = useState<GdeltEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<Partial<GdeltEvent>>(emptyForm())

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await getAllGdeltEventsAction()
      if (error) setToast({ message: error, type: 'error' })
      else if (data) setItems(data)
    } finally {
      setLoading(false)
    }
  }

  const handleTierChange = (tier: GdeltAnnotationTier) => {
    setFormData(prev => ({ ...prev, tier_en: tier, tier_es: TIER_ES_MAP[tier] }))
  }

  const handleCreate = async () => {
    if (!formData.date || !formData.label_en || !formData.label_es) {
      setToast({ message: 'Date, English label, and Spanish label are required', type: 'error' })
      return
    }
    const result = await createGdeltEventAction({
      date: formData.date!,
      tier_en: formData.tier_en as GdeltAnnotationTier,
      tier_es: formData.tier_es!,
      label_en: formData.label_en!,
      label_es: formData.label_es!,
    })
    if (result.error) {
      setToast({ message: result.error, type: 'error' })
    } else {
      setToast({ message: 'Event created successfully', type: 'success' })
      setShowCreateForm(false)
      setFormData(emptyForm())
      await loadData()
    }
  }

  const handleUpdate = async (id: string) => {
    if (!formData.date || !formData.label_en || !formData.label_es) {
      setToast({ message: 'Date, English label, and Spanish label are required', type: 'error' })
      return
    }
    const result = await updateGdeltEventAction(id, {
      date: formData.date,
      tier_en: formData.tier_en as GdeltAnnotationTier,
      tier_es: formData.tier_es,
      label_en: formData.label_en,
      label_es: formData.label_es,
    })
    if (result.error) {
      setToast({ message: result.error, type: 'error' })
    } else {
      setToast({ message: 'Event updated successfully', type: 'success' })
      setEditingId(null)
      setFormData(emptyForm())
      await loadData()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return
    const result = await deleteGdeltEventAction(id)
    if (result.error) {
      setToast({ message: result.error, type: 'error' })
    } else {
      setToast({ message: 'Event deleted', type: 'success' })
      await loadData()
    }
  }

  const startEdit = (item: GdeltEvent) => {
    setEditingId(item.id)
    setFormData(item)
    setShowCreateForm(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData(emptyForm())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading…</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">GDELT Event Timeline</h1>
        <p className="text-gray-400">Manage key political events displayed on the GDELT signal chart</p>
      </div>

      {/* Toolbar */}
      <div className="bg-[#111113] border border-gray-800 rounded-lg p-4 mb-6 flex items-center justify-between">
        <span className="text-sm text-gray-400">{items.length} events</span>
        <button
          onClick={() => { setShowCreateForm(true); setEditingId(null); setFormData(emptyForm()) }}
          className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors text-sm"
        >
          + New Event
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <EventForm
          data={formData}
          onChange={setFormData}
          onTierChange={handleTierChange}
          onSave={handleCreate}
          onCancel={() => { setShowCreateForm(false); setFormData(emptyForm()) }}
          title="Create New Event"
        />
      )}

      {/* Event list */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-[#111113] border border-gray-800 rounded-lg p-5">
            {editingId === item.id ? (
              <EventForm
                data={formData}
                onChange={setFormData}
                onTierChange={handleTierChange}
                onSave={() => handleUpdate(item.id)}
                onCancel={cancelEdit}
                title="Edit Event"
              />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <span className="font-mono text-sm text-gray-400 shrink-0 w-28">{item.date}</span>
                  <span className={`px-2 py-0.5 text-xs rounded border shrink-0 ${TIER_COLORS[item.tier_en]}`}>
                    {item.tier_en}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{item.label_en}</p>
                    <p className="text-gray-400 text-sm italic">{item.label_es}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-500/50 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1 text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="bg-[#111113] border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400">No events yet. Create the first one above.</p>
          </div>
        )}
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function EventForm({
  data,
  onChange,
  onTierChange,
  onSave,
  onCancel,
  title,
}: {
  data: Partial<GdeltEvent>
  onChange: (d: Partial<GdeltEvent>) => void
  onTierChange: (t: GdeltAnnotationTier) => void
  onSave: () => void
  onCancel: () => void
  title: string
}) {
  const set = (field: keyof GdeltEvent, value: string) => onChange({ ...data, [field]: value })

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-4">
      <h3 className="text-white font-semibold mb-4">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Date *</label>
          <input
            type="date"
            value={data.date || ''}
            onChange={(e) => set('date', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Tier *</label>
          <select
            value={data.tier_en || 'MEDIUM'}
            onChange={(e) => onTierChange(e.target.value as GdeltAnnotationTier)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
          >
            {TIERS.map(t => (
              <option key={t} value={t}>{t} / {TIER_ES_MAP[t]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Label (English) *</label>
          <input
            type="text"
            value={data.label_en || ''}
            onChange={(e) => set('label_en', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            placeholder="e.g. Emergency decree signed"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Label (Spanish) *</label>
          <input
            type="text"
            value={data.label_es || ''}
            onChange={(e) => set('label_es', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            placeholder="p.ej. Decreto de emergencia firmado"
            required
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSave}
          className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors text-sm"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
