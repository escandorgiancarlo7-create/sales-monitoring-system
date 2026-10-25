import React, { useState, useEffect } from 'react';
import { ShoppingCart, LogOut, Plus, Minus, Trash2, ShoppingBag, Package, X } from 'lucide-react';
import { api, money } from '../api.js';

export default function CustomerStorefront({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/products')
      .then(data => setProducts(data))
      .catch(err => console.error("Failed to load products:", err))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setMessage(`${product.name} added to cart!`);
    setTimeout(() => setMessage(''), 2000);
  };

  const updateQuantity = (id, change) => {
    setCart((prev) => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + change;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      const items = cart.map(item => ({ product_id: item.id, quantity: item.quantity }));
      await api('/customer/checkout', {
        method: 'POST',
        body: JSON.stringify({ items })
      });
      alert('Order placed successfully! Thank you for shopping.');
      setCart([]);
      setIsCartOpen(false);
    } catch (error) {
      alert(`Checkout failed: ${error.message}`);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Toast Message */}
      {message && (
        <div className="position-fixed top-0 start-50 translate-middle-x mt-3 px-4 py-2 bg-success text-white rounded-pill shadow-lg" style={{ zIndex: 1050 }}>
          {message}
        </div>
      )}

      {/* Modern Header */}
      <header className="bg-white border-bottom sticky-top px-4 py-3 shadow-sm d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
            <ShoppingBag size={20} />
          </div>
          <h4 className="m-0 fw-bold text-dark">Sales Monitor Store</h4>
        </div>
        
        <div className="d-flex align-items-center gap-4">
          <span className="text-secondary d-none d-md-block">Welcome, <strong>{user.name}</strong></span>
          
          <button 
            className="btn btn-light position-relative border shadow-sm d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart size={18} />
            <span className="fw-semibold">Cart</span>
            {cartItemCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {cartItemCount}
              </span>
            )}
          </button>

          <button className="btn btn-outline-danger d-flex align-items-center gap-2 rounded-pill px-3" onClick={onLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-5">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h2 className="fw-bold mb-1">Discover Products</h2>
            <p className="text-secondary m-0">Explore our latest Chu Chu Beauty collection.</p>
          </div>
        </div>

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : (
          <div className="row g-4">
            {products.map(p => (
              <div className="col-12 col-md-6 col-lg-4" key={p.id}>
                <div className="card h-100 border-0 shadow-sm rounded-4 product-card">
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="bg-light rounded-3 d-flex align-items-center justify-content-center mb-3" style={{ height: '180px' }}>
                      <Package size={64} className="text-secondary opacity-50" />
                    </div>
                    <h5 className="fw-bold mb-1">{p.name}</h5>
                    <p className="text-secondary small mb-3 flex-grow-1">{p.description || 'No description available.'}</p>
                    <div className="d-flex justify-content-between align-items-center mt-auto">
                      <h4 className="text-primary fw-bold m-0">{money(p.price)}</h4>
                      <button 
                        className="btn btn-primary px-4 rounded-pill shadow-sm"
                        onClick={() => addToCart(p)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart Sidebar (Offcanvas) */}
      <div className={`offcanvas offcanvas-end ${isCartOpen ? 'show' : ''}`} tabIndex="-1" style={{ visibility: isCartOpen ? 'visible' : 'hidden', width: '400px' }}>
        <div className="offcanvas-header bg-light border-bottom">
          <h5 className="offcanvas-title fw-bold d-flex align-items-center gap-2">
            <ShoppingCart size={20} /> Your Cart ({cartItemCount})
          </h5>
          <button type="button" className="btn-close" onClick={() => setIsCartOpen(false)}></button>
        </div>
        <div className="offcanvas-body p-0 d-flex flex-column">
          <div className="flex-grow-1 overflow-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center text-secondary mt-5">
                <ShoppingCart size={48} className="mb-3 opacity-50" />
                <p>Your cart is empty.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {cart.map(item => (
                  <div key={item.id} className="d-flex align-items-center gap-3 border-bottom pb-3">
                    <div className="bg-light rounded p-2 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                      <Package size={24} className="text-secondary" />
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-bold">{item.name}</h6>
                      <div className="text-primary fw-semibold">{money(item.price)}</div>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-2">
                      <div className="input-group input-group-sm" style={{ width: '100px' }}>
                        <button className="btn btn-outline-secondary" onClick={() => updateQuantity(item.id, -1)}><Minus size={12}/></button>
                        <input type="text" className="form-control text-center" value={item.quantity} readOnly />
                        <button className="btn btn-outline-secondary" onClick={() => updateQuantity(item.id, 1)}><Plus size={12}/></button>
                      </div>
                      <button className="btn btn-link text-danger p-0 text-decoration-none" onClick={() => removeFromCart(item.id)}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {cart.length > 0 && (
            <div className="border-top p-4 bg-light">
              <div className="d-flex justify-content-between mb-3">
                <span className="text-secondary">Total</span>
                <h4 className="fw-bold text-primary mb-0">{money(cartTotal)}</h4>
              </div>
              <button 
                className="btn btn-primary w-100 py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                {checkingOut ? 'Processing...' : 'Checkout Now'}
              </button>
            </div>
          )}
        </div>
      </div>
      {isCartOpen && <div className="offcanvas-backdrop fade show" onClick={() => setIsCartOpen(false)}></div>}
    </div>
  );
}