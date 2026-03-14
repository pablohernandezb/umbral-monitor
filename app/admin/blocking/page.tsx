// app/admin/blocking/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface Batch {
  id: string;
  label: string | null;
  source_file: string | null;
  row_count: number;
  is_active: boolean;
  uploaded_at: string;
}

export default function AdminBlockingPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [preview, setPreview] = useState<string[][] | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  async function loadBatches() {
    try {
      const res = await fetch('/api/admin/blocking/batches');
      const data = await res.json();
      setBatches(data.batches || []);
    } catch {
      /* ignore */
    }
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (label) formData.append('label', label);

      const res = await fetch('/api/blocking/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Uploaded ${result.rows_inserted} domains successfully`,
        });
        setFile(null);
        setLabel('');
        loadBatches();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Upload failed',
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setUploading(false);
    }
  }

  async function toggleBatch(batchId: string, activate: boolean) {
    await fetch('/api/admin/blocking/batches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId, is_active: activate }),
    });
    loadBatches();
  }

  async function deleteBatch(batchId: string) {
    if (!confirm('Delete this batch and all its rows?')) return;
    await fetch('/api/admin/blocking/batches', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId }),
    });
    loadBatches();
  }

  function handleFilePreview(f: File) {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n').slice(0, 11); // header + 10 rows
      setPreview(lines.map((l) => l.split(',')));
    };
    reader.readAsText(f);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <h1 className="font-display text-2xl font-semibold text-zinc-100">
        Domain blocking management
      </h1>

      {/* Upload section */}
      <section className="rounded-lg border border-white/5 bg-[#111113] p-6 space-y-4">
        <h2 className="font-display text-lg text-teal-400">
          Upload new CSV
        </h2>
        <p className="text-sm text-zinc-500">
          CSV must have headers: site, domain, category, CANTV, Movistar,
          Digitel, Inter, Netuno, Airtek, G-Network
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Batch label (optional, e.g. 'March 2026')"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 bg-[#0a0a0b] border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50"
          />
          <label className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0b] border border-white/10 rounded-md text-sm text-zinc-400 cursor-pointer hover:border-teal-500/30 transition-colors">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFilePreview(f);
              }}
            />
            {file ? file.name : 'Choose CSV file...'}
          </label>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-6 py-2 bg-teal-500 text-black font-medium text-sm rounded-md disabled:opacity-40 hover:bg-teal-400 transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {message && (
          <div
            className={`text-sm px-3 py-2 rounded ${
              message.type === 'success'
                ? 'bg-green-500/10 text-green-400'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* CSV preview */}
        {preview && (
          <div className="overflow-x-auto">
            <p className="text-xs text-zinc-500 mb-2">
              Preview (first 10 rows):
            </p>
            <table className="w-full text-xs text-zinc-400">
              <thead>
                <tr>
                  {preview[0]?.map((h, i) => (
                    <th
                      key={i}
                      className="text-left px-2 py-1 border-b border-white/5 text-teal-400 font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`px-2 py-1 border-b border-white/5 ${
                          cell === 'ok' ? 'text-green-500' : ''
                        }`}
                      >
                        {cell}
                      </td>
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
        <h2 className="font-display text-lg text-teal-400 mb-4">
          Batch history
        </h2>
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
                  <td className="py-2 text-zinc-200">
                    {b.label || '(unlabeled)'}
                  </td>
                  <td className="py-2 text-zinc-400 font-mono text-xs">
                    {b.source_file}
                  </td>
                  <td className="py-2 text-zinc-300">{b.row_count}</td>
                  <td className="py-2 text-zinc-400 text-xs">
                    {new Date(b.uploaded_at).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    {b.is_active ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-teal-500/10 text-teal-400">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-700/50 text-zinc-500">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-2 flex gap-2">
                    {!b.is_active && (
                      <button
                        onClick={() => toggleBatch(b.id, true)}
                        className="text-xs text-teal-400 hover:text-teal-300"
                      >
                        Activate
                      </button>
                    )}
                    {b.is_active && (
                      <button
                        onClick={() => toggleBatch(b.id, false)}
                        className="text-xs text-amber-400 hover:text-amber-300"
                      >
                        Deactivate
                      </button>
                    )}
                    <button
                      onClick={() => deleteBatch(b.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
