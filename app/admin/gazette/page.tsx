// app/admin/gazette/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────
interface Batch {
  id: string;
  label: string | null;
  source_file: string | null;
  row_count: number;
  is_active: boolean;
  uploaded_at: string;
}

interface GazetteRecord {
  id: number;
  batch_id: string;
  gazette_number: number;
  gazette_type: string;
  gazette_date: string;
  decree_number: string | null;
  change_type: string;
  change_label: string;
  person_name: string | null;
  post_or_position: string | null;
  institution: string | null;
  organism: string | null;
  is_military_person: boolean;
  military_rank: string | null;
  is_military_post: boolean;
  summary: string | null;
}

const CHANGE_LABELS = [
  'Designación', 'Jubilación', 'Traslado', 'Supresión',
  'Reorganización', 'Revocación', 'Ley', 'Autorización', 'Otro',
];

// Derive default label from change_type (mirrors gaceta-utils)
function defaultLabel(changeType: string): string {
  if (/^DESIGNACION_/i.test(changeType) || /^NOMBRAMIENTO_/i.test(changeType) || /^ELECCION_/i.test(changeType)) return 'Designación';
  if (/^JUBILACION$/i.test(changeType)) return 'Jubilación';
  if (/^TRASLADO_/i.test(changeType)) return 'Traslado';
  if (/^SUPRESION_/i.test(changeType)) return 'Supresión';
  if (/^REORGANIZACION_/i.test(changeType) || /^CREACION_/i.test(changeType) || /^FUSION_/i.test(changeType)) return 'Reorganización';
  if (/^REVOCACION$/i.test(changeType)) return 'Revocación';
  if (/^LEY_/i.test(changeType) || /^REFORMA_/i.test(changeType)) return 'Ley';
  if (/^AUTORIZACION_/i.test(changeType)) return 'Autorización';
  return 'Otro';
}

