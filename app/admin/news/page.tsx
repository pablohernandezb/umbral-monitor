'use client'

import { useEffect, useState } from 'react'
import { NewsItem } from '@/types'
import {
  getAllNewsItemsAction,
  createNewsItemAction,
  updateNewsItemAction,
  deleteNewsItemAction,
} from './actions'
import { Toast } from '@/components/admin/Toast'

type ToastState = { message: string; type: 'success' | 'error' } | null

const categoryMap: Record<string, NewsItem['category_es']> = {
  political: 'política',
  economic: 'economía',
  social: 'social',
  international: 'internacional',
}

const categoryColors: Record<string, string> = {
  political: 'bg-red-950/30 text-red-400',
  economic: 'bg-blue-950/30 text-blue-400',
  social: 'bg-purple-950/30 text-purple-400',
  international: 'bg-teal-950/30 text-teal-400',
}

export default function NewsAdminPage() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [filteredItems, setFilteredItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Form state
  const [formData, setFormData] = useState<Partial<NewsItem>>({})

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let filtered = items

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.headline_en.toLowerCase().includes(query) ||
          item.headline_es.toLowerCase().includes(query) ||
          item.source.toLowerCase().includes(query) ||
          (item.summary_en && item.summary_en.toLowerCase().includes(query)) ||
          (item.summary_es && item.summary_es.toLowerCase().includes(query))
      )
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((item) => item.category_en === filterCategory)
    }

    setFilteredItems(filtered)
  }, [items, searchQuery, filterCategory])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await getAllNewsItemsAction()
      if (error) {
        setToast({ message: error || 'Failed to load news items', type: 'error' })
      } else if (data) {
        setItems(data)
      }
    } catch (error) {
      setToast({ message: 'Failed to load news items', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const cleanFormData = {
        ...formData,
        category_es: categoryMap[formData.category_en || 'political'] || 'política',
        votes_scenario_1: 0,
        votes_scenario_2: 0,
        votes_scenario_3: 0,
        votes_scenario_4: 0,
        votes_scenario_5: 0,
      }

      const result = await createNewsItemAction(cleanFormData as any)
      if (result.error) {
        setToast({ message: result.error || 'Failed to create news item', type: 'error' })
      } else {
        setToast({ message: 'News item created successfully', type: 'success' })
        setShowCreateForm(false)
        setFormData({})
        await loadData()
      }
    } catch (error) {
      setToast({ message: 'Failed to create news item', type: 'error' })
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      const { id: _id, created_at, ...updateData } = formData as NewsItem

      const cleanUpdateData = {
        ...updateData,
        category_es: categoryMap[updateData.category_en || 'political'] || 'política',
      }

      const result = await updateNewsItemAction(id, cleanUpdateData)
      if (result.error) {
        setToast({ message: result.error || 'Failed to update news item', type: 'error' })
      } else {
        setToast({ message: 'News item updated successfully', type: 'success' })
        setEditingId(null)
        setFormData({})
        await loadData()
      }
    } catch (error) {
      setToast({ message: 'Failed to update news item', type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news item?')) return

    try {
      const result = await deleteNewsItemAction(id)
      if (result.error) {
        setToast({ message: result.error || 'Failed to delete news item', type: 'error' })
      } else {
        setToast({ message: 'News item deleted successfully', type: 'success' })
        await loadData()
      }
    } catch (error) {
      setToast({ message: 'Failed to delete news item', type: 'error' })
    }
  }

  const startEdit = (item: NewsItem) => {
    setEditingId(item.id)
    setFormData(item)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({})
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
        <h1 className="text-3xl font-bold text-white mb-2">News Room Management</h1>
        <p className="text-gray-400">Manage news feed items across all categories</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-[#111113] border border-gray-800 rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by headline, source, or summary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-[#0a0a0b] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full md:w-48 px-4 py-2 bg-[#0a0a0b] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Categories</option>
              <option value="political">Political</option>
              <option value="economic">Economic</option>
              <option value="social">Social</option>
              <option value="international">International</option>
            </select>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            + New Item
          </button>
        </div>

        <div className="text-sm text-gray-400">
          Showing {filteredItems.length} of {items.length} items
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <NewsForm
          data={formData}
          onChange={setFormData}
          onSave={handleCreate}
          onCancel={() => {
            setShowCreateForm(false)
            setFormData({})
          }}
          title="Create New News Item"
        />
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-[#111113] border border-gray-800 rounded-lg p-6">
            {editingId === item.id ? (
              <NewsForm
                data={formData}
                onChange={setFormData}
                onSave={() => handleUpdate(item.id)}
                onCancel={cancelEdit}
                title="Edit News Item"
              />
            ) : (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          categoryColors[item.category_en] || 'bg-gray-950/30 text-gray-400'
                        }`}
                      >
                        {item.category_en}
                      </span>
                      {item.is_breaking && (
                        <span className="px-2 py-1 text-xs rounded bg-red-950/50 text-red-300 border border-red-500/30">
                          BREAKING
                        </span>
                      )}
                      <span className="text-gray-500 text-sm">
                        {new Date(item.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <h3 className="text-white text-lg font-bold mb-1">{item.headline_en}</h3>
                    <h4 className="text-gray-400 text-md font-semibold mb-1">{item.headline_es}</h4>
                    <p className="text-gray-500 text-sm mb-3">
                      {item.source} &middot;{' '}
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-300"
                      >
                        Source
                      </a>
                    </p>
                    {item.summary_en && (
                      <p className="text-gray-300 text-sm mb-2">{item.summary_en}</p>
                    )}
                    {item.summary_es && (
                      <p className="text-gray-400 text-sm mb-3 italic">{item.summary_es}</p>
                    )}
                    {item.external_url && (
                      <a
                        href={item.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-300 text-sm inline-flex items-center gap-1 mb-3"
                      >
                        View Article
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                    {/* Vote counts */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs text-gray-500">Votes:</span>
                      <span className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded">
                        S1: {item.votes_scenario_1}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded">
                        S2: {item.votes_scenario_2}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded">
                        S3: {item.votes_scenario_3}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded">
                        S4: {item.votes_scenario_4}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded">
                        S5: {item.votes_scenario_5}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
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
              </div>
            )}
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="bg-[#111113] border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400">No news items found matching your criteria</p>
          </div>
        )}
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

// News form component
function NewsForm({
  data,
  onChange,
  onSave,
  onCancel,
  title,
}: {
  data: Partial<NewsItem>
  onChange: (data: Partial<NewsItem>) => void
  onSave: () => void
  onCancel: () => void
  title: string
}) {
  const handleChange = (field: keyof NewsItem, value: any) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-6">
      <h3 className="text-white font-semibold mb-4">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Headline (English) *</label>
          <input
            type="text"
            value={data.headline_en || ''}
            onChange={(e) => handleChange('headline_en', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Headline (Spanish) *</label>
          <input
            type="text"
            value={data.headline_es || ''}
            onChange={(e) => handleChange('headline_es', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Summary (English)</label>
          <textarea
            value={data.summary_en || ''}
            onChange={(e) => handleChange('summary_en', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Summary (Spanish)</label>
          <textarea
            value={data.summary_es || ''}
            onChange={(e) => handleChange('summary_es', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Source *</label>
          <input
            type="text"
            value={data.source || ''}
            onChange={(e) => handleChange('source', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            placeholder="e.g. Reuters"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Source URL *</label>
          <input
            type="url"
            value={data.source_url || ''}
            onChange={(e) => handleChange('source_url', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            placeholder="https://..."
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">External URL *</label>
          <input
            type="url"
            value={data.external_url || ''}
            onChange={(e) => handleChange('external_url', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            placeholder="https://..."
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Category *</label>
          <select
            value={data.category_en || 'political'}
            onChange={(e) => handleChange('category_en', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            required
          >
            <option value="political">Political</option>
            <option value="economic">Economic</option>
            <option value="social">Social</option>
            <option value="international">International</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Published At *</label>
          <input
            type="datetime-local"
            value={data.published_at ? data.published_at.slice(0, 16) : ''}
            onChange={(e) => handleChange('published_at', new Date(e.target.value).toISOString())}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.is_breaking || false}
              onChange={(e) => handleChange('is_breaking', e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 bg-[#0a0a0b] text-teal-500 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-300">Breaking News</span>
          </label>
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
