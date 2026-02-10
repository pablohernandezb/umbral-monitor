'use client'

import { useEffect, useState } from 'react'
import { PoliticalPrisoner, PrisonersByOrganization } from '@/types'
import {
  getAllPrisonerStatsAction,
  createPrisonerStatsAction,
  updatePrisonerStatsAction,
  deletePrisonerStatsAction,
  getAllPrisonersByOrgAction,
  createPrisonerByOrgAction,
  updatePrisonerByOrgAction,
  deletePrisonerByOrgAction,
} from './actions'
import { Toast } from '@/components/admin/Toast'

type ToastState = { message: string; type: 'success' | 'error' } | null

export default function PrisonersAdminPage() {
  const [prisoners, setPrisoners] = useState<PoliticalPrisoner[]>([])
  const [orgs, setOrgs] = useState<PrisonersByOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showOrgForm, setShowOrgForm] = useState(false)

  // Form states
  const [formData, setFormData] = useState<Partial<PoliticalPrisoner>>({})
  const [orgFormData, setOrgFormData] = useState<Partial<PrisonersByOrganization>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [prisonersRes, orgsRes] = await Promise.all([
        getAllPrisonerStatsAction(),
        getAllPrisonersByOrgAction(),
      ])

      if (prisonersRes.data) setPrisoners(prisonersRes.data)
      if (orgsRes.data) setOrgs(orgsRes.data)
    } catch (error) {
      setToast({ message: 'Failed to load data', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const result = await createPrisonerStatsAction(formData as any)
      if (result.error) {
        setToast({ message: result.error || 'Failed to create record', type: 'error' })
      } else {
        setToast({ message: 'Record created successfully', type: 'success' })
        setShowCreateForm(false)
        setFormData({})
        await loadData()
      }
    } catch (error) {
      setToast({ message: 'Failed to create record', type: 'error' })
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      // Exclude id, created_at, and updated_at from update data
      const { id: _id, created_at, updated_at, ...updateData } = formData as PoliticalPrisoner
      const result = await updatePrisonerStatsAction(id, updateData)
      if (result.error) {
        setToast({ message: result.error || 'Failed to update record', type: 'error' })
      } else {
        setToast({ message: 'Record updated successfully', type: 'success' })
        setEditingId(null)
        setFormData({})
        await loadData()
      }
    } catch (error) {
      setToast({ message: 'Failed to update record', type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return

    try {
      const result = await deletePrisonerStatsAction(id)
      if (result.error) {
        setToast({ message: result.error || 'Failed to delete record', type: 'error' })
      } else {
        setToast({ message: 'Record deleted successfully', type: 'success' })
        await loadData()
      }
    } catch (error) {
      setToast({ message: 'Failed to delete record', type: 'error' })
    }
  }

  const startEdit = (prisoner: PoliticalPrisoner) => {
    setEditingId(prisoner.id)
    setFormData(prisoner)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({})
  }

  // Organization functions
  const handleCreateOrg = async () => {
    try {
      const result = await createPrisonerByOrgAction(orgFormData as any)
      if (result.error) {
        setToast({ message: result.error || 'Failed to create organization record', type: 'error' })
      } else {
        setToast({ message: 'Organization record created successfully', type: 'success' })
        setShowOrgForm(false)
        setOrgFormData({})
        await loadData()
      }
    } catch (error) {
      setToast({ message: 'Failed to create organization record', type: 'error' })
    }
  }

  const handleUpdateOrg = async (id: string) => {
    try {
      // Exclude id, created_at, and updated_at from update data
      const { id: _id, created_at, updated_at, ...updateData } = orgFormData as PrisonersByOrganization
      const result = await updatePrisonerByOrgAction(id, updateData)
      if (result.error) {
        setToast({ message: result.error || 'Failed to update organization record', type: 'error' })
      } else {
        setToast({ message: 'Organization record updated successfully', type: 'success' })
        setEditingOrgId(null)
        setOrgFormData({})
        await loadData()
      }
    } catch (error) {
      setToast({ message: 'Failed to update organization record', type: 'error' })
    }
  }

  const handleDeleteOrg = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organization record?')) return

    try {
      const result = await deletePrisonerByOrgAction(id)
      if (result.error) {
        setToast({ message: result.error || 'Failed to delete organization record', type: 'error' })
      } else {
        setToast({ message: 'Organization record deleted successfully', type: 'success' })
        await loadData()
      }
    } catch (error) {
      setToast({ message: 'Failed to delete organization record', type: 'error' })
    }
  }

  const startEditOrg = (org: PrisonersByOrganization) => {
    setEditingOrgId(org.id)
    setOrgFormData(org)
  }

  const cancelEditOrg = () => {
    setEditingOrgId(null)
    setOrgFormData({})
  }

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
        <h1 className="text-3xl font-bold text-white mb-2">Political Prisoners Management</h1>
        <p className="text-gray-400">Manage prisoner statistics and organization breakdowns</p>
      </div>

      {/* Main Prisoner Stats Section */}
      <div className="bg-[#111113] border border-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Prisoner Statistics</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
          >
            + New Record
          </button>
        </div>

        {showCreateForm && (
          <PrisonerForm
            data={formData}
            onChange={setFormData}
            onSave={handleCreate}
            onCancel={() => {
              setShowCreateForm(false)
              setFormData({})
            }}
            title="Create New Record"
          />
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Total</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Men</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Women</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Released</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prisoners.map((prisoner) => (
                <tr key={prisoner.id} className="border-b border-gray-800 hover:bg-gray-900/30">
                  {editingId === prisoner.id ? (
                    <td colSpan={6} className="py-4">
                      <PrisonerForm
                        data={formData}
                        onChange={setFormData}
                        onSave={() => handleUpdate(prisoner.id)}
                        onCancel={cancelEdit}
                        title="Edit Record"
                      />
                    </td>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-white font-mono">{prisoner.date}</td>
                      <td className="py-3 px-4 text-right text-teal-400 font-bold">{prisoner.total}</td>
                      <td className="py-3 px-4 text-right text-gray-300">{prisoner.men}</td>
                      <td className="py-3 px-4 text-right text-gray-300">{prisoner.women}</td>
                      <td className="py-3 px-4 text-right text-gray-300">{prisoner.released}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => startEdit(prisoner)}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(prisoner.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Organizations Section */}
      <div className="bg-[#111113] border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">By Organization</h2>
          <button
            onClick={() => setShowOrgForm(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            + New Organization Record
          </button>
        </div>

        {showOrgForm && (
          <OrgForm
            data={orgFormData}
            onChange={setOrgFormData}
            onSave={handleCreateOrg}
            onCancel={() => {
              setShowOrgForm(false)
              setOrgFormData({})
            }}
            title="Create Organization Record"
          />
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Organization</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Count</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id} className="border-b border-gray-800 hover:bg-gray-900/30">
                  {editingOrgId === org.id ? (
                    <td colSpan={4} className="py-4">
                      <OrgForm
                        data={orgFormData}
                        onChange={setOrgFormData}
                        onSave={() => handleUpdateOrg(org.id)}
                        onCancel={cancelEditOrg}
                        title="Edit Organization Record"
                      />
                    </td>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-white font-mono">{org.date}</td>
                      <td className="py-3 px-4 text-gray-300">{org.organization}</td>
                      <td className="py-3 px-4 text-right text-purple-400 font-bold">{org.count}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => startEditOrg(org)}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOrg(org.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

// Prisoner form component
function PrisonerForm({
  data,
  onChange,
  onSave,
  onCancel,
  title,
}: {
  data: Partial<PoliticalPrisoner>
  onChange: (data: Partial<PoliticalPrisoner>) => void
  onSave: () => void
  onCancel: () => void
  title: string
}) {
  const handleChange = (field: keyof PoliticalPrisoner, value: any) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-4">
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Date *</label>
          <input
            type="date"
            value={data.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Total *</label>
          <input
            type="number"
            value={data.total || ''}
            onChange={(e) => handleChange('total', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            required
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Civilians</label>
          <input
            type="number"
            value={data.civilians || ''}
            onChange={(e) => handleChange('civilians', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Military</label>
          <input
            type="number"
            value={data.military || ''}
            onChange={(e) => handleChange('military', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Men</label>
          <input
            type="number"
            value={data.men || ''}
            onChange={(e) => handleChange('men', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Women</label>
          <input
            type="number"
            value={data.women || ''}
            onChange={(e) => handleChange('women', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Adults</label>
          <input
            type="number"
            value={data.adults || ''}
            onChange={(e) => handleChange('adults', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Minors</label>
          <input
            type="number"
            value={data.minors || ''}
            onChange={(e) => handleChange('minors', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Released</label>
          <input
            type="number"
            value={data.released || ''}
            onChange={(e) => handleChange('released', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Foreign</label>
          <input
            type="number"
            value={data.foreign || ''}
            onChange={(e) => handleChange('foreign', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Unknown</label>
          <input
            type="number"
            value={data.unknown || ''}
            onChange={(e) => handleChange('unknown', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            min="0"
          />
        </div>
        <div className="col-span-2 md:col-span-4">
          <label className="block text-sm text-gray-400 mb-1">Source</label>
          <input
            type="text"
            value={data.source || ''}
            onChange={(e) => handleChange('source', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            placeholder="e.g. Foro Penal"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onSave}
          className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// Organization form component
function OrgForm({
  data,
  onChange,
  onSave,
  onCancel,
  title,
}: {
  data: Partial<PrisonersByOrganization>
  onChange: (data: Partial<PrisonersByOrganization>) => void
  onSave: () => void
  onCancel: () => void
  title: string
}) {
  const handleChange = (field: keyof PrisonersByOrganization, value: any) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-4">
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Date *</label>
          <input
            type="date"
            value={data.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Organization *</label>
          <input
            type="text"
            value={data.organization || ''}
            onChange={(e) => handleChange('organization', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Count *</label>
          <input
            type="number"
            value={data.count || ''}
            onChange={(e) => handleChange('count', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            required
            min="0"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onSave}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
