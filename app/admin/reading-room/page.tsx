'use client'

import { useEffect, useState } from 'react'
import { ReadingRoomItem } from '@/types'
import {
  getAllReadingRoomItemsAction,
  createReadingRoomItemAction,
  updateReadingRoomItemAction,
  deleteReadingRoomItemAction,
} from './actions'
import { Toast } from '@/components/admin/Toast'

type ToastState = { message: string; type: 'success' | 'error' } | null

export default function ReadingRoomAdminPage() {
  const [items, setItems] = useState<ReadingRoomItem[]>([])
  const [filteredItems, setFilteredItems] = useState<ReadingRoomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  // Form state
  const [formData, setFormData] = useState<Partial<ReadingRoomItem>>({
    tags_en: [],
    tags_es: [],
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Filter items based on search and type
    let filtered = items

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.title_en.toLowerCase().includes(query) ||
          (item.title_es && item.title_es.toLowerCase().includes(query)) ||
          item.author.toLowerCase().includes(query) ||
          item.description_en.toLowerCase().includes(query) ||
          (item.description_es && item.description_es.toLowerCase().includes(query))
      )
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((item) => item.type === filterType)
    }

    setFilteredItems(filtered)
  }, [items, searchQuery, filterType])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await getAllReadingRoomItemsAction()
      if (error) {
        setToast({ message: error || 'Failed to load items', type: 'error' })
      } else if (data) {
        setItems(data)
      }
    } catch (error) {
      setToast({ message: 'Failed to load items', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      // Ensure arrays are properly initialized
      const cleanFormData = {
        ...formData,
        tags_en: formData.tags_en || [],
        tags_es: formData.tags_es || null,
      }

      const result = await createReadingRoomItemAction(cleanFormData as any)
      if (result.error) {
        setToast({ message: result.error || 'Failed to create item', type: 'error' })
      } else {
        setToast({ message: 'Item created successfully', type: 'success' })
        setShowCreateForm(false)
        setFormData({ tags_en: [], tags_es: [] })
        await loadData()
      }
    } catch (error) {
      setToast({ message: 'Failed to create item', type: 'error' })
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      // Exclude id and created_at from update data
      const { id: _id, created_at, ...updateData } = formData as ReadingRoomItem

      // Ensure arrays are properly initialized
      const cleanUpdateData = {
        ...updateData,
        tags_en: updateData.tags_en || [],
        tags_es: updateData.tags_es || null,
      }

      const result = await updateReadingRoomItemAction(id, cleanUpdateData)
      if (result.error) {
        setToast({ message: result.error || 'Failed to update item', type: 'error' })
      } else {
        setToast({ message: 'Item updated successfully', type: 'success' })
        setEditingId(null)
        setFormData({ tags_en: [], tags_es: [] })
        await loadData()
      }
    } catch (error) {
      setToast({ message: 'Failed to update item', type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const result = await deleteReadingRoomItemAction(id)
      if (result.error) {
        setToast({ message: result.error || 'Failed to delete item', type: 'error' })
      } else {
        setToast({ message: 'Item deleted successfully', type: 'success' })
        await loadData()
      }
    } catch (error) {
      setToast({ message: 'Failed to delete item', type: 'error' })
    }
  }

  const startEdit = (item: ReadingRoomItem) => {
    setEditingId(item.id)
    setFormData(item)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ tags: [] })
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
        <h1 className="text-3xl font-bold text-white mb-2">Reading Room Management</h1>
        <p className="text-gray-400">Manage books, articles, reports, and journalism resources</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-[#111113] border border-gray-800 rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by title, author, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-[#0a0a0b] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full md:w-48 px-4 py-2 bg-[#0a0a0b] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Types</option>
              <option value="book">Books</option>
              <option value="article">Articles</option>
              <option value="report">Reports</option>
              <option value="journalism">Journalism</option>
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
        <ReadingRoomForm
          data={formData}
          onChange={setFormData}
          onSave={handleCreate}
          onCancel={() => {
            setShowCreateForm(false)
            setFormData({ tags_en: [], tags_es: [] })
          }}
          title="Create New Item"
        />
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-[#111113] border border-gray-800 rounded-lg p-6">
            {editingId === item.id ? (
              <ReadingRoomForm
                data={formData}
                onChange={setFormData}
                onSave={() => handleUpdate(item.id)}
                onCancel={cancelEdit}
                title="Edit Item"
              />
            ) : (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          item.type === 'book'
                            ? 'bg-blue-950/30 text-blue-400'
                            : item.type === 'article'
                            ? 'bg-purple-950/30 text-purple-400'
                            : item.type === 'report'
                            ? 'bg-teal-950/30 text-teal-400'
                            : 'bg-amber-950/30 text-amber-400'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="text-gray-500 text-sm">{item.year}</span>
                      <span className="text-gray-500 text-sm uppercase">{item.language}</span>
                    </div>
                    <h3 className="text-white text-lg font-bold mb-1">{item.title_en}</h3>
                    {item.title_es && <h4 className="text-gray-400 text-md font-semibold mb-1">{item.title_es}</h4>}
                    <p className="text-gray-400 text-sm mb-3">{item.author}</p>
                    <p className="text-gray-300 text-sm mb-3">{item.description_en}</p>
                    {item.description_es && <p className="text-gray-400 text-sm mb-3 italic">{item.description_es}</p>}
                    {item.external_url && (
                      <a
                        href={item.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-300 text-sm inline-flex items-center gap-1"
                      >
                        View Resource
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
                    {item.tags_en && item.tags_en.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs text-gray-500 mr-2">EN:</span>
                        {item.tags_en.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.tags_es && item.tags_es.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs text-gray-500 mr-2">ES:</span>
                        {item.tags_es.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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
            <p className="text-gray-400">No items found matching your criteria</p>
          </div>
        )}
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

// Reading Room form component
function ReadingRoomForm({
  data,
  onChange,
  onSave,
  onCancel,
  title,
}: {
  data: Partial<ReadingRoomItem>
  onChange: (data: Partial<ReadingRoomItem>) => void
  onSave: () => void
  onCancel: () => void
  title: string
}) {
  const [tagInputEn, setTagInputEn] = useState('')
  const [tagInputEs, setTagInputEs] = useState('')

  const handleChange = (field: keyof ReadingRoomItem, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const addTagEn = () => {
    if (tagInputEn.trim()) {
      const tags = data.tags_en || []
      onChange({ ...data, tags_en: [...tags, tagInputEn.trim()] })
      setTagInputEn('')
    }
  }

  const removeTagEn = (index: number) => {
    const tags = data.tags_en || []
    onChange({ ...data, tags_en: tags.filter((_, i) => i !== index) })
  }

  const addTagEs = () => {
    if (tagInputEs.trim()) {
      const tags = data.tags_es || []
      onChange({ ...data, tags_es: [...tags, tagInputEs.trim()] })
      setTagInputEs('')
    }
  }

  const removeTagEs = (index: number) => {
    const tags = data.tags_es || []
    onChange({ ...data, tags_es: tags.filter((_, i) => i !== index) })
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-6">
      <h3 className="text-white font-semibold mb-4">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Title (English) *</label>
          <input
            type="text"
            value={data.title_en || ''}
            onChange={(e) => handleChange('title_en', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Title (Spanish)</label>
          <input
            type="text"
            value={data.title_es || ''}
            onChange={(e) => handleChange('title_es', e.target.value || null)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Author *</label>
          <input
            type="text"
            value={data.author || ''}
            onChange={(e) => handleChange('author', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Year *</label>
          <input
            type="number"
            value={data.year || ''}
            onChange={(e) => handleChange('year', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            required
            min="1900"
            max="2030"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Type *</label>
          <select
            value={data.type || 'book'}
            onChange={(e) => handleChange('type', e.target.value as any)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            required
          >
            <option value="book">Book</option>
            <option value="article">Article</option>
            <option value="report">Report</option>
            <option value="journalism">Journalism</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Language *</label>
          <select
            value={data.language || 'es'}
            onChange={(e) => handleChange('language', e.target.value as any)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            required
          >
            <option value="es">Spanish</option>
            <option value="en">English</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Description (English) *</label>
          <textarea
            value={data.description_en || ''}
            onChange={(e) => handleChange('description_en', e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            rows={3}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Description (Spanish)</label>
          <textarea
            value={data.description_es || ''}
            onChange={(e) => handleChange('description_es', e.target.value || null)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">URL (optional)</label>
          <input
            type="url"
            value={data.external_url || ''}
            onChange={(e) => handleChange('external_url', e.target.value || null)}
            className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
            placeholder="https://..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Tags (English)</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInputEn}
              onChange={(e) => setTagInputEn(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTagEn()
                }
              }}
              className="flex-1 px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
              placeholder="Add an English tag..."
            />
            <button
              type="button"
              onClick={addTagEn}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
            >
              Add
            </button>
          </div>
          {data.tags_en && data.tags_en.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {data.tags_en.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTagEn(i)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Tags (Spanish)</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInputEs}
              onChange={(e) => setTagInputEs(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTagEs()
                }
              }}
              className="flex-1 px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
              placeholder="Add a Spanish tag..."
            />
            <button
              type="button"
              onClick={addTagEs}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
            >
              Add
            </button>
          </div>
          {data.tags_es && data.tags_es.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.tags_es.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTagEs(i)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
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
