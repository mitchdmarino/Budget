import { useEffect, useRef, useState } from 'react';
import type { Paycheck, CreatePaycheckInput, UpdatePaycheckInput } from '@budget/shared';
import * as paychecksApi from '../api/paychecks';
import { formatCents } from '../utils/format';

// ── Helpers ────────────────────────────────────────────────────────────────────

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function dollarsToCents(s: string): number {
  return Math.round(parseFloat(s || '0') * 100);
}

function centsToString(cents: number): string {
  return cents === 0 ? '' : (cents / 100).toFixed(2);
}

// ── Paycheck Modal (add / edit) ────────────────────────────────────────────────

interface FormState {
  pay_date: string;
  gross: string;
  taxes: string;
  retirement: string;
  other_deductions: string;
  net: string;
  notes: string;
}

function computeNet(f: FormState): string {
  const gross = parseFloat(f.gross) || 0;
  const taxes = parseFloat(f.taxes) || 0;
  const retirement = parseFloat(f.retirement) || 0;
  const other = parseFloat(f.other_deductions) || 0;
  const net = gross - taxes - retirement - other;
  return net > 0 ? net.toFixed(2) : '';
}

function PaycheckModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Paycheck;
  onSave: (data: CreatePaycheckInput | UpdatePaycheckInput) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    pay_date: initial?.pay_date ?? new Date().toISOString().slice(0, 10),
    gross: initial ? centsToString(initial.gross_cents) : '',
    taxes: initial ? centsToString(initial.taxes_cents) : '',
    retirement: initial ? centsToString(initial.retirement_cents) : '',
    other_deductions: initial ? centsToString(initial.other_deductions_cents) : '',
    net: initial ? centsToString(initial.net_cents) : '',
    notes: initial?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Auto-compute net whenever deduction fields blur
  const handleDeductionBlur = () => {
    setForm(f => ({ ...f, net: computeNet(f) }));
  };

  const handleSubmit = async () => {
    if (!form.pay_date || !form.gross || !form.net) {
      setError('Pay date, gross, and net are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        pay_date: form.pay_date,
        gross_cents: dollarsToCents(form.gross),
        taxes_cents: dollarsToCents(form.taxes),
        retirement_cents: dollarsToCents(form.retirement),
        other_deductions_cents: dollarsToCents(form.other_deductions),
        net_cents: dollarsToCents(form.net),
        notes: form.notes || null,
      });
    } catch {
      setError('Failed to save paycheck.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-semibold mb-5">{initial ? 'Edit Paycheck' : 'Add Paycheck'}</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Pay Date</label>
            <input
              type="date"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={form.pay_date}
              onChange={e => set('pay_date', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Gross Pay</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={form.gross}
                onChange={e => set('gross', e.target.value)}
                onBlur={handleDeductionBlur}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Taxes</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={form.taxes}
                onChange={e => set('taxes', e.target.value)}
                onBlur={handleDeductionBlur}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Retirement (401k)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={form.retirement}
                onChange={e => set('retirement', e.target.value)}
                onBlur={handleDeductionBlur}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Other Deductions</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={form.other_deductions}
                onChange={e => set('other_deductions', e.target.value)}
                onBlur={handleDeductionBlur}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Net Pay</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={form.net}
              onChange={e => set('net', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <input
              type="text"
              placeholder="Optional"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : initial ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Upload Modal ────────────────────────────────────────────────────────────────

function UploadModal({ onDone, onClose }: { onDone: (p: Paycheck) => void; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<Paycheck | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setError('');
    try {
      const paycheck = await paychecksApi.uploadPaycheckPdf(file);
      setResult(paycheck);
      setStatus('done');
      onDone(paycheck);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Upload failed';
      setError(msg);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-semibold mb-5">Import Paystub PDF</h2>

        {status === 'done' && result ? (
          <div className="text-center py-4 space-y-1">
            <div className="text-green-400 text-2xl mb-3">✓</div>
            <div className="text-sm font-medium">{result.pay_date}</div>
            <div className="text-xs text-gray-400">Gross: {formatCents(result.gross_cents)}</div>
            <div className="text-xs text-gray-400">Net: {formatCents(result.net_cents)}</div>
            <button
              onClick={onClose}
              className="mt-5 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-gray-600 mb-4"
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="text-sm">{file.name}</div>
              ) : (
                <div className="text-sm text-gray-500">Click to select PDF</div>
              )}
            </div>

            {status === 'error' && <p className="text-red-400 text-xs mb-3">{error}</p>}

            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || status === 'uploading'}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium disabled:opacity-50"
              >
                {status === 'uploading' ? 'Parsing…' : 'Import'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function PaychecksPage() {
  const [paychecks, setPaychecks] = useState<Paycheck[]>([]);
  const [month, setMonth] = useState(currentMonth);
  const [error, setError] = useState<string | null>(null);
  // undefined = closed, null = new, Paycheck = editing
  const [editing, setEditing] = useState<Paycheck | null | undefined>(undefined);
  const [showUpload, setShowUpload] = useState(false);

  const load = () => {
    setError(null);
    paychecksApi.fetchPaychecks(month)
      .then(setPaychecks)
      .catch(() => setError('Failed to load paychecks'));
  };

  useEffect(() => { load(); }, [month]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (data: CreatePaycheckInput | UpdatePaycheckInput) => {
    if (editing?.id) {
      const updated = await paychecksApi.updatePaycheck(editing.id, data as UpdatePaycheckInput);
      setPaychecks(prev => prev.map(p => p.id === updated.id ? updated : p));
    } else {
      const created = await paychecksApi.createPaycheck(data as CreatePaycheckInput);
      if (created.pay_date.startsWith(month)) {
        setPaychecks(prev => [created, ...prev]);
      }
    }
    setEditing(undefined);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this paycheck?')) return;
    await paychecksApi.deletePaycheck(id);
    setPaychecks(prev => prev.filter(p => p.id !== id));
  };

  const handleUploaded = (p: Paycheck) => {
    if (p.pay_date.startsWith(month)) {
      setPaychecks(prev => [p, ...prev]);
    }
  };

  const totals = paychecks.reduce(
    (acc, p) => ({
      gross: acc.gross + p.gross_cents,
      net: acc.net + p.net_cents,
      retirement: acc.retirement + p.retirement_cents,
    }),
    { gross: 0, net: 0, retirement: 0 },
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Paychecks</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonth(m => shiftMonth(m, -1))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="min-w-[140px] text-center text-sm text-gray-200">{formatMonthLabel(month)}</span>
            <button
              onClick={() => setMonth(m => shiftMonth(m, 1))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="px-3 py-1.5 text-sm border border-gray-700 hover:border-gray-600 rounded-lg text-gray-300"
          >
            Import PDF
          </button>
          <button
            onClick={() => setEditing(null)}
            className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium"
          >
            + Add
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Summary strip */}
      {paychecks.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Gross', value: totals.gross, color: 'text-white' },
            { label: 'Total Net', value: totals.net, color: 'text-green-400' },
            { label: 'Total Retirement', value: totals.retirement, color: 'text-indigo-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
              <div className="text-xs text-gray-500 mb-1">{label}</div>
              <div className={`text-xl font-semibold font-mono ${color}`}>{formatCents(value)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3">Pay Date</th>
              <th className="px-4 py-3 text-right">Gross</th>
              <th className="px-4 py-3 text-right">Taxes</th>
              <th className="px-4 py-3 text-right">Retirement</th>
              <th className="px-4 py-3 text-right">Other</th>
              <th className="px-4 py-3 text-right">Net</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {paychecks.map(p => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{p.pay_date}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-200">{formatCents(p.gross_cents)}</td>
                <td className="px-4 py-3 text-right font-mono text-red-400">{formatCents(p.taxes_cents)}</td>
                <td className="px-4 py-3 text-right font-mono text-indigo-400">{formatCents(p.retirement_cents)}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-400">{formatCents(p.other_deductions_cents)}</td>
                <td className="px-4 py-3 text-right font-mono font-medium text-green-400">{formatCents(p.net_cents)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => setEditing(p)}
                      className="text-gray-600 hover:text-gray-300 px-1"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-gray-600 hover:text-red-400 px-1"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paychecks.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-gray-600 py-12">
                  No paychecks for this month.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing !== undefined && (
        <PaycheckModal
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => setEditing(undefined)}
        />
      )}
      {showUpload && (
        <UploadModal
          onDone={handleUploaded}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
