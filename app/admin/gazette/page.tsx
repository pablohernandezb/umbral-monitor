// app/admin/gazette/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface Batch {
  id: string;
  label: string | null;
  source_file: string | null;
  row_count: number;
  is_active: boolean;
  uploaded_at: string;
}

interface Record {
  id: number;
  gazette_number: number;
  gazette_date: string;
  change_type: string;
  change_label: string;
  person_name: string | null;
  organism: string | null;
}

export default function AdminGazettePage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
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
  const RECORD_PAGE_SIZE = 50;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadBatches(); }, []);

  async function loadBatches() {
    try {
      const res = await fetch('/api/gazette/batches');
      const data = await res.json();
      setBatches(data.batches || []);
    } catch { /* ignore */ }
  }

  async function loadRecords(batchId: string) {
    // Load records for a specific batch via admin preview
    // In production this would fetch from an admin endpoint
    setRecords([]);
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
        setFile(null);
        setLabel('');
        setPreview(null);
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

    setGazetteToDelete('');
    setDeleteConfirm('');
    setMessage({ type: 'success', text: `Records for gazette #${num} deleted` });
  }

  async function deleteRecord(recordId: number) {
    await fetch('/api/gazette/batches', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId }),
    });
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
  }

  function handleFileSelect(f: File) {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string).replace(/^\uFEFF/, '');
      const lines = text.split('\n').slice(0, 11);
      // Simple preview split — just for display, doesn't need full RFC 4180
      setPreview(lines.map((l) => l.split(',')));
    };
    reader.readAsText(f);
  }

  const filteredRecords = records.filter((r) => {
    const q = recordSearch.toLowerCase();
    return (
      !q ||
      (r.person_name || '').toLowerCase().includes(q) ||
      (r.organism || '').toLowerCase().includes(q) ||
      r.change_type.toLowerCase().includes(q) ||
      String(r.gazette_number).includes(q)
    );
  });

  const totalRecordPages = Math.max(1, Math.ceil(filteredRecords.length / RECORD_PAGE_SIZE));
  const pageRecords = filteredRecords.slice((recordPage - 1) * RECORD_PAGE_SIZE, recordPage * RECORD_PAGE_SIZE);

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <h1 className="font-display text-2xl font-semibold text-zinc-100">
        Gaceta Oficial management
      </h1>

      {/* Upload section */}
      <section className="rounded-lg border border-white/5 bg-[#111113] p-6 space-y-4">
        <h2 className="font-display text-lg text-teal-400">Upload new CSV</h2>
        <p className="text-sm text-zinc-500">
          Required headers: gazette_number, gazette_type, gazette_date, decree_number, change_type,
          person_name, post_or_position, institution, organism, is_military_person, military_rank,
          is_military_post, summary
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Batch label (e.g. 'Enero–Marzo 2026')"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 bg-[#0a0a0b] border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50"
          />
          <label
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm cursor-pointer transition-colors border ${
              dragActive
                ? 'border-teal-500/50 bg-teal-500/5 text-teal-400'
                : 'border-white/10 bg-[#0a0a0b] text-zinc-400 hover:border-teal-500/30'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const f = e.dataTransfer.files?.[0];
              if (f?.name.endsWith('.csv')) handleFileSelect(f);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
            {file ? file.name : 'Choose or drop CSV…'}
          </label>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-6 py-2 bg-teal-500 text-black font-medium text-sm rounded-md disabled:opacity-40 hover:bg-teal-400 transition-colors"
          >
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
              <thead>
                <tr>
                  {preview[0]?.map((h, i) => (
                    <th key={i} className="text-left px-2 py-1 border-b border-white/5 text-teal-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1 border-b border-white/5 truncate max-w-[120px]">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Batch history */}
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
                <tr key={b.id} className="border-t border-white/5">
                  <td className="py-2 text-zinc-200">{b.label || '(unlabeled)'}</td>
                  <td className="py-2 text-zinc-400 font-mono text-xs">{b.source_file}</td>
                  <td className="py-2 text-zinc-300">{b.row_count}</td>
                  <td className="py-2 text-zinc-400 text-xs">{new Date(b.uploaded_at).toLocaleDateString()}</td>
                  <td className="py-2">
                    {b.is_active ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-teal-500/10 text-teal-400">Active</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-700/50 text-zinc-500">Inactive</span>
                    )}
                  </td>
                  <td className="py-2 flex gap-2">
                    {!b.is_active && (
                      <button onClick={() => toggleBatch(b.id, true)} className="text-xs text-teal-400 hover:text-teal-300">
                        Activate
                      </button>
                    )}
                    {b.is_active && (
                      <button onClick={() => toggleBatch(b.id, false)} className="text-xs text-amber-400 hover:text-amber-300">
                        Deactivate
                      </button>
                    )}
                    <button onClick={() => deleteBatch(b.id)} className="text-xs text-red-400 hover:text-red-300">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Delete by gazette number */}
      <section className="rounded-lg border border-white/5 bg-[#111113] p-6 space-y-4">
        <h2 className="font-display text-lg text-teal-400">Delete gazette records</h2>
        <p className="text-sm text-zinc-500">
          Delete all records for a specific gazette number from the active batch.
        </p>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Gazette number (e.g. 43287)"
            value={gazetteToDelete}
            onChange={(e) => { setGazetteToDelete(e.target.value); setDeleteConfirm(''); }}
            className="bg-[#0a0a0b] border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 w-52"
          />
          {gazetteToDelete && (
            <input
              type="text"
              placeholder={`Type "ELIMINAR ${gazetteToDelete}" to confirm`}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="flex-1 min-w-[240px] bg-[#0a0a0b] border border-red-500/30 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-500/60"
            />
          )}
          <button
            onClick={handleDeleteGazette}
            disabled={deleteConfirm !== `ELIMINAR ${gazetteToDelete}` || !gazetteToDelete}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md disabled:opacity-30 hover:bg-red-500 transition-colors"
          >
            Delete gazette
          </button>
        </div>
      </section>

      {/* Records table */}
      {records.length > 0 && (
        <section className="rounded-lg border border-white/5 bg-[#111113] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg text-teal-400 flex-1">Records</h2>
            <input
              type="text"
              placeholder="Search…"
              value={recordSearch}
              onChange={(e) => { setRecordSearch(e.target.value); setRecordPage(1); }}
              className="text-sm bg-[#0a0a0b] border border-white/10 rounded-md px-3 py-1.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 w-48"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 text-xs uppercase tracking-wide border-b border-white/5">
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Gaceta</th>
                  <th className="pb-2">Fecha</th>
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2">Persona</th>
                  <th className="pb-2">Organismo</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {pageRecords.map((r) => (
                  <tr key={r.id} className="border-t border-white/5">
                    <td className="py-2 text-zinc-500 text-xs">{r.id}</td>
                    <td className="py-2 text-zinc-300">#{r.gazette_number}</td>
                    <td className="py-2 text-zinc-400 text-xs">{r.gazette_date}</td>
                    <td className="py-2 text-zinc-400 text-xs">{r.change_label}</td>
                    <td className="py-2 text-zinc-200 max-w-[140px] truncate">{r.person_name || '—'}</td>
                    <td className="py-2 text-zinc-400 max-w-[180px] truncate">{r.organism || '—'}</td>
                    <td className="py-2">
                      <button onClick={() => deleteRecord(r.id)} className="text-xs text-red-400 hover:text-red-300">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{filteredRecords.length} records</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRecordPage((p) => Math.max(1, p - 1))}
                disabled={recordPage === 1}
                className="px-2 py-1 rounded border border-white/10 disabled:opacity-30"
              >
                ←
              </button>
              <span>Page {recordPage} of {totalRecordPages}</span>
              <button
                onClick={() => setRecordPage((p) => Math.min(totalRecordPages, p + 1))}
                disabled={recordPage === totalRecordPages}
                className="px-2 py-1 rounded border border-white/10 disabled:opacity-30"
              >
                →
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
