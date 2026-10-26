import React, { useCallback, useEffect, useState } from 'react';
import { Boxes, Plus, Search } from 'lucide-react';
import { api, dateTime } from '../api.js';

export function InventoryPage({ refreshKey = 0 }) {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [adjusting, setAdjusting] = useState(false);
  const [form, setForm] = useState({ product_id: '', quantity: '', note: '' });
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [history, inventory] = await Promise.all([
        api('/inventory', { cache: 'no-store' }),
        api('/products', { cache: 'no-store' })
      ]);
      setMovements(history); setProducts(inventory.filter(item => item.active));
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await api('/inventory/adjustments', { method: 'POST', body: JSON.stringify({ ...form, product_id: Number(form.product_id), quantity: Number(form.quantity) }) });
      setForm({ product_id: '', quantity: '', note: '' }); setAdjusting(false); setNotice('Inventory adjustment recorded.'); load();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  const filtered = movements.filter(row => `${row.sku} ${row.product_name} ${row.type} ${row.note}`.toLowerCase().includes(filter.toLowerCase()));
  return <>
    <div className="page-heading">
      <div><p className="eyebrow">OPERATIONS</p><h1>Inventory</h1><p className="text-secondary mb-0">Track stock levels and review every inventory movement.</p></div>
      <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setAdjusting(!adjusting)}><Plus size={17} /> Adjust stock</button>
    </div>
    {error && <div className="alert alert-danger alert-dismissible py-2">{error}<button className="btn-close" onClick={() => setError('')} /></div>}
    {notice && <div className="alert alert-success alert-dismissible py-2">{notice}<button className="btn-close" onClick={() => setNotice('')} /></div>}
    {adjusting && <article className="panel edit-panel"><div className="panel-header"><div><h2>Stock adjustment</h2><p>Positive quantities add stock; negative quantities remove it.</p></div></div>
      <form className="form-grid" onSubmit={submit}>
        <label className="form-field"><span>Product</span><select className="form-select" required value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}><option value="">Choose product</option>{products.map(item => <option key={item.id} value={item.id}>{item.name} · {item.stock_quantity} available</option>)}</select></label>
        <label className="form-field"><span>Quantity adjustment</span><input className="form-control" type="number" step="1" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 10 or -2" /></label>
        <label className="form-field wide-field"><span>Reason</span><input className="form-control" required value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Purchase order, damaged item, count correction…" /></label>
        <div className="wide-field d-flex justify-content-end gap-2"><button type="button" className="btn btn-light" onClick={() => setAdjusting(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Record adjustment'}</button></div>
      </form>
    </article>}
    <div className="inventory-summary">
      <article className="summary-card"><div className="summary-top"><span>Tracked products</span><div className="metric-icon blue"><Boxes size={19} /></div></div><div className="metric-value">{products.length}</div><div className="metric-foot"><span className="text-secondary">Active catalog items</span></div></article>
      <article className="summary-card"><div className="summary-top"><span>Recent movements</span><div className="metric-icon purple"><Plus size={19} /></div></div><div className="metric-value">{movements.length}</div><div className="metric-foot"><span className="text-secondary">Last 200 movements</span></div></article>
      <article className="summary-card"><div className="summary-top"><span>Needs attention</span><div className="metric-icon orange"><Boxes size={19} /></div></div><div className="metric-value">{products.filter(item => item.stock_quantity <= item.reorder_level).length}</div><div className="metric-foot"><span className="text-secondary">At or below reorder point</span></div></article>
    </div>
    <article className="panel table-panel">
      <div className="table-toolbar"><div><strong>Movement history</strong><span>Stock changes, sales, and adjustments</span></div><label className="table-search"><Search size={15} /><input placeholder="Search movements..." value={filter} onChange={e => setFilter(e.target.value)} /></label></div>
      {busy ? <div className="panel-loading"><span className="spinner-border spinner-border-sm text-primary" /></div> :
        <div className="table-responsive"><table className="table data-table align-middle mb-0"><thead><tr><th>Product</th><th>Movement</th><th>Quantity</th><th>Reason</th><th>Recorded by</th><th>Date</th></tr></thead><tbody>
          {filtered.map(row => <tr key={row.id}><td><div className="main-secondary"><strong>{row.product_name}</strong><small>{row.sku}</small></div></td>
            <td><span className={`movement-pill movement-${row.type}`}>{row.type.replace('_', ' ')}</span></td>
            <td className={row.quantity < 0 ? 'quantity-negative' : 'quantity-positive'}>{row.quantity > 0 ? '+' : ''}{row.quantity}</td><td>{row.note || '—'}</td><td>{row.employee_name || 'System'}</td><td>{dateTime(row.created_at)}</td></tr>)}
          {!filtered.length && <tr><td colSpan="6"><div className="empty-table">No inventory movements found.</div></td></tr>}
        </tbody></table></div>}
    </article>
  </>;
}