// ── Edit Modal ───────────────────────────────────────────────────
function EditModal({
  record,
  onSave,
  onClose,
}: {
  record: GazetteRecord;
  onSave: (id: number, fields: Partial<GazetteRecord>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<GazetteRecord>({ ...record });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-derive label when change_type changes
  function handleChangeType(val: string) {
    setForm((f) => ({ ...f, change_type: val, change_label: defaultLabel(val) }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(record.id, form);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full bg-[#0a0a0b] border border-white/10 rounded px-2.5 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50';
  const labelCls = 'block text-xs text-zinc-500 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111113] border border-white/10 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <h2 className="font-display text-base font-semibold text-zinc-100">
            Edit record <span className="text-zinc-500 text-sm font-mono">#{record.id}</span>
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Row 1: gazette_number, gazette_type, gazette_date */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Gazette number</label>
              <input type="number" className={inputCls} value={form.gazette_number}
                onChange={(e) => setForm((f) => ({ ...f, gazette_number: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className={labelCls}>Gazette type</label>
              <select className={inputCls} value={form.gazette_type}
                onChange={(e) => setForm((f) => ({ ...f, gazette_type: e.target.value }))}>
                <option>Ordinaria</option>
                <option>Extraordinaria</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" className={inputCls} value={form.gazette_date}
                onChange={(e) => setForm((f) => ({ ...f, gazette_date: e.target.value }))} />
            </div>
          </div>

          {/* Row 2: decree_number, change_type, change_label */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Decree number</label>
              <input type="text" className={inputCls} value={form.decree_number || ''}
                placeholder="optional"
                onChange={(e) => setForm((f) => ({ ...f, decree_number: e.target.value || null }))} />
            </div>
            <div>
              <label className={labelCls}>Change type (raw)</label>
              <input type="text" className={inputCls} value={form.change_type}
                onChange={(e) => handleChangeType(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Change label</label>
              <select className={inputCls} value={form.change_label}
                onChange={(e) => setForm((f) => ({ ...f, change_label: e.target.value }))}>
                {CHANGE_LABELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: person_name, post_or_position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Person name</label>
              <input type="text" className={inputCls} value={form.person_name || ''}
                placeholder="optional"
                onChange={(e) => setForm((f) => ({ ...f, person_name: e.target.value || null }))} />
            </div>
            <div>
              <label className={labelCls}>Post / position</label>
              <input type="text" className={inputCls} value={form.post_or_position || ''}
                placeholder="optional"
                onChange={(e) => setForm((f) => ({ ...f, post_or_position: e.target.value || null }))} />
            </div>
          </div>

          {/* Row 4: institution, organism */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Institution</label>
              <input type="text" className={inputCls} value={form.institution || ''}
                placeholder="optional"
                onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value || null }))} />
            </div>
            <div>
              <label className={labelCls}>Organism</label>
              <input type="text" className={inputCls} value={form.organism || ''}
                placeholder="optional"
                onChange={(e) => setForm((f) => ({ ...f, organism: e.target.value || null }))} />
            </div>
          </div>

          {/* Row 5: military fields */}
          <div className="rounded-lg border border-white/5 bg-[#0a0a0b] p-3 space-y-3">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Military</p>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input type="checkbox" className="accent-amber-400" checked={form.is_military_person}
                  onChange={(e) => setForm((f) => ({ ...f, is_military_person: e.target.checked }))} />
                Military person
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input type="checkbox" className="accent-amber-400" checked={form.is_military_post}
                  onChange={(e) => setForm((f) => ({ ...f, is_military_post: e.target.checked }))} />
                Military post
              </label>
            </div>
            {form.is_military_person && (
              <div>
                <label className={labelCls}>Military rank</label>
                <input type="text" className={inputCls} value={form.military_rank || ''}
                  placeholder="e.g. General de División"
                  onChange={(e) => setForm((f) => ({ ...f, military_rank: e.target.value || null }))} />
              </div>
            )}
          </div>

          {/* Row 6: summary */}
          <div>
            <label className={labelCls}>Summary</label>
            <textarea
              className={`${inputCls} resize-y min-h-[80px]`}
              value={form.summary || ''}
              placeholder="optional"
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value || null }))}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-white/5 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-teal-500 text-black font-medium text-sm rounded-md disabled:opacity-40 hover:bg-teal-400 transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function AdminGazettePage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [records, setRecords] = useState<GazetteRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [activeBrowseBatchId, setActiveBrowseBatchId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [gazetteToDelete, setGazetteToDelete] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [recordSearch, setRecordSearch] = useState('');
  const [recordPage, setRecordPage] = useState(1);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GazetteRecord | null>(null);
  const RECORD_PAGE_SIZE = 50;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordsRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadBatches(); }, []);

  // Reload records when page/search/batch changes
  useEffect(() => {
    if (activeBrowseBatchId) {
      fetchRecords(activeBrowseBatchId, recordPage, recordSearch);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBrowseBatchId, recordPage, recordSearch]);

  async function loadBatches() {
    try {
      const res = await fetch('/api/gazette/batches');
      const data = await res.json();
      setBatches(data.batches || []);
    } catch { /* ignore */ }
  }

  const fetchRecords = useCallback(async (batchId: string, page: number, search: string) => {
    setLoadingRecords(true);
    try {
      const params = new URLSearchParams({
        batchId,
        page: String(page),
        limit: String(RECORD_PAGE_SIZE),
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/gazette/records?${params}`);
      const data = await res.json();
      setRecords(data.records || []);
      setTotalRecords(data.total || 0);
    } catch { /* ignore */ } finally {
      setLoadingRecords(false);
    }
  }, []);

  function browseRecords(batchId: string) {
    setActiveBrowseBatchId(batchId);
    setRecordPage(1);
    setRecordSearch('');
    setTimeout(() => recordsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (label) formData.append('label', label);
      const res = await fetch('/api/gazette/upload', { method: 'POST', body: formData });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: `Uploaded ${result.rows_inserted} records successfully` });
        setFile(null); setLabel(''); setPreview(null);
        loadBatches();
      } else {
        setMessage({ type: 'error', text: result.error || 'Upload failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setUploading(false);
    }
  }

  async function toggleBatch(batchId: string, isActive: boolean) {
    await fetch('/api/gazette/batches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId, is_active: isActive }),
    });
    loadBatches();
  }

  async function deleteBatch(batchId: string) {
    if (!confirm('Delete this batch and all its records?')) return;
    await fetch('/api/gazette/batches', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId }),
    });
    if (activeBrowseBatchId === batchId) { setActiveBrowseBatchId(null); setRecords([]); }
    loadBatches();
  }

  async function handleDeleteGazette() {
    const activeBatch = batches.find((b) => b.is_active);
    if (!activeBatch) return;
    const num = parseInt(gazetteToDelete);
    if (!num) return;
    await fetch('/api/gazette/batches', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gazetteNumber: num, batchId: activeBatch.id }),
    });
    setGazetteToDelete(''); setDeleteConfirm('');
    setMessage({ type: 'success', text: `Records for gazette #${num} deleted` });
    if (activeBrowseBatchId === activeBatch.id) fetchRecords(activeBatch.id, recordPage, recordSearch);
  }

  async function deleteRecord(recordId: number) {
    if (!confirm('Delete this record?')) return;
    await fetch('/api/gazette/batches', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId }),
    });
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    setTotalRecords((t) => t - 1);
  }

  async function saveRecord(id: number, fields: Partial<GazetteRecord>) {
    const res = await fetch('/api/gazette/records', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId: id, fields }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Save failed');
    // Update local state
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, ...fields } : r));
  }

  function handleFileSelect(f: File) {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string).replace(/^\uFEFF/, '');
      const lines = text.split('\n').slice(0, 11);
      setPreview(lines.map((l) => l.split(',')));
    };
    reader.readAsText(f);
  }

  const totalPages = Math.max(1, Math.ceil(totalRecords / RECORD_PAGE_SIZE));

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <h1 className="font-display text-2xl font-semibold text-zinc-100">
        Gaceta Oficial management
      </h1>

      {/* ── Upload ── */}
      <section className="rounded-lg border border-white/5 bg-[#111113] p-6 space-y-4">
        <h2 className="font-display text-lg text-teal-400">Upload new CSV</h2>
        <p className="text-sm text-zinc-500">
          Required headers: gazette_number, gazette_type, gazette_date, decree_number, change_type,
          person_name, post_or_position, institution, organism, is_military_person, military_rank,
          is_military_post, summary
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Batch label (e.g. 'Enero–Marzo 2026')" value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 bg-[#0a0a0b] border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50" />
          <label
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm cursor-pointer transition-colors border ${
              dragActive ? 'border-teal-500/50 bg-teal-500/5 text-teal-400' : 'border-white/10 bg-[#0a0a0b] text-zinc-400 hover:border-teal-500/30'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files?.[0]; if (f?.name.endsWith('.csv')) handleFileSelect(f); }}
          >
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
            {file ? file.name : 'Choose or drop CSV…'}
          </label>
          <button onClick={handleUpload} disabled={!file || uploading}
            className="px-6 py-2 bg-teal-500 text-black font-medium text-sm rounded-md disabled:opacity-40 hover:bg-teal-400 transition-colors">
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
        {message && (
          <div className={`text-sm px-3 py-2 rounded ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {message.text}
          </div>
        )}
        {preview && (
          <div className="overflow-x-auto">
            <p className="text-xs text-zinc-500 mb-2">Preview (first 10 rows):</p>
            <table className="w-full text-xs text-zinc-400">
              <thead><tr>{preview[0]?.map((h, i) => <th key={i} className="text-left px-2 py-1 border-b border-white/5 text-teal-400 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{preview.slice(1).map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci} className="px-2 py-1 border-b border-white/5 truncate max-w-[120px]">{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Batch history ── */}
      <section className="rounded-lg border border-white/5 bg-[#111113] p-6">
        <h2 className="font-display text-lg text-teal-400 mb-4">Batch history</h2>
        {batches.length === 0 ? (
          <p className="text-zinc-500 text-sm">No batches uploaded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 text-xs uppercase tracking-wide">
                <th className="pb-2">Label</th>
                <th className="pb-2">File</th>
                <th className="pb-2">Rows</th>
                <th className="pb-2">Uploaded</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className={`border-t border-white/5 ${activeBrowseBatchId === b.id ? 'bg-teal-500/5' : ''}`}>
                  <td className="py-2 text-zinc-200">{b.label || '(unlabeled)'}</td>
                  <td className="py-2 text-zinc-400 font-mono text-xs">{b.source_file}</td>
                  <td className="py-2 text-zinc-300">{b.row_count}</td>
                  <td className="py-2 text-zinc-400 text-xs">{new Date(b.uploaded_at).toLocaleDateString()}</td>
                  <td className="py-2">
                    {b.is_active
                      ? <span className="text-xs px-2 py-0.5 rounded bg-teal-500/10 text-teal-400">Active</span>
                      : <span className="text-xs px-2 py-0.5 rounded bg-zinc-700/50 text-zinc-500">Inactive</span>}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-3">
                      <button onClick={() => browseRecords(b.id)}
                        className={`text-xs font-medium transition-colors ${activeBrowseBatchId === b.id ? 'text-teal-300' : 'text-teal-500 hover:text-teal-300'}`}>
                        {activeBrowseBatchId === b.id ? 'Browsing ↓' : 'Browse'}
                      </button>
                      {!b.is_active && (
                        <button onClick={() => toggleBatch(b.id, true)} className="text-xs text-zinc-400 hover:text-teal-300">Activate</button>
                      )}
                      {b.is_active && (
                        <button onClick={() => toggleBatch(b.id, false)} className="text-xs text-amber-400 hover:text-amber-300">Deactivate</button>
                      )}
                      <button onClick={() => deleteBatch(b.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Delete by gazette number ── */}
      <section className="rounded-lg border border-white/5 bg-[#111113] p-6 space-y-4">
        <h2 className="font-display text-lg text-teal-400">Delete gazette records</h2>
        <p className="text-sm text-zinc-500">Delete all records for a specific gazette number from the active batch.</p>
        <div className="flex gap-3 flex-wrap">
          <input type="text" placeholder="Gazette number (e.g. 43287)" value={gazetteToDelete}
            onChange={(e) => { setGazetteToDelete(e.target.value); setDeleteConfirm(''); }}
            className="bg-[#0a0a0b] border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 w-52" />
          {gazetteToDelete && (
            <input type="text" placeholder={`Type "ELIMINAR ${gazetteToDelete}" to confirm`}
              value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
              className="flex-1 min-w-[240px] bg-[#0a0a0b] border border-red-500/30 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-500/60" />
          )}
          <button onClick={handleDeleteGazette}
            disabled={deleteConfirm !== `ELIMINAR ${gazetteToDelete}` || !gazetteToDelete}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md disabled:opacity-30 hover:bg-red-500 transition-colors">
            Delete gazette
          </button>
        </div>
      </section>

      {/* ── Records table ── */}
      {activeBrowseBatchId && (
        <section ref={recordsRef} className="rounded-lg border border-white/5 bg-[#111113] p-6 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-display text-lg text-teal-400 flex-1">
              Records
              <span className="text-zinc-500 text-sm font-normal ml-2">({totalRecords} total)</span>
            </h2>
            <input type="text" placeholder="Search person, organism, type…"
              value={recordSearch}
              onChange={(e) => { setRecordSearch(e.target.value); setRecordPage(1); }}
              className="text-sm bg-[#0a0a0b] border border-white/10 rounded-md px-3 py-1.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 w-56" />
          </div>

          {loadingRecords ? (
            <p className="text-zinc-500 text-sm py-8 text-center">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500 text-xs uppercase tracking-wide border-b border-white/5">
                    <th className="pb-2 pr-3">ID</th>
                    <th className="pb-2 pr-3">Gaceta</th>
                    <th className="pb-2 pr-3">Fecha</th>
                    <th className="pb-2 pr-3">Tipo</th>
                    <th className="pb-2 pr-3">Persona</th>
                    <th className="pb-2 pr-3">Organismo</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-zinc-500 text-sm">No records found.</td></tr>
                  ) : records.map((r) => (
                    <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="py-2 pr-3 text-zinc-500 text-xs">{r.id}</td>
                      <td className="py-2 pr-3 text-zinc-300 font-mono text-xs">#{r.gazette_number}</td>
                      <td className="py-2 pr-3 text-zinc-400 text-xs whitespace-nowrap">{r.gazette_date}</td>
                      <td className="py-2 pr-3">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">{r.change_label}</span>
                      </td>
                      <td className="py-2 pr-3 max-w-[160px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-200 truncate">{r.person_name || '—'}</span>
                          {r.is_military_person && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-400/20 text-amber-400 flex-shrink-0">MIL</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-zinc-400 text-xs max-w-[200px] truncate">{r.organism || '—'}</td>
                      <td className="py-2">
                        <div className="flex gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingRecord(r)}
                            className="text-xs text-teal-400 hover:text-teal-300 font-medium">
                            Edit
                          </button>
                          <button onClick={() => deleteRecord(r.id)}
                            className="text-xs text-red-400 hover:text-red-300">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <span>
              {totalRecords > 0
                ? `Showing ${((recordPage - 1) * RECORD_PAGE_SIZE) + 1}–${Math.min(recordPage * RECORD_PAGE_SIZE, totalRecords)} of ${totalRecords}`
                : '0 records'}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setRecordPage((p) => Math.max(1, p - 1))} disabled={recordPage === 1}
                className="px-2 py-1 rounded border border-white/10 disabled:opacity-30 hover:border-white/20 transition-colors">←</button>
              <span>Page {recordPage} of {totalPages}</span>
              <button onClick={() => setRecordPage((p) => Math.min(totalPages, p + 1))} disabled={recordPage === totalPages}
                className="px-2 py-1 rounded border border-white/10 disabled:opacity-30 hover:border-white/20 transition-colors">→</button>
            </div>
          </div>
        </section>
      )}

      {/* ── Edit Modal ── */}
      {editingRecord && (
        <EditModal
          record={editingRecord}
          onSave={saveRecord}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  );
}
