import React, { useState, useEffect } from 'react';
import { Check, LogOut, Minus, Package, Plus, ShoppingBag, ShoppingCart, Trash2, X } from 'lucide-react';
import { api, money } from '../api.js';

export default function CustomerStorefront({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    api('/products')
      .then(data => {
        if (active) setProducts(Array.isArray(data) ? data : []);
      })
      .catch(error => {
        if (active) setLoadError(error.message || 'Could not load products. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timeout = window.setTimeout(() => setMessage(''), 2000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    if (!isCartOpen) return undefined;
    function closeOnEscape(event) {
      if (event.key === 'Escape') setIsCartOpen(false);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isCartOpen]);

  function addToCart(product) {
    const stock = Number(product.stock_quantity) || 0;
    const inCart = cart.find(item => String(item.id) === String(product.id));
    if (stock <= (inCart?.quantity || 0)) return;

    setCart(current => {
      const existing = current.find(item => String(item.id) === String(product.id));
      if (existing) {
        return current.map(item => String(item.id) === String(product.id)
          ? { ...item, quantity: item.quantity + 1 }
          : item);
      }
      return [...current, { ...product, quantity: 1 }];
    });
    setMessage('Item added!');
  }

  function updateQuantity(id, change) {
    setCart(current => current
      .map(item => String(item.id) === String(id)
        ? { ...item, quantity: item.quantity + change }
        : item)
      .filter(item => item.quantity > 0));
  }

  function removeFromCart(id) {
    setCart(current => current.filter(item => String(item.id) !== String(id)));
  }

  const cartTotal = cart.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  async function handleCheckout() {
    if (!cart.length || checkingOut) return;
    setCheckingOut(true);
    try {
      await api('/customer/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(item => ({ product_id: item.id, quantity: item.quantity }))
        })
      });
      setCart([]);
      setIsCartOpen(false);
      window.alert('Order placed successfully!');
    } catch (error) {
      window.alert(`Checkout failed: ${error.message || 'Please try again.'}`);
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="customer-storefront">
      <style>{`
        .customer-storefront { min-height: 100vh; background: #f8fafc; }
        .customer-storefront-header { position: sticky; top: 0; z-index: 1020; background: rgba(255,255,255,.96); backdrop-filter: blur(12px); }
        .customer-storefront-mark { width: 42px; height: 42px; display: grid; place-items: center; flex: none; border-radius: 13px; color: white; background: linear-gradient(135deg,#6366f1,#4338ca); }
        .customer-storefront-card { transition: transform .2s ease, box-shadow .2s ease; }
        .customer-storefront-card:hover { transform: translateY(-5px); box-shadow: 0 1rem 2rem rgba(15,23,42,.12) !important; }
        .customer-storefront-image { min-height: 180px; display: grid; place-items: center; color: #4f46e5; background: linear-gradient(135deg,#eef2ff,#dbeafe); }
        .customer-storefront-backdrop { position: fixed; inset: 0; z-index: 1040; border: 0; background: rgba(15,23,42,.5); }
        .customer-storefront-offcanvas { z-index: 1045; width: min(100%, 420px) !important; transition: transform .3s ease-in-out, visibility .3s ease-in-out; }
        @media (max-width: 575.98px) {
          .customer-storefront-header-content { flex-wrap: wrap; }
          .customer-storefront-greeting { order: 3; flex-basis: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .customer-storefront-card, .customer-storefront-offcanvas { transition: none; }
        }
      `}</style>

      <header className="customer-storefront-header border-bottom shadow-sm">
        <div className="container-fluid px-3 px-lg-5 py-3">
          <div className="customer-storefront-header-content d-flex align-items-center justify-content-between gap-3">
            <a href="#" className="d-flex align-items-center gap-2 text-decoration-none text-dark">
              <span className="customer-storefront-mark"><ShoppingBag size={21} /></span>
              <span className="fw-bold fs-5">Sales Monitor Store</span>
            </a>
            <div className="customer-storefront-greeting d-flex align-items-center gap-3">
              <span className="text-secondary">Welcome, <strong className="text-dark">{user.name}</strong></span>
              <button type="button" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={onLogout}>
                <LogOut size={16} /> Logout
              </button>
              <button
                type="button"
                className="btn btn-primary position-relative rounded-circle d-grid align-items-center justify-content-center"
                style={{ width: 42, height: 42 }}
                aria-label={`Open cart, ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'items'}`}
                aria-expanded={isCartOpen}
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart size={19} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {cartItemCount}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {message && (
        <div className="toast show position-fixed top-0 start-50 translate-middle-x mt-3" role="status" aria-live="polite" style={{ zIndex: 1060 }}>
          <div className="toast-header">
            <span className="rounded-circle bg-success me-2" style={{ width: 10, height: 10 }} />
            <strong className="me-auto">Sales Monitor Store</strong>
            <button type="button" className="btn-close" aria-label="Dismiss" onClick={() => setMessage('')} />
          </div>
          <div className="toast-body d-flex align-items-center gap-2"><Check size={17} className="text-success" />Item added!</div>
        </div>
      )}

      <main className="container py-4 py-lg-5">
        <section className="rounded-4 p-4 p-lg-5 mb-4 mb-lg-5 text-white shadow-sm" style={{ background: 'linear-gradient(120deg,#4338ca,#6366f1 60%,#818cf8)' }}>
          <p className="text-uppercase small fw-semibold opacity-75 mb-2">Welcome to our store</p>
          <h1 className="display-6 fw-bold mb-2">Find something you’ll love.</h1>
          <p className="mb-0 opacity-75">Browse our products and add your favorites to the cart.</p>
        </section>

        {loadError && <div className="alert alert-danger" role="alert">{loadError}</div>}

        <div className="d-flex align-items-end justify-content-between mb-3 mb-lg-4">
          <div>
            <p className="text-primary text-uppercase small fw-bold mb-1">Our collection</p>
            <h2 className="h3 fw-bold mb-0">Discover products</h2>
          </div>
          {!loading && <span className="small text-secondary">{products.length} {products.length === 1 ? 'product' : 'products'}</span>}
        </div>

        {loading ? (
          <div className="text-center py-5" role="status">
            <span className="spinner-border text-primary" aria-hidden="true" />
            <p className="text-secondary mt-3 mb-0">Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="row g-3 g-lg-4">
            {products.map(product => {
              const inCart = cart.find(item => String(item.id) === String(product.id));
              const available = Number(product.stock_quantity) > (inCart?.quantity || 0);
              return (
                <div className="col-12 col-sm-6 col-lg-4 col-xl-3" key={product.id}>
                  <article className="card customer-storefront-card rounded-4 shadow-sm border-0 h-100 overflow-hidden">
                    <div className="customer-storefront-image">
                      <Package size={64} strokeWidth={1.4} aria-hidden="true" />
                    </div>
                    <div className="card-body p-3 p-lg-4 d-flex flex-column">
                      <h3 className="h5 fw-bold mb-2">{product.name}</h3>
                      <p className="small text-secondary mb-3 flex-grow-1">{product.description || 'A great addition to your everyday essentials.'}</p>
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                        <span className="fs-4 fw-bold text-primary">{money(product.price)}</span>
                        <span className={`small ${available ? 'text-secondary' : 'text-danger'}`}>
                          {available ? `${Number(product.stock_quantity) - (inCart?.quantity || 0)} in stock` : 'Out of stock'}
                        </span>
                      </div>
                      <button type="button" className="btn btn-primary w-100" disabled={!available} onClick={() => addToCart(product)}>
                        <ShoppingCart size={17} className="me-2" />Add to Cart
                      </button>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        ) : !loadError ? (
          <div className="text-center rounded-4 bg-white p-5 shadow-sm">
            <Package size={36} className="text-secondary mb-3" />
            <h3 className="h5 fw-bold">No products available</h3>
            <p className="text-secondary mb-0">Please check back soon.</p>
          </div>
        ) : null}
      </main>

      {isCartOpen && (
        <button type="button" className="customer-storefront-backdrop" aria-label="Close cart" onClick={() => setIsCartOpen(false)} />
      )}
      <aside
        className={`offcanvas offcanvas-end customer-storefront-offcanvas ${isCartOpen ? 'show' : ''}`}
        tabIndex="-1"
        role="dialog"
        aria-modal={isCartOpen}
        aria-hidden={!isCartOpen}
        aria-labelledby="customer-cart-title"
        style={{ visibility: isCartOpen ? 'visible' : 'hidden' }}
      >
        <div className="offcanvas-header border-bottom px-4 py-3">
          <div>
            <h2 className="offcanvas-title h5 fw-bold mb-1" id="customer-cart-title">Your cart</h2>
            <p className="small text-secondary mb-0">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</p>
          </div>
          <button type="button" className="btn-close" aria-label="Close cart" onClick={() => setIsCartOpen(false)} />
        </div>
        <div className="offcanvas-body d-flex flex-column p-4">
          {!cart.length ? (
            <div className="text-center my-auto">
              <ShoppingBag size={42} className="text-secondary mb-3" />
              <h3 className="h6 fw-bold">Your cart is empty</h3>
              <p className="small text-secondary">Add products to get started.</p>
              <button type="button" className="btn btn-primary" onClick={() => setIsCartOpen(false)}>Continue shopping</button>
            </div>
          ) : (
            <>
              <div className="flex-grow-1 overflow-auto">
                {cart.map(item => (
                  <div className="d-flex align-items-center gap-3 py-3 border-bottom" key={item.id}>
                    <div className="rounded-3 d-grid align-items-center justify-content-center flex-shrink-0" style={{ width: 48, height: 48, background: '#eef2ff', color: '#4338ca' }}>
                      <Package size={22} />
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <p className="fw-semibold mb-1 text-truncate">{item.name}</p>
                      <p className="small text-primary fw-semibold mb-2">{money(item.price)}</p>
                      <div className="d-flex align-items-center gap-2">
                        <button type="button" className="btn btn-sm btn-outline-secondary py-1 px-2" aria-label={`Decrease ${item.name} quantity`} onClick={() => updateQuantity(item.id, -1)}>
                          <Minus size={13} />
                        </button>
                        <span className="small fw-semibold" aria-label={`Quantity ${item.quantity}`}>{item.quantity}</span>
                        <button type="button" className="btn btn-sm btn-outline-secondary py-1 px-2" aria-label={`Increase ${item.name} quantity`} disabled={item.quantity >= Number(item.stock_quantity)} onClick={() => updateQuantity(item.id, 1)}>
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="text-end">
                      <strong className="small d-block mb-2">{money(Number(item.price) * item.quantity)}</strong>
                      <button type="button" className="btn btn-sm btn-link text-danger p-0" aria-label={`Remove ${item.name}`} onClick={() => removeFromCart(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-top pt-3 mt-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary">Total</span>
                  <strong className="fs-5">{money(cartTotal)}</strong>
                </div>
                <button type="button" className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2" disabled={checkingOut} onClick={handleCheckout}>
                  {checkingOut ? <><span className="spinner-border spinner-border-sm" aria-hidden="true" />Processing...</> : <><ShoppingBag size={18} />Checkout Now</>}
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
