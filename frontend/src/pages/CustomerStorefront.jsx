import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, LoaderCircle, LogOut, Minus, Plus, ShoppingBag, ShoppingCart, Store, Trash2, X } from 'lucide-react';
import { api, money } from '../api.js';

export function CustomerStorefront({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');

  useEffect(() => {
    let active = true;
    api('/products')
      .then(result => {
        if (active) setProducts(result);
      })
      .catch(error => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!cartOpen) return undefined;
    function closeOnEscape(event) {
      if (event.key === 'Escape') setCartOpen(false);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [cartOpen]);

  const itemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const total = useMemo(() => cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0), [cart]);

  function addToCart(product) {
    setOrderError('');
    setOrderSuccess('');
    setCart(current => {
      const existing = current.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= Number(product.stock_quantity)) return current;
        return current.map(item => item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item);
      }
      return Number(product.stock_quantity) > 0 ? [...current, { product, quantity: 1 }] : current;
    });
  }

  function updateQuantity(productId, delta) {
    setCart(current => current.flatMap(item => {
      if (item.product.id !== productId) return [item];
      const quantity = Math.min(Number(item.product.stock_quantity), item.quantity + delta);
      return quantity > 0 ? [{ ...item, quantity }] : [];
    }));
  }

  async function placeOrder() {
    setOrdering(true);
    setOrderError('');
    setOrderSuccess('');
    try {
      const result = await api('/customer/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(item => ({ product_id: item.product.id, quantity: item.quantity }))
        })
      });
      setCart([]);
      setCartOpen(false);
      setOrderSuccess(`Order #${result.id} placed successfully.`);
    } catch (error) {
      setOrderError(error.message);
    } finally {
      setOrdering(false);
    }
  }

  return <main className="storefront">
    <header className="storefront-header">
      <a className="storefront-brand" href="#store" aria-label="Sales Monitor Store home">
        <span className="storefront-brand-icon"><Store size={20} /></span>
        <span>Sales Monitor<span className="storefront-brand-subtitle">THE CUSTOMER STORE</span></span>
      </a>
      <div className="storefront-header-actions">
        <span className="storefront-greeting">Hello, {user.name}</span>
        <button className="storefront-cart-button" type="button" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${itemCount} items`}>
          <ShoppingCart size={19} />
          <span>Cart</span>
          <span className="storefront-cart-badge">{itemCount}</span>
        </button>
        <button className="storefront-logout" type="button" onClick={onLogout}>
          <LogOut size={17} /><span>Logout</span>
        </button>
      </div>
    </header>

    <section className="storefront-hero" id="store">
      <div>
        <p className="storefront-eyebrow">WELCOME TO YOUR STORE</p>
        <h1>Find your next favorite.</h1>
        <p>Browse our collection and place your order in just a few clicks.</p>
      </div>
      <div className="storefront-hero-mark"><ShoppingBag size={34} strokeWidth={1.4} /></div>
    </section>

    {orderSuccess && <div className="storefront-alert success" role="status"><Check size={18} />{orderSuccess}</div>}
    {loadError && <div className="storefront-alert error" role="alert">{loadError}</div>}

    <section className="storefront-catalog" aria-labelledby="storefront-products-title">
      <div className="storefront-section-heading">
        <div>
          <p className="storefront-eyebrow">CURATED FOR YOU</p>
          <h2 id="storefront-products-title">Shop products</h2>
        </div>
        {!loading && !loadError && <span>{products.length} {products.length === 1 ? 'product' : 'products'}</span>}
      </div>

      {loading ? <div className="storefront-state"><LoaderCircle className="storefront-spin" size={24} />Loading products…</div>
        : loadError ? <div className="storefront-state">We couldn’t load the catalog. Please refresh to try again.</div>
          : products.length === 0 ? <div className="storefront-state">There are no products available right now.</div>
            : <div className="storefront-product-grid">
              {products.map((product, index) => {
                const stock = Number(product.stock_quantity);
                const inCart = cart.find(item => item.product.id === product.id)?.quantity || 0;
                const unavailable = stock <= 0;
                return <article className="storefront-product-card" key={product.id}>
                  <div className={`storefront-product-art art-${index % 5}`}>
                    <span className="storefront-art-icon"><ShoppingBag size={32} strokeWidth={1.35} /></span>
                    {unavailable && <span className="storefront-stock-tag">Sold out</span>}
                  </div>
                  <div className="storefront-product-info">
                    <h3>{product.name}</h3>
                    {product.description && <p>{product.description}</p>}
                    <div className="storefront-product-bottom">
                      <div><strong>{money(product.price)}</strong><small>{unavailable ? 'Out of stock' : `${stock} available`}</small></div>
                      <button type="button" className="storefront-add-button" disabled={unavailable || inCart >= stock} onClick={() => addToCart(product)}>
                        <Plus size={16} />{inCart ? `Add more (${inCart})` : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </article>;
              })}
            </div>}
    </section>

    {cartOpen && <>
      <button className="storefront-cart-backdrop" type="button" aria-label="Close cart" onClick={() => setCartOpen(false)} />
      <aside className="storefront-cart-panel" role="dialog" aria-modal="true" aria-labelledby="storefront-cart-title">
        <div className="storefront-cart-header">
          <div><p className="storefront-eyebrow">YOUR SELECTION</p><h2 id="storefront-cart-title">Shopping cart <span>({itemCount})</span></h2></div>
          <button className="storefront-close-button" type="button" aria-label="Close cart" onClick={() => setCartOpen(false)}><X size={20} /></button>
        </div>
        <div className="storefront-cart-items">
          {cart.length === 0 ? <div className="storefront-cart-empty"><ShoppingBag size={32} /><strong>Your cart is empty</strong><span>Browse the catalog to add something you love.</span><button type="button" onClick={() => setCartOpen(false)}>Explore products <ArrowRight size={15} /></button></div>
            : cart.map(item => <div className="storefront-cart-item" key={item.product.id}>
              <div className="storefront-cart-item-art"><ShoppingBag size={20} /></div>
              <div className="storefront-cart-item-main">
                <strong>{item.product.name}</strong>
                <span>{money(item.product.price)}</span>
                <div className="storefront-quantity">
                  <button type="button" aria-label={`Decrease ${item.product.name} quantity`} onClick={() => updateQuantity(item.product.id, -1)}><Minus size={13} /></button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label={`Increase ${item.product.name} quantity`} disabled={item.quantity >= Number(item.product.stock_quantity)} onClick={() => updateQuantity(item.product.id, 1)}><Plus size={13} /></button>
                </div>
              </div>
              <button className="storefront-remove-button" type="button" aria-label={`Remove ${item.product.name}`} onClick={() => setCart(current => current.filter(entry => entry.product.id !== item.product.id))}><Trash2 size={17} /></button>
            </div>)}
        </div>
        {cart.length > 0 && <div className="storefront-cart-footer">
          {orderError && <div className="storefront-alert error" role="alert">{orderError}</div>}
          <div className="storefront-total"><span>Total</span><strong>{money(total)}</strong></div>
          <button className="storefront-checkout-button" type="button" disabled={ordering} onClick={placeOrder}>
            {ordering ? <><LoaderCircle className="storefront-spin" size={17} /> Placing order…</> : <>Place Order <ArrowRight size={17} /></>}
          </button>
          <small>Inventory and order total are verified at checkout.</small>
        </div>}
      </aside>
    </>}
  </main>;
}
