import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Check, Gift, LogOut, Minus, Package, Plus, Search, ShoppingBag,
  ShoppingCart, Trash2, User
} from 'lucide-react';
import { api, money } from '../api.js';

const productVisuals = [
  { icon: Box, background: 'linear-gradient(135deg, #dbeafe, #c4b5fd)', color: '#4338ca' },
  { icon: Gift, background: 'linear-gradient(135deg, #fce7f3, #fecdd3)', color: '#be185d' },
  { icon: Package, background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#047857' },
  { icon: ShoppingBag, background: 'linear-gradient(135deg, #fef3c7, #fed7aa)', color: '#b45309' }
];

export default function CustomerStorefront({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [addedProductId, setAddedProductId] = useState(null);

  useEffect(() => {
    let active = true;
    api('/products')
      .then(data => {
        if (active) setProducts(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (active) setError(err.message || 'Could not load products. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (addedProductId === null) return undefined;
    const timeout = window.setTimeout(() => setAddedProductId(null), 1000);
    return () => window.clearTimeout(timeout);
  }, [addedProductId]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter(product =>
      `${product.name} ${product.description || ''} ${product.sku || ''}`.toLowerCase().includes(query)
    );
  }, [products, search]);

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + Number(item.price) * item.quantity, 0);

  function addToCart(product) {
    const existing = cart.find(item => String(item.product_id) === String(product.id));
    if (existing && existing.quantity >= Number(product.stock_quantity)) return;

    setCart(current => {
      const inCart = current.find(item => String(item.product_id) === String(product.id));
      if (inCart) {
        return current.map(item => String(item.product_id) === String(product.id)
          ? { ...item, quantity: item.quantity + 1 }
          : item);
      }
      return [...current, {
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        stock_quantity: Number(product.stock_quantity),
        quantity: 1
      }];
    });
    setAddedProductId(product.id);
    setError('');
    setNotice('');
  }

  function updateQuantity(productId, change) {
    setCart(current => current
      .map(item => {
        if (String(item.product_id) !== String(productId)) return item;
        return { ...item, quantity: item.quantity + change };
      })
      .filter(item => item.quantity > 0 && item.quantity <= item.stock_quantity));
  }

  async function checkout() {
    if (!cart.length || checkoutBusy) return;
    setCheckoutBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await api('/customer/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity
          }))
        })
      });
      setCart([]);
      setCartOpen(false);
      setNotice(`Order #${result.id} placed successfully.`);
    } catch (err) {
      setError(err.message || 'Checkout could not be completed. Please try again.');
    } finally {
      setCheckoutBusy(false);
    }
  }

  return (
    <div className="storefront-page">
      <style>{`
        .storefront-page { min-height: 100vh; background: var(--bs-tertiary-bg, #f8f9fa); }
        .storefront-header { position: sticky; top: 0; z-index: 1020; background: rgba(255,255,255,.94); backdrop-filter: blur(14px); }
        .storefront-brand-mark { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 12px; color: white; background: linear-gradient(135deg,#6366f1,#4338ca); }
        .storefront-product-card { transition: transform .2s ease, box-shadow .2s ease; }
        .storefront-product-card:hover { transform: translateY(-5px); box-shadow: 0 1rem 2rem rgba(15,23,42,.12) !important; }
        .storefront-product-visual { min-height: 170px; display: grid; place-items: center; }
        .storefront-search { max-width: 440px; }
        .storefront-cart-badge { top: -3px; right: -4px; }
        .storefront-offcanvas-backdrop { position: fixed; inset: 0; z-index: 1039; background: rgba(15,23,42,.5); }
        .storefront-offcanvas { z-index: 1040; width: min(100%, 440px) !important; }
        @media (max-width: 575.98px) {
          .storefront-header-content { flex-wrap: wrap; }
          .storefront-search { order: 3; max-width: none; flex-basis: 100%; }
        }
      `}</style>

      <header className="storefront-header border-bottom shadow-sm">
        <div className="container-fluid px-3 px-lg-5 py-3">
          <div className="storefront-header-content d-flex align-items-center justify-content-between gap-3">
            <a href="#" className="d-flex align-items-center gap-2 text-decoration-none text-body flex-shrink-0">
              <span className="storefront-brand-mark"><ShoppingBag size={20} /></span>
              <span className="fw-bold fs-5">Sales Monitor</span>
            </a>

            <label className="storefront-search input-group">
              <span className="input-group-text bg-body border-end-0"><Search size={17} className="text-secondary" /></span>
              <input
                className="form-control border-start-0 ps-0"
                aria-label="Search products"
                placeholder="Search products..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </label>

            <div className="d-flex align-items-center gap-2 gap-md-3 flex-shrink-0">
              <button
                type="button"
                className="btn btn-light position-relative rounded-circle d-grid align-items-center justify-content-center"
                aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart size={20} />
                <span className="storefront-cart-badge position-absolute badge rounded-pill bg-danger">
                  {cartCount}
                </span>
              </button>
              <div className="d-none d-md-flex align-items-center gap-2 text-secondary">
                <User size={17} />
                <span className="small fw-medium text-body">{user.name}</span>
              </div>
              <button type="button" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={onLogout}>
                <LogOut size={16} /><span className="d-none d-sm-inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-4 py-lg-5">
        <section className="rounded-4 p-4 p-lg-5 mb-4 mb-lg-5 text-white shadow-sm" style={{ background: 'linear-gradient(120deg,#4338ca,#6366f1 58%,#818cf8)' }}>
          <p className="text-uppercase small fw-semibold opacity-75 mb-2">Welcome to our store</p>
          <h1 className="display-6 fw-bold mb-2">Find something you’ll love.</h1>
          <p className="mb-0 opacity-75">Browse our collection and add your favorites to the cart.</p>
        </section>

        {notice && <div className="alert alert-success alert-dismissible d-flex align-items-center gap-2" role="status">
          <Check size={18} /><span>{notice}</span>
          <button type="button" className="btn-close ms-auto" aria-label="Dismiss" onClick={() => setNotice('')} />
        </div>}
        {error && <div className="alert alert-danger alert-dismissible" role="alert">
          {error}
          <button type="button" className="btn-close" aria-label="Dismiss" onClick={() => setError('')} />
        </div>}

        <div className="d-flex align-items-end justify-content-between gap-3 mb-3 mb-lg-4">
          <div>
            <p className="text-primary text-uppercase small fw-bold mb-1">Our collection</p>
            <h2 className="h3 fw-bold mb-0">Available products</h2>
          </div>
          {!loading && <span className="small text-secondary">{visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'}</span>}
        </div>

        {loading ? (
          <div className="text-center py-5" role="status">
            <span className="spinner-border text-primary" aria-hidden="true" />
            <p className="text-secondary mt-3 mb-0">Loading products...</p>
          </div>
        ) : visibleProducts.length ? (
          <div className="row g-3 g-lg-4">
            {visibleProducts.map((product, index) => {
              const visual = productVisuals[index % productVisuals.length];
              const ProductIcon = visual.icon;
              const itemInCart = cart.find(item => String(item.product_id) === String(product.id));
              const available = Number(product.stock_quantity) > (itemInCart?.quantity || 0);
              return (
                <div className="col-12 col-sm-6 col-lg-4 col-xl-3" key={product.id}>
                  <article className="card storefront-product-card rounded-4 shadow-sm border-0 h-100 overflow-hidden">
                    <div className="storefront-product-visual" style={{ background: visual.background }}>
                      <ProductIcon size={58} strokeWidth={1.4} color={visual.color} aria-hidden="true" />
                    </div>
                    <div className="card-body d-flex flex-column p-3 p-lg-4">
                      {product.sku && <span className="small text-secondary text-uppercase mb-2">{product.sku}</span>}
                      <h3 className="h5 fw-bold mb-2">{product.name}</h3>
                      <p className="small text-secondary mb-3 flex-grow-1">{product.description || 'A great addition to your everyday essentials.'}</p>
                      <div className="d-flex align-items-baseline justify-content-between mb-3">
                        <span className="fs-4 fw-bold text-primary">{money(product.price)}</span>
                        <span className={`small ${available ? 'text-secondary' : 'text-danger'}`}>
                          {available ? `${Number(product.stock_quantity) - (itemInCart?.quantity || 0)} in stock` : 'Out of stock'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={`btn w-100 ${addedProductId === product.id ? 'btn-success' : 'btn-primary'}`}
                        disabled={!available}
                        onClick={() => addToCart(product)}
                      >
                        {addedProductId === product.id ? <><Check size={17} className="me-2" />Added!</> : <><ShoppingCart size={17} className="me-2" />Add to Cart</>}
                      </button>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center rounded-4 bg-body p-5 shadow-sm">
            <Package size={34} className="text-secondary mb-3" />
            <h3 className="h5 fw-bold">{search ? 'No matching products' : 'No products available yet'}</h3>
            <p className="text-secondary mb-0">{search ? 'Try a different search term.' : 'Please check back soon for new products.'}</p>
          </div>
        )}
      </main>

      {cartOpen && <>
        <button type="button" className="storefront-offcanvas-backdrop border-0" aria-label="Close cart" onClick={() => setCartOpen(false)} />
        <aside className="offcanvas offcanvas-end show storefront-offcanvas" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="storefront-cart-title">
          <div className="offcanvas-header border-bottom px-4 py-3">
            <div>
              <h2 className="offcanvas-title h5 fw-bold mb-1" id="storefront-cart-title">Your cart</h2>
              <p className="small text-secondary mb-0">{cartCount} {cartCount === 1 ? 'item' : 'items'}</p>
            </div>
            <button type="button" className="btn-close" aria-label="Close cart" onClick={() => setCartOpen(false)} />
          </div>
          <div className="offcanvas-body d-flex flex-column p-4">
            {!cart.length ? (
              <div className="text-center my-auto">
                <ShoppingBag size={42} className="text-secondary mb-3" />
                <h3 className="h6 fw-bold">Your cart is empty</h3>
                <p className="small text-secondary">Add products to get started.</p>
                <button type="button" className="btn btn-primary" onClick={() => setCartOpen(false)}>Continue shopping</button>
              </div>
            ) : <>
              <div className="flex-grow-1 overflow-auto">
                {cart.map(item => (
                  <div className="d-flex align-items-center gap-3 py-3 border-bottom" key={item.product_id}>
                    <div className="rounded-3 d-grid align-items-center justify-content-center flex-shrink-0" style={{ width: 48, height: 48, background: '#eef2ff', color: '#4338ca' }}>
                      <Package size={22} />
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <p className="fw-semibold mb-1 text-truncate">{item.name}</p>
                      <p className="small text-primary fw-semibold mb-2">{money(item.price)}</p>
                      <div className="d-flex align-items-center gap-2">
                        <button type="button" className="btn btn-sm btn-outline-secondary py-1 px-2" aria-label={`Decrease ${item.name} quantity`} onClick={() => updateQuantity(item.product_id, -1)}>
                          <Minus size={13} />
                        </button>
                        <span className="small fw-semibold" aria-label={`Quantity ${item.quantity}`}>{item.quantity}</span>
                        <button type="button" className="btn btn-sm btn-outline-secondary py-1 px-2" aria-label={`Increase ${item.name} quantity`} disabled={item.quantity >= item.stock_quantity} onClick={() => updateQuantity(item.product_id, 1)}>
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="text-end">
                      <strong className="small d-block mb-2">{money(item.price * item.quantity)}</strong>
                      <button type="button" className="btn btn-sm btn-link text-danger p-0" aria-label={`Remove ${item.name}`} onClick={() => setCart(current => current.filter(row => String(row.product_id) !== String(item.product_id)))}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-top pt-3 mt-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary">Subtotal</span>
                  <strong className="fs-5">{money(cartTotal)}</strong>
                </div>
                <button type="button" className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2" disabled={checkoutBusy} onClick={checkout}>
                  {checkoutBusy ? <><span className="spinner-border spinner-border-sm" aria-hidden="true" />Placing order...</> : <><ShoppingBag size={18} />Checkout</>}
                </button>
                <p className="small text-secondary text-center mt-3 mb-0">Your total is confirmed securely at checkout.</p>
              </div>
            </>}
          </div>
        </aside>
      </>}
    </div>
  );
}
