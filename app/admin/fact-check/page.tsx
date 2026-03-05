'use client'

import { useEffect, useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import type { FactCheckTweet } from '@/types'
import { getAllFactCheckTweetsAction, createFactCheckTweetAction, updateFactCheckTweetAction, deleteFactCheckTweetAction } from './actions'
import { Toast } from '@/components/admin/Toast'

type ToastState = { message: string; type: 'success' | 'error' } | null

const KNOWN_ACCOUNTS: { username: string; displayName: string; avatarPath: string }[] = [
  { username: 'cazamosfakenews', displayName: 'Cazamos Fake News', avatarPath: '/images/avatars/cazamosfakenews.jpg' },
  { username: 'cotejoinfo',      displayName: 'Cotejo.info',       avatarPath: '/images/avatars/cotejoinfo.jpg' },
  { username: 'factchequeado',   displayName: 'Factchequeado',     avatarPath: '/images/avatars/factchequeando.png' },
]

const ALERT_TAG_OPTIONS = ['FALSO', 'ENGAÑOSO', 'DESMENTIDO', 'FALSE', 'MISLEADING', 'DEBUNKED']

const emptyForm = {
  username: KNOWN_ACCOUNTS[0].username,
  display_name: KNOWN_ACCOUNTS[0].displayName,
  profile_image_url: KNOWN_ACCOUNTS[0].avatarPath,
  text_es: '',
  text_en: '',
  tweet_url: '',
  alert_tags: [] as string[],
  published_at: new Date().toISOString().slice(0, 16), // datetime-local format
}

export default function FactCheckAdminPage() {
  const [tweets, setTweets] = useState<FactCheckTweet[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ ...emptyForm })
  const [toast, setToast] = useState<ToastState>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data, error } = await getAllFactCheckTweetsAction()
    if (error) setToast({ message: error, type: 'error' })
    else setTweets(data ?? [])
    setLoading(false)
  }

  function handleAccountChange(username: string) {
    const account = KNOWN_ACCOUNTS.find(a => a.username === username)
    setForm(f => ({
      ...f,
      username,
      display_name: account?.displayName ?? username,
      profile_image_url: account?.avatarPath ?? '',
    }))
  }

  function toggleAlertTag(tag: string) {
    setForm(f => ({
      ...f,
      alert_tags: f.alert_tags.includes(tag)
        ? f.alert_tags.filter(t => t !== tag)
        : [...f.alert_tags, tag],
    }))
  }

  async function handleCreate() {
    if (!form.text_es.trim()) {
      setToast({ message: 'Spanish text is required', type: 'error' })
      return
    }
    if (!form.tweet_url.trim()) {
      setToast({ message: 'Tweet URL is required', type: 'error' })
      return
    }

    setSaving(true)
    const result = await createFactCheckTweetAction({
      ...form,
      text_en: form.text_en || null,
      published_at: new Date(form.published_at).toISOString(),
    })
    setSaving(false)

    if (result.error) {
      setToast({ message: result.error, type: 'error' })
    } else {
      setToast({ message: 'Entry added successfully', type: 'success' })
      setShowForm(false)
      setForm({ ...emptyForm })
      await loadData()
    }
  }

  function startEdit(tweet: FactCheckTweet) {
    setEditingId(tweet.id)
    setEditForm({
      username: tweet.username,
      display_name: tweet.display_name,
      profile_image_url: tweet.profile_image_url || '',
      text_es: tweet.text_es,
      text_en: tweet.text_en || '',
      tweet_url: tweet.tweet_url,
      alert_tags: tweet.alert_tags ?? [],
      published_at: new Date(tweet.published_at).toISOString().slice(0, 16),
    })
  }

  function handleEditAccountChange(username: string) {
    const account = KNOWN_ACCOUNTS.find(a => a.username === username)
    setEditForm(f => ({
      ...f,
      username,
      display_name: account?.displayName ?? username,
      profile_image_url: account?.avatarPath ?? f.profile_image_url,
    }))
  }

  function toggleEditAlertTag(tag: string) {
    setEditForm(f => ({
      ...f,
      alert_tags: f.alert_tags.includes(tag)
        ? f.alert_tags.filter(t => t !== tag)
        : [...f.alert_tags, tag],
    }))
  }

  async function handleUpdate(id: string) {
    if (!editForm.text_es.trim()) {
      setToast({ message: 'Spanish text is required', type: 'error' })
      return
    }
    if (!editForm.tweet_url.trim()) {
      setToast({ message: 'Tweet URL is required', type: 'error' })
      return
    }
    setSaving(true)
    const result = await updateFactCheckTweetAction(id, {
      ...editForm,
      text_en: editForm.text_en || null,
      published_at: new Date(editForm.published_at).toISOString(),
    })
    setSaving(false)
    if (result.error) {
      setToast({ message: result.error, type: 'error' })
    } else {
      setToast({ message: 'Entry updated successfully', type: 'success' })
      setEditingId(null)
      await loadData()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this fact-check entry?')) return
    const result = await deleteFactCheckTweetAction(id)
    if (result.error) setToast({ message: result.error, type: 'error' })
    else {
      setToast({ message: 'Entry deleted', type: 'success' })
      await loadData()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Fact-Check Feed</h1>
          <p className="text-gray-400">Manually curate fact-checking entries from @cazamosfakenews, @cotejoinfo, and @factchequeado</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors whitespace-nowrap"
        >
          {showForm ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-[#111113] border border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">New Fact-Check Entry</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Account */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Account *</label>
              <select
                value={form.username}
                onChange={e => handleAccountChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
              >
                {KNOWN_ACCOUNTS.map(a => (
                  <option key={a.username} value={a.username}>@{a.username}</option>
                ))}
              </select>
            </div>

            {/* Published at */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Published at *</label>
              <input
                type="datetime-local"
                value={form.published_at}
                onChange={e => setForm(f => ({ ...f, published_at: e.target.value }))}
                className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
              />
            </div>

            {/* Tweet URL */}
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Tweet URL *</label>
              <input
                type="url"
                value={form.tweet_url}
                onChange={e => setForm(f => ({ ...f, tweet_url: e.target.value }))}
                placeholder="https://x.com/cazamosfakenews/status/..."
                className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
              />
            </div>

            {/* Text ES */}
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Text (Spanish) *</label>
              <textarea
                value={form.text_es}
                onChange={e => setForm(f => ({ ...f, text_es: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm resize-none"
              />
            </div>

            {/* Text EN */}
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Text (English) <span className="text-gray-500">optional</span></label>
              <textarea
                value={form.text_en}
                onChange={e => setForm(f => ({ ...f, text_en: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm resize-none"
              />
            </div>

            {/* Alert tags */}
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Alert Tags</label>
              <div className="flex flex-wrap gap-2">
                {ALERT_TAG_OPTIONS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleAlertTag(tag)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      form.alert_tags.includes(tag)
                        ? 'bg-red-950/50 border-red-500/60 text-red-300'
                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm({ ...emptyForm }) }}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tweets list */}
      <div className="space-y-3">
        {tweets.length === 0 && (
          <div className="bg-[#111113] border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400">No fact-check entries yet. Add one above.</p>
          </div>
        )}

        {tweets.map(tweet => (
          <div key={tweet.id} className="bg-[#111113] border border-gray-800 rounded-lg p-4">
            {editingId === tweet.id ? (
              /* ── Inline edit form ── */
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm">Editing @{tweet.username}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Account *</label>
                    <select
                      value={editForm.username}
                      onChange={e => handleEditAccountChange(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
                    >
                      {KNOWN_ACCOUNTS.map(a => (
                        <option key={a.username} value={a.username}>@{a.username}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Published at *</label>
                    <input
                      type="datetime-local"
                      value={editForm.published_at}
                      onChange={e => setEditForm(f => ({ ...f, published_at: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Tweet URL *</label>
                    <input
                      type="url"
                      value={editForm.tweet_url}
                      onChange={e => setEditForm(f => ({ ...f, tweet_url: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Text (Spanish) *</label>
                    <textarea
                      value={editForm.text_es}
                      onChange={e => setEditForm(f => ({ ...f, text_es: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm resize-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Text (English) <span className="text-gray-500">optional</span></label>
                    <textarea
                      value={editForm.text_en}
                      onChange={e => setEditForm(f => ({ ...f, text_en: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-[#0a0a0b] border border-gray-700 rounded text-white text-sm resize-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-2">Alert Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {ALERT_TAG_OPTIONS.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleEditAlertTag(tag)}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            editForm.alert_tags.includes(tag)
                              ? 'bg-red-950/50 border-red-500/60 text-red-300'
                              : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleUpdate(tweet.id)}
                    disabled={saving}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── Read view ── */
              <div className="flex gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-teal-400 text-sm font-mono">@{tweet.username}</span>
                    <span className="text-gray-600 text-xs">·</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(tweet.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    {tweet.alert_tags?.length > 0 && tweet.alert_tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-red-950/40 border border-red-500/40 text-red-300 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-200 text-sm mb-1 line-clamp-2">{tweet.text_es}</p>
                  {tweet.text_en && (
                    <p className="text-gray-500 text-xs italic line-clamp-1">{tweet.text_en}</p>
                  )}
                  <a
                    href={tweet.tweet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-600 hover:text-teal-400 transition-colors mt-1 inline-block truncate max-w-xs"
                  >
                    {tweet.tweet_url}
                  </a>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(tweet)}
                    className="p-2 text-gray-600 hover:text-blue-400 transition-colors"
                    aria-label="Edit entry"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tweet.id)}
                    className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
