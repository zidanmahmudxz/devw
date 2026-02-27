'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, RefreshCw, Trash2, Link, FileText,
  ChevronDown, Clock, CheckCircle, XCircle,
  AlertTriangle, Loader2, Eye, Pencil, X
} from 'lucide-react';
import SlipForm from '@/components/SlipForm';
import LogModal from '@/components/LogModal';
import { COUNTRIES, DESTINATION_COUNTRIES, NATIONALITIES } from '@/lib/formData';

const STATUS_CONFIG = {
  pending:      { label: 'Pending',      cls: 'badge-pending',   Icon: Clock },
  submitted:    { label: 'Submitted',    cls: 'badge-submitted', Icon: CheckCircle },
  error:        { label: 'Error',        cls: 'badge-error',     Icon: XCircle },
  processing:   { label: 'Processing',   cls: 'badge bg-blue-50 text-blue-700 border border-blue-200', Icon: Loader2 },
  otp_required: { label: 'OTP Required', cls: 'badge bg-orange-50 text-orange-700 border border-orange-200', Icon: AlertTriangle },
};

function getLabel(arr, val) {
  return arr.find(x => x.value === val)?.label || val || '—';
}

export default function Dashboard() {
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editSlip, setEditSlip] = useState(null);
  const [logSlip, setLogSlip] = useState(null);
  const [formSaving, setFormSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const fetchSlips = useCallback(async () => {
    try {
      const res = await fetch('/api/slips');
      const { data, error } = await res.json();
      if (error) throw new Error(error);
      setSlips(data || []);
    } catch (err) {
      toast.error('Failed to load slips: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlips();
    // Auto-refresh every 10s when there's a processing slip
    const interval = setInterval(() => {
      if (slips.some(s => s.status === 'processing')) fetchSlips();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchSlips, slips]);

  const handleSaveSlip = async (formData) => {
    setFormSaving(true);
    try {
      const method = editSlip ? 'PUT' : 'POST';
      const url = editSlip ? `/api/slips/${editSlip.id}` : '/api/slips';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const { data, error } = await res.json();
      if (error) throw new Error(error);

      toast.success(editSlip ? 'Slip updated!' : 'New slip saved!');
      setFormOpen(false);
      setEditSlip(null);
      fetchSlips();
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setFormSaving(false);
    }
  };

  const handleGenerateLink = async (slip) => {
    setGeneratingId(slip.id);
    toast.loading('Starting automation...', { id: 'gen-' + slip.id });

    try {
      const res = await fetch(`/api/generate-link/${slip.id}`, { method: 'POST' });
      const result = await res.json();

      if (result.error) {
        toast.error('Automation failed: ' + result.error, { id: 'gen-' + slip.id });
      } else if (result.url?.includes('/pay/') || result.url?.includes('/appointment/')) {
        toast.success('✅ Payment link generated!', { id: 'gen-' + slip.id });
      } else {
        toast.success('Automation completed. Check the log.', { id: 'gen-' + slip.id });
      }

      fetchSlips();
      // Open log for this slip
      const { data } = await fetch(`/api/slips/${slip.id}`).then(r => r.json());
      if (data) setLogSlip(data);
    } catch (err) {
      toast.error('Failed: ' + err.message, { id: 'gen-' + slip.id });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/slips/${id}`, { method: 'DELETE' });
      toast.success('Slip deleted');
      setDeleteId(null);
      fetchSlips();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const openEdit = (slip) => {
    setEditSlip(slip);
    setFormOpen(true);
  };

  const openLog = async (slip) => {
    // Refresh this slip's data before showing log
    const res = await fetch(`/api/slips/${slip.id}`);
    const { data } = await res.json();
    setLogSlip(data || slip);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-56 bg-[#6F1D46] text-white flex flex-col">
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText size={16} />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Wafid</h1>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Slip Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="px-3 py-2 rounded-lg bg-white/15 text-sm font-medium flex items-center gap-2">
            <FileText size={15} />
            All Slips
            <span className="ml-auto bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
              {slips.length}
            </span>
          </div>
        </nav>

        <div className="px-4 pb-4">
          <div className="text-[10px] text-white/40 text-center">
            v1.0.0 · Wafid Auto-Submit
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Medical Examination Slips</h2>
            <p className="text-xs text-gray-400 mt-0.5">Auto-submit appointments to wafid.com</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSlips}
              className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
            <button
              onClick={() => { setEditSlip(null); setFormOpen(true); }}
              className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5"
            >
              <Plus size={14} />
              Add New Slip
            </button>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 p-6">

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Slips', count: slips.length, color: 'text-gray-700', bg: 'bg-white' },
              { label: 'Submitted', count: slips.filter(s => s.status === 'submitted').length, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Pending', count: slips.filter(s => s.status === 'pending').length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Errors', count: slips.filter(s => s.status === 'error').length, color: 'text-red-600', bg: 'bg-red-50' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-gray-100`}>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-24 gap-3">
                <Loader2 size={24} className="animate-spin text-[#6F1D46]" />
                <span className="text-gray-500 text-sm">Loading slips...</span>
              </div>
            ) : slips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <FileText size={40} className="mb-4 opacity-30" />
                <p className="text-base font-medium text-gray-500">No slips yet</p>
                <p className="text-sm mt-1 mb-4">Click "Add New Slip" to get started</p>
                <button
                  onClick={() => { setEditSlip(null); setFormOpen(true); }}
                  className="btn-primary text-sm"
                >
                  <Plus size={14} className="inline mr-1" />
                  Add New Slip
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Candidate</th>
                      <th>Passport</th>
                      <th>Country → Dest.</th>
                      <th>Type</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slips.map((slip, i) => {
                      const cfg = STATUS_CONFIG[slip.status] || STATUS_CONFIG.pending;
                      const isGenerating = generatingId === slip.id;
                      return (
                        <tr key={slip.id} className={isGenerating ? 'opacity-70' : ''}>
                          <td className="text-gray-400 font-mono text-xs">{i + 1}</td>
                          <td>
                            <div className="font-medium text-gray-800 text-sm">
                              {slip.first_name} {slip.last_name}
                            </div>
                            <div className="text-xs text-gray-400">{slip.nationality ? getLabel(NATIONALITIES, slip.nationality) : '—'}</div>
                          </td>
                          <td className="font-mono text-xs text-gray-600">{slip.passport || '—'}</td>
                          <td className="text-xs">
                            <span>{getLabel(COUNTRIES, slip.country)}</span>
                            <span className="mx-1 text-gray-300">→</span>
                            <span className="font-medium">{getLabel(DESTINATION_COUNTRIES, slip.traveled_country)}</span>
                          </td>
                          <td>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              slip.appointment_type === 'premium'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}>
                              {slip.appointment_type === 'premium' ? 'Premium' : 'Standard'}
                            </span>
                          </td>
                          <td className="text-xs text-gray-500">{slip.email || '—'}</td>
                          <td>
                            <span className={`badge ${cfg.cls} flex items-center gap-1`}>
                              <cfg.Icon size={10} className={slip.status === 'processing' ? 'animate-spin' : ''} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="text-xs text-gray-400 font-mono">
                            {new Date(slip.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Edit */}
                              <button
                                onClick={() => openEdit(slip)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                title="Edit"
                              >
                                <Pencil size={13} />
                              </button>

                              {/* Generate Link */}
                              <button
                                onClick={() => handleGenerateLink(slip)}
                                disabled={isGenerating}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  isGenerating
                                    ? 'bg-blue-50 text-blue-400 cursor-not-allowed'
                                    : 'bg-[#6F1D46] text-white hover:bg-[#5c1739]'
                                }`}
                                title="Auto-submit to wafid.com"
                              >
                                {isGenerating
                                  ? <><Loader2 size={11} className="animate-spin" /> Running...</>
                                  : <><Link size={11} /> Generate Link</>
                                }
                              </button>

                              {/* View Log */}
                              <button
                                onClick={() => openLog(slip)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors relative"
                                title="View Log"
                              >
                                <Eye size={13} />
                                {(slip.log_entries?.length > 0) && (
                                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full" />
                                )}
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => setDeleteId(slip.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* === Slip Form Modal === */}
      {formOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !formSaving) { setFormOpen(false); setEditSlip(null); } }}>
          <div className="modal-content animate-slide-in">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {editSlip ? 'Edit Slip' : 'Add New Slip'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editSlip ? `Editing: ${editSlip.first_name} ${editSlip.last_name}` : 'Fill in the appointment details'}
                </p>
              </div>
              <button
                onClick={() => { if (!formSaving) { setFormOpen(false); setEditSlip(null); } }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <SlipForm
              initialData={editSlip}
              onSave={handleSaveSlip}
              onCancel={() => { setFormOpen(false); setEditSlip(null); }}
              loading={formSaving}
            />
          </div>
        </div>
      )}

      {/* === Log Modal === */}
      {logSlip && (
        <LogModal slip={logSlip} onClose={() => setLogSlip(null)} />
      )}

      {/* === Delete Confirmation Modal === */}
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Delete Slip</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete this slip and all its logs?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 text-sm">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 btn-danger text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
