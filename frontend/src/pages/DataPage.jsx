import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { api, dateTime, money } from '../api.js';

const definitions = {
  products: {
    title: 'Products', description: 'Manage your catalog, pricing, and reorder points.', endpoint: '/products',
    fields: [
      { key: 'sku', label: 'SKU', required: true }, { key: 'name', label: 'Product name', required: true },
      { key: 'description', label: 'Description', type: 'textarea' }, { key: 'price', label: 'Selling price', type: 'number', min: 0, step: '0.01', required: true },
      { key: 'cost', label: 'Unit cost', type: 'number', min: 0, step: '0.01' },
      { key: 'stock_quantity', label: 'Opening stock', type: 'number', min: 0, required: true, createOnly: true },
      { key: 'reorder_level', label: 'Reorder level', type: 'number', min: 0 },
      { key: 'active', label: 'Product active', type: 'checkbox', editOnly: true }
    ],
    columns: [
      { key: 'name', label: 'Product', secondary: 'sku' }, { key: 'price', label: 'Price', render: money },
      { key: 'stock_quantity', label: 'In stock', render: (value, row) => <span className={Number(value) <= Number(row.reorder_level) ? 'stock-low' : ''}>{value} {Number(value) <= Number(row.reorder_level) && <span className="badge text-bg-warning ms-1">Low</span>}</span> },
      { key: 'reorder_level', label: 'Reorder at' }, { key: 'active', label: 'Status', render: value => <Status active={value} /> }
    ]
  },
  customers: {
    title: 'Customers', description: 'Keep customer contact details organized.', endpoint: '/customers',
    fields: [
      { key: 'name', label: 'Full name', required: true }, { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone' }, { key: 'address', label: 'Address' },
      { key: 'password', label: 'Portal password (8+ characters; leave blank to keep unchanged)', type: 'password' }
    ],
    columns: [{ key: 'name', label: 'Customer' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'address', label: 'Address' }, { key: 'created_at', label: 'Added', render: dateTime }]
  },
  employees: {
    title: 'Employees', description: 'Manage staff accounts and access roles.', endpoint: '/employees',
    fields: [
      { key: 'name', label: 'Full name', required: true }, { key: 'email', label: 'Work email', type: 'email', required: true },
      { key: 'password', label: 'Temporary password (8+ characters)', type: 'password', required: true, createOnly: true },
      { key: 'role', label: 'Role', type: 'select', options: ['cashier', 'manager', 'admin'], required: true },
      { key: 'active', label: 'Account active', type: 'checkbox', editOnly: true }
    ],
    columns: [{ key: 'name', label: 'Employee', secondary: 'email' }, { key: 'role', label: 'Role', render: value => <span className="role-pill">{value}</span> }, { key: 'active', label: 'Status', render: value => <Status active={value} /> }, { key: 'created_at', label: 'Added', render: dateTime }]
  }
};

function Status({ active }) { return <span className={`status-pill ${active ? 'status-active' : 'status-inactive'}`}><i />{active ? 'Active' : 'Inactive'}</span>; }

export function DataPage({ type }) {
  const config = definitions[type];
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const blank = () => Object.fromEntries(config.fields.map(field => [
    field.key,
    field.key === 'active' ? true : field.key === 'role' ? 'cashier' : ''
  ]));
  const [form, setForm] = useState(blank);

  const load = useCallback(() => {
    setBusy(true);
    api(config.endpoint).then(setRows).catch(err => setError(err.message)).finally(() => setBusy(false));
  }, [config.endpoint]);
  useEffect(load, [load]);

  function openForm(row = null) {
    setError(''); setNotice(''); setEditing(row); setFormOpen(true);
    setForm(row ? Object.fromEntries(config.fields.map(field => [field.key, row[field.key] ?? ''])) : blank());
  }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form };
      config.fields.forEach(field => {
        if (field.type === 'number' && payload[field.key] !== '') payload[field.key] = Number(payload[field.key]);
        if (field.type === 'checkbox') payload[field.key] = Boolean(payload[field.key]);
      });
      await api(editing ? `${config.endpoint}/${editing.id}` : config.endpoint, {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload)
      });
      setEditing(null); setFormOpen(false); setNotice(`${config.title.slice(0, -1)} ${editing ? 'updated' : 'added'} successfully.`); load();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  async function remove(row) {
    if (!window.confirm(`Deactivate ${row.name || 'this record'}?`)) return;
    setError('');
    try { await api(`${config.endpoint}/${row.id}`, { method: 'DELETE' }); setNotice('Record deactivated.'); load(); }
    catch (err) { setError(err.message); }
  }

  const filtered = rows.filter(row => Object.values(row).some(value => String(value ?? '').toLowerCase().includes(filter.toLowerCase())));
  return <>
    <div className="page-heading">
      <div><p className="eyebrow">MANAGEMENT</p><h1>{config.title}</h1><p className="text-secondary mb-0">{config.description}</p></div>
      <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => openForm()}><Plus size={17} /> Add {config.title.slice(0, -1)}</button>
    </div>
    {notice && <div className="alert alert-success alert-dismissible py-2">{notice}<button className="btn-close" onClick={() => setNotice('')} /></div>}
    {error && <div className="alert alert-danger alert-dismissible py-2">{error}<button className="btn-close" onClick={() => setError('')} /></div>}
    {formOpen && <div className="panel edit-panel">
      <div className="panel-header"><div><h2>{editing ? 'Edit record' : `Add ${config.title.slice(0, -1)}`}</h2><p>Enter the information below.</p></div><button className="icon-button" aria-label="Close form" onClick={() => setFormOpen(false)}><X size={18} /></button></div>
      <form onSubmit={save} className="form-grid">
        {config.fields.filter(field => (editing ? !field.createOnly : !field.editOnly)).map(field => <label className={`form-field ${field.type === 'textarea' ? 'wide-field' : ''}`} key={field.key}>
          <span>{field.label}{field.required && <b className="required-star"> *</b>}</span>
          {field.type === 'textarea' ? <textarea className="form-control" rows="2" required={field.required} value={form[field.key] || ''} onChange={e => setForm({ ...form, [field.key]: e.target.value })} /> :
            field.type === 'select' ? <select className="form-select" required={field.required} value={form[field.key] || ''} onChange={e => setForm({ ...form, [field.key]: e.target.value })}>{field.options.map(option => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}</select> :
              field.type === 'checkbox' ? <span className="form-check mt-2"><input className="form-check-input" type="checkbox" checked={Boolean(form[field.key])} onChange={e => setForm({ ...form, [field.key]: e.target.checked })} /><span className="form-check-label">Enabled</span></span> :
                <input className="form-control" type={field.type || 'text'} min={field.min} step={field.step} required={field.required} value={form[field.key] ?? ''} onChange={e => setForm({ ...form, [field.key]: e.target.value })} />}
        </label>)}
        <div className="wide-field d-flex justify-content-end gap-2"><button type="button" className="btn btn-light" onClick={() => setFormOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
      </form>
    </div>}
    <article className="panel table-panel">
      <div className="table-toolbar"><div><strong>{config.title} list</strong><span>{filtered.length} records</span></div><label className="table-search"><Search size={15} /><input placeholder={`Search ${config.title.toLowerCase()}...`} value={filter} onChange={e => setFilter(e.target.value)} /></label></div>
      {busy ? <div className="panel-loading"><span className="spinner-border spinner-border-sm text-primary" /></div> :
        <div className="table-responsive"><table className="table data-table align-middle mb-0"><thead><tr>{config.columns.map(col => <th key={col.key}>{col.label}</th>)}<th className="text-end">Actions</th></tr></thead>
          <tbody>{filtered.map(row => <tr key={row.id}>{config.columns.map(col => <td key={col.key}>{col.render ? col.render(row[col.key], row) : col.secondary ? <div className="main-secondary"><strong>{row[col.key]}</strong><small>{row[col.secondary]}</small></div> : row[col.key] || <span className="text-secondary">—</span>}</td>)}
            <td className="text-end"><button className="icon-button row-action" title="Edit" aria-label="Edit" onClick={() => openForm(row)}><Edit2 size={16} /></button><button className="icon-button row-action danger" title="Deactivate" aria-label="Deactivate" onClick={() => remove(row)}><Trash2 size={16} /></button></td>
          </tr>)}
          {!filtered.length && <tr><td colSpan={config.columns.length + 1}><div className="empty-table">{rows.length ? 'No matching records.' : `No ${config.title.toLowerCase()} yet. Add your first record to get started.`}</div></td></tr>}</tbody>
        </table></div>}
    </article>
  </>;
}
