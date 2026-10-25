import React, { useCallback, useEffect, useState } from 'react';
import { Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { api, dateTime, money } from '../api.js';

export function SalesPage() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [saleRows, productRows, customerRows] = await Promise.all([api('/sales?limit=100'), api('/products'), api('/customers')]);
      setSales(saleRows); setProducts(productRows.filter(item => item.active)); setCustomers(customerRows);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  function addItem() {
    const product = products.find(item => item.id === Number(productId));
    if (!product || !Number.isInteger(Number(quantity)) || Number(quantity) <= 0) return;
    const existing = cart.find(item => item.product_id === product.id);
    const next = existing
      ? cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + Number(quantity) } : item)
      : [...cart, { product_id: product.id, name: product.name, price: product.price, quantity: Number(quantity), stock: product.stock_quantity }];
    if (next.find(item => item.product_id === product.id).quantity > product.stock_quantity) return setError(`Only ${product.stock_quantity} units of ${product.name} are available.`);
    setCart(next); setProductId(''); setQuantity(1); setError('');
  }
  async function checkout() {
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await api('/sales', { method: 'POST', body: JSON.stringify({ customer_id: customerId ? Number(customerId) : null, items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity })) }) });
      setCart([]); setCustomerId(''); setNotice(`Transaction #${result.id} completed for ${money(result.total)}.`); load();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  async function showSale(id) {
    try { setDetail(await api(`/sales/${id}`)); } catch (err) { setError(err.message); }
  }
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <>
    <div className="page-heading">
      <div><p className="eyebrow">CHECKOUT</p><h1>Sales transactions</h1><p className="text-secondary mb-0">Create a sale or review transaction history.</p></div>
    </div>
    {error && <div className="alert alert-danger alert-dismissible py-2">{error}<button className="btn-close" onClick={() => setError('')} /></div>}
    {notice && <div className="alert alert-success alert-dismissible py-2">{notice}<button className="btn-close" onClick={() => setNotice('')} /></div>}
    <div className="sales-layout">
      <article className="panel checkout-panel">
        <div className="panel-header"><div><h2>New transaction</h2><p>Items are priced and inventory is updated securely at checkout.</p></div><div className="metric-icon blue"><ShoppingCart size={19} /></div></div>
        <label className="form-field mb-3"><span>Customer <small className="text-secondary">(optional)</small></span><select className="form-select" value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">Walk-in customer</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
        <div className="add-product-row">
          <label className="form-field flex-grow-1"><span>Add product</span><select className="form-select" value={productId} onChange={e => setProductId(e.target.value)}><option value="">Choose a product</option>{products.map(product => <option key={product.id} value={product.id} disabled={!product.stock_quantity}>{product.name} · {money(product.price)} · {product.stock_quantity} left</option>)}</select></label>
          <label className="form-field quantity-field"><span>Qty</span><input className="form-control" type="number" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
          <button className="btn btn-outline-primary add-item-btn" onClick={addItem} disabled={!productId}><Plus size={17} /> Add</button>
        </div>
        <div className="cart-items">
          {!cart.length ? <div className="empty-state compact"><div className="empty-icon"><ShoppingCart size={20} /></div><strong>Your cart is empty</strong><span>Add products to start a transaction.</span></div> :
            cart.map(item => <div className="cart-row" key={item.product_id}><div className="product-glyph"><ShoppingCart size={16} /></div><div className="cart-name"><strong>{item.name}</strong><small>{item.quantity} × {money(item.price)}</small></div><strong>{money(item.price * item.quantity)}</strong><button className="icon-button row-action danger" aria-label={`Remove ${item.name}`} onClick={() => setCart(cart.filter(row => row.product_id !== item.product_id))}><Trash2 size={15} /></button></div>)}
        </div>
        <div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div>
        <button className="btn btn-primary w-100 py-2 mt-3" disabled={!cart.length || saving} onClick={checkout}>{saving ? 'Completing transaction…' : 'Complete transaction'}</button>
      </article>
      <article className="panel transactions-panel">
        <div className="panel-header"><div><h2>Recent transactions</h2><p>Latest 100 completed sales</p></div></div>
        {busy ? <div className="panel-loading"><span className="spinner-border spinner-border-sm text-primary" /></div> :
          <div className="transaction-list">{sales.map(sale => <button className="transaction-row" key={sale.id} onClick={() => showSale(sale.id)}>
            <span className="transaction-icon"><ShoppingCart size={16} /></span><span className="transaction-meta"><strong>Sale #{sale.id}</strong><small>{sale.customer_name || 'Walk-in'} · {dateTime(sale.created_at)}</small></span><span className="transaction-total"><strong>{money(sale.total)}</strong><small>{sale.item_count} items</small></span>
          </button>)}{!sales.length && <div className="empty-table">No transactions yet.</div>}</div>}
      </article>
    </div>
    {detail && <div className="modal-backdrop-custom" onClick={() => setDetail(null)}><article className="panel sale-detail" onClick={event => event.stopPropagation()}>
      <div className="panel-header"><div><p className="eyebrow">TRANSACTION</p><h2>Sale #{detail.id}</h2><p>{dateTime(detail.created_at)} · {detail.employee_name}</p></div><button className="icon-button" aria-label="Close details" onClick={() => setDetail(null)}>×</button></div>
      <div className="sale-detail-items">{detail.items.map((item, index) => <div className="cart-row" key={`${item.product_name}-${index}`}><div className="cart-name"><strong>{item.product_name}</strong><small>{item.quantity} × {money(item.unit_price)}</small></div><strong>{money(item.line_total)}</strong></div>)}</div>
      <div className="cart-total"><span>Total</span><strong>{money(detail.total)}</strong></div>
    </article></div>}
  </>;
}
