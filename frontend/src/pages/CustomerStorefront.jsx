import React, { useState, useEffect } from 'react';
import {
  ArrowRight, Check, CheckCircle2, ChevronRight, LogOut, Menu, Minus, Moon,
  Package, Plus, ShoppingCart, Sun, Trash2, X
} from 'lucide-react';
import { api, money } from '../api.js';

const productImagePaths = {
  'Chu Chu Beauty Heart Blush Duo': '/images/heart-blush-duo.png',
  'Chu Chu Beauty Heart Paint (Liquid Blush)': '/images/heart-paint.png',
  'Chu Chu Beauty Heart Brontour Duo': '/images/heart-brontour-duo.png',
  'Chu Chu Beauty Liquid Concealer': '/images/liquid-concealer.png',
  'Chu Chu Beauty Lip Syrup': '/images/lip-syrup.png',
  'Chu Chu Beauty Loose Powder': '/images/loose-powder.png',
  'Chu Chu Heart Cloud Puff': '/images/heart-cloud-puff.png',
  'Chu Chu Beauty Eyeshadow Palette': '/images/eyeshadow-palette.png',
  'Chu Chu Beauty Jelly Highlighter': '/images/jelly-highlighter.png',
  'Chu Chu Beauty Setting Spray': '/images/setting-spray.png'
};

const storefrontStyles = `
  .customer-storefront {
    --store-bg: #24171c;
    --store-panel: #342229;
    --store-panel-raised: #483039;
    --store-border: #563943;
    --store-text: #f6e9ec;
    --store-muted: #c3aab0;
    --store-accent: #d47a8a;
    min-height: 100vh;
    color: var(--store-text);
    background: var(--store-bg);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .customer-storefront.theme-light {
    --store-bg: #fdf8f9;
    --store-panel: #fff;
    --store-panel-raised: #fbf0f2;
    --store-border: #f0e2e5;
    --store-text: #3d2229;
    --store-muted: #987d84;
  }
  .customer-storefront * { box-sizing: border-box; }
  .store-layout { min-height: 100vh; }
  .store-sidebar {
    position: fixed; inset: 0 auto 0 0; z-index: 20; width: 250px;
    flex-direction: column; padding: 24px 16px 18px;
    background: var(--store-panel); border-right: 1px solid var(--store-border);
  }
  .store-brand { display: flex; align-items: center; gap: 1rem; padding: 0 9px 34px; color: var(--store-text); }
  .store-brand-mark {
    width: 40px; height: 40px; display: grid; place-items: center; flex: none;
    border-radius: 8px; background: white;
  }
  .store-brand-copy { min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  .store-brand strong { display: block; color: white; font-size: 14px; letter-spacing: -.35px; }
  .store-brand small { display: block; margin-top: 3px; color: #e7c2ca; font-size: 9px; font-weight: 700; letter-spacing: 1.2px; }
  .store-section-label { padding: 0 12px 10px; color: var(--store-muted); font-size: 9px; font-weight: 700; letter-spacing: 1.35px; }
  .store-nav-link {
    min-height: 42px; display: flex; align-items: center; gap: 11px; padding: 0 12px;
    border-radius: 10px; color: var(--store-muted); font-size: 12px; font-weight: 600; text-decoration: none;
  }
  .store-nav-link.active { color: white; background: linear-gradient(105deg,#bd6678,#d47a8a); box-shadow: 0 6px 18px rgba(212,122,138,.24); }
  .store-nav-icon { width: 29px; height: 29px; display: grid; place-items: center; border-radius: 8px; }
  .store-nav-link.active .store-nav-icon { background: rgba(255,255,255,.15); }
  .store-sidebar-bottom { margin-top: auto; padding: 16px 4px 0; border-top: 1px solid var(--store-border); }
  .store-profile { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .store-avatar {
    width: 35px; height: 35px; display: grid; place-items: center; flex: none;
    border-radius: 50%; color: #f6d8de; background: rgba(212,122,138,.2); font-size: 11px; font-weight: 800;
  }
  .store-profile-copy { min-width: 0; flex: 1; }
  .store-profile-copy strong,.store-profile-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .store-profile-copy strong { color: var(--store-text); font-size: 11px; }
  .store-profile-copy small { margin-top: 3px; color: var(--store-muted); font-size: 10px; text-transform: capitalize; }
  .store-logout {
    width: 100%; min-height: 37px; display: flex; align-items: center; gap: 9px; margin-top: 13px;
    padding: 0 10px; border: 1px solid var(--store-border); border-radius: 9px;
    color: var(--store-muted); background: transparent; font-size: 11px; font-weight: 600; cursor: pointer;
  }
  .store-logout:hover { color: #a95366; border-color: #dca0ab; background: rgba(212,122,138,.12); }
  .store-main { min-height: 100vh; margin-left: 250px; }
  .store-topbar {
    min-height: 68px; position: sticky; top: 0; z-index: 15; display: flex; align-items: center;
    justify-content: space-between; gap: 18px; padding: 10px 36px;
    background: color-mix(in srgb, var(--store-bg) 88%, transparent); border-bottom: 1px solid var(--store-border);
    backdrop-filter: blur(16px);
  }
  .store-mobile-brand { flex-shrink: 0; color: var(--store-text); font-size: 13px; font-weight: 700; }
  .store-mobile-logo-badge { display: grid; flex-shrink: 0; place-items: center; padding: 3px 6px; border-radius: 8px; background: #fff; }
  .store-mobile-logo-badge img { display: block; max-width: 90px; }
  .store-breadcrumb { display: flex; align-items: center; gap: 8px; color: var(--store-muted); font-size: 11px; }
  .store-breadcrumb strong { color: var(--store-text); font-weight: 600; }
  .store-topbar-actions { display: flex; align-items: center; gap: 10px; }
  .store-icon-button,.store-cart-button {
    height: 38px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    border: 1px solid var(--store-border); border-radius: 10px; color: var(--store-text);
    background: var(--store-panel); cursor: pointer;
  }
  .store-icon-button { width: 38px; }
  .store-cart-button { position: relative; padding: 0 13px; font-size: 11px; font-weight: 700; }
  .store-cart-button:hover,.store-icon-button:hover { border-color: #d47a8a; background: var(--store-panel-raised); }
  .store-mobile-menu {
    position: absolute; top: calc(100% + 8px); right: 12px; z-index: 25;
    min-width: 190px; display: grid; gap: 5px; padding: 8px;
    border: 1px solid var(--store-border); border-radius: 12px;
    background: var(--store-panel); box-shadow: 0 12px 30px rgba(0,0,0,.3);
  }
  .store-mobile-menu button,.store-mobile-menu a {
    width: 100%; display: flex; align-items: center; gap: 9px; padding: 10px;
    border: 0; border-radius: 8px; color: var(--store-text); background: transparent;
    font: inherit; font-size: 12px; text-align: left; text-decoration: none; cursor: pointer;
  }
  .store-mobile-menu button:hover,.store-mobile-menu a:hover { background: var(--store-panel-raised); }
  .store-cart-badge {
    min-width: 19px; height: 19px; display: grid; place-items: center; margin-left: 2px;
    padding: 0 5px; border-radius: 20px; color: white; background: #ef4444; font-size: 9px; font-weight: 800;
    box-shadow: 0 0 12px rgba(239,68,68,.45);
  }
  .store-content { max-width: 1500px; margin: 0 auto; padding: 34px 36px 52px; }
  .store-welcome {
    position: relative; display: flex; align-items: center; justify-content: space-between; gap: 20px;
    min-height: 172px; margin-bottom: 34px; padding: 30px 34px; overflow: hidden;
    border: 1px solid rgba(248,218,224,.3); border-radius: 20px;
    background: radial-gradient(circle at 85% 20%,rgba(255,225,230,.2),transparent 30%),linear-gradient(115deg,#9f4c60,#bd6678 60%,#d47a8a);
  }
  .store-welcome::after { position: absolute; right: 80px; width: 180px; height: 180px; border: 1px solid rgba(255,255,255,.2); border-radius: 50%; content: ""; }
  .store-welcome-copy { position: relative; z-index: 1; }
  .store-eyebrow { margin: 0 0 9px; color: #f8d8de; font-size: 9px; font-weight: 800; letter-spacing: 1.5px; }
  .store-welcome h1 { margin: 0; color: white; font-size: clamp(24px,3vw,34px); font-weight: 750; letter-spacing: -1.1px; }
  .store-welcome p:last-child { margin: 8px 0 0; color: #fff0f2; font-size: 12px; }
  .store-welcome-icon { position: relative; z-index: 1; width: 70px; height: 70px; display: grid; place-items: center; flex: none; border: 1px solid rgba(255,255,255,.2); border-radius: 20px; color: #e0e7ff; background: rgba(255,255,255,.09); }
  .store-section-heading { display: flex; justify-content: space-between; align-items: end; gap: 16px; margin-bottom: 18px; }
  .store-section-heading h2 { margin: 0; color: var(--store-text); font-size: 19px; font-weight: 700; letter-spacing: -.45px; }
  .store-section-heading p { margin: 5px 0 0; color: var(--store-muted); font-size: 11px; }
  .store-product-card {
    min-width: 0; height: 100%; overflow: hidden; border: 1px solid var(--store-border); border-radius: 16px;
    background: var(--store-panel); box-shadow: 0 8px 26px rgba(2,6,23,.15); transition: transform .18s,border-color .18s,box-shadow .18s;
  }
  .store-product-card:hover { transform: translateY(-3px); border-color: #4f46e5; box-shadow: 0 12px 30px rgba(2,6,23,.25); }
  .store-product-art { height: 200px; overflow: hidden; display: grid; place-items: center; color: #f1b5c0; background: #fff; }
  .store-product-art > span { width: 76px; height: 76px; display: grid; place-items: center; border: 1px solid rgba(248,218,224,.4); border-radius: 22px; background: rgba(212,122,138,.16); box-shadow: 0 10px 25px rgba(212,122,138,.16); }
  .store-product-info { display: flex; flex-direction: column; }
  .store-product-info h3 { min-height: 38px; margin: 0; color: var(--store-text); font-size: 13px; font-weight: 700; line-height: 1.5; }
  .store-product-description { min-height: 36px; margin: 6px 0 0; color: var(--store-muted); font-size: 10px; line-height: 1.6; }
  .store-product-bottom { display: flex; align-items: center; justify-content: space-between; gap: 9px; margin-top: auto; padding-top: 16px; }
  .store-product-price { color: #f1b5c0; font-size: 16px; font-weight: 800; letter-spacing: -.3px; white-space: nowrap; }
  .theme-light .store-product-price { color: #a95366; }
  .store-add-button,.store-checkout-button {
    display: inline-flex; align-items: center; justify-content: center; gap: 7px; border: 0;
    color: white; background: linear-gradient(105deg,#bd6678,#d47a8a); font-weight: 700; cursor: pointer;
    box-shadow: 0 5px 16px rgba(212,122,138,.25);
  }
  .store-add-button { min-height: 35px; padding: 0 11px; border-radius: 9px; font-size: 10px; white-space: nowrap; }
  .store-add-button:hover,.store-checkout-button:hover:not(:disabled) { background: linear-gradient(105deg,#a95366,#bd6678); box-shadow: 0 0 20px rgba(212,122,138,.38); }
  .store-add-button:disabled { cursor: not-allowed; opacity: .45; }
  .store-state { min-height: 190px; display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--store-muted); font-size: 12px; }
  .store-state .spinner-border { width: 20px; height: 20px; color: #d47a8a; }
  .store-toast { position: fixed; top: 82px; right: 28px; z-index: 60; display: flex; align-items: center; gap: 9px; padding: 11px 15px; border: 1px solid #166534; border-radius: 11px; color: #bbf7d0; background: #14532d; box-shadow: 0 10px 30px rgba(0,0,0,.25); font-size: 11px; }
  .store-checkout-error { margin: 14px 23px 0; padding: 11px 13px; border: 1px solid rgba(248,113,113,.3); border-radius: 9px; color: #fecaca; background: rgba(127,29,29,.25); font-size: 11px; line-height: 1.5; }
  .store-success-icon { width: 62px; height: 62px; display: grid; place-items: center; margin: 0 auto 4px; border: 1px solid rgba(74,222,128,.25); border-radius: 50%; color: #4ade80; background: rgba(34,197,94,.14); box-shadow: 0 0 26px rgba(34,197,94,.12); }
  .store-success-modal .modal-body { color: var(--store-text); }
  .store-backdrop { position: fixed; inset: 0; z-index: 50; border: 0; background: rgba(2,6,23,.7); backdrop-filter: blur(3px); }
  .store-cart-panel {
    position: fixed; inset: 0 0 0 auto; z-index: 51; width: min(440px,100%); display: flex; flex-direction: column;
    color: var(--store-text); background: var(--store-panel); border-left: 1px solid var(--store-border);
    box-shadow: -18px 0 50px rgba(0,0,0,.35); animation: store-slide-in .2s ease-out;
  }
  @keyframes store-slide-in { from { transform: translateX(24px); opacity: .7; } to { transform: translateX(0); opacity: 1; } }
  .store-cart-header { display: flex; align-items: center; justify-content: space-between; padding: 22px 23px; border-bottom: 1px solid var(--store-border); }
  .store-cart-title { display: flex; align-items: center; gap: 10px; }
  .store-cart-title > span { width: 35px; height: 35px; display: grid; place-items: center; border-radius: 10px; color: #f1b5c0; background: rgba(212,122,138,.17); }
  .store-cart-title h2 { margin: 0; color: var(--store-text); font-size: 15px; font-weight: 700; }
  .store-cart-title p { margin: 3px 0 0; color: var(--store-muted); font-size: 10px; }
  .store-close-button { width: 35px; height: 35px; display: grid; place-items: center; border: 1px solid var(--store-border); border-radius: 9px; color: var(--store-muted); background: var(--store-panel-raised); cursor: pointer; }
  .store-cart-items { flex: 1; overflow-y: auto; padding: 0 23px; }
  .store-cart-item { display: flex; align-items: flex-start; gap: 12px; padding: 17px 0; border-bottom: 1px solid var(--store-border); }
  .store-cart-item-art { width: 46px; height: 46px; display: grid; place-items: center; flex: none; border-radius: 11px; color: #f1b5c0; background: rgba(212,122,138,.16); }
  .store-cart-item-main { min-width: 0; flex: 1; }
  .store-cart-item-main strong { display: block; color: var(--store-text); font-size: 11px; line-height: 1.5; }
  .store-cart-item-main > span { display: block; margin-top: 4px; color: #d47a8a; font-size: 11px; font-weight: 700; }
  .store-quantity { display: flex; align-items: center; gap: 10px; margin-top: 9px; color: var(--store-text); font-size: 11px; }
  .store-quantity button { width: 23px; height: 23px; display: grid; place-items: center; border: 1px solid var(--store-border); border-radius: 6px; color: var(--store-text); background: var(--store-panel-raised); cursor: pointer; }
  .store-remove-button { padding: 6px; border: 0; border-radius: 7px; color: var(--store-muted); background: transparent; cursor: pointer; }
  .store-remove-button:hover { color: #fca5a5; background: rgba(127,29,29,.2); }
  .store-cart-empty { min-height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; color: var(--store-muted); text-align: center; }
  .store-cart-empty strong { color: var(--store-text); font-size: 13px; }
  .store-cart-empty span { max-width: 240px; font-size: 10px; line-height: 1.6; }
  .store-cart-empty button { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; padding: 8px 11px; border: 1px solid var(--store-border); border-radius: 8px; color: #bd6678; background: var(--store-panel-raised); font-size: 10px; font-weight: 700; cursor: pointer; }
  .store-cart-footer { padding: 19px 23px 23px; border-top: 1px solid var(--store-border); }
  .store-total { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; color: var(--store-muted); font-size: 11px; }
  .store-total strong { color: var(--store-text); font-size: 19px; font-weight: 800; }
  .store-checkout-button { width: 100%; min-height: 45px; border-radius: 10px; font-size: 11px; }
  .store-checkout-button:disabled { opacity: .65; cursor: wait; }
  .store-cart-footer > small { display: block; margin-top: 10px; color: var(--store-muted); font-size: 9px; text-align: center; }
  @media (max-width: 767.98px) {
    .store-main { margin-left: 0; }
    .store-topbar { padding: 9px 16px; }
    .store-topbar-actions { gap: 7px; }
    .store-icon-button,.store-cart-button { height: 36px; }
    .store-icon-button { width: 36px; }
    .store-cart-button { gap: 5px; padding: 0 9px; }
    .store-content { padding-top: 22px; padding-bottom: 36px; }
    .store-welcome { min-height: 145px; margin-bottom: 26px; padding: 22px 20px; border-radius: 15px; }
    .store-welcome-icon { width: 50px; height: 50px; border-radius: 15px; }
    .store-welcome-icon svg { width: 25px; }
    .store-welcome h1 { font-size: 24px; }
    .store-welcome p:last-child { max-width: 250px; font-size: 11px; line-height: 1.5; }
    .store-product-bottom { flex-wrap: wrap; }
  }
  @media (max-width: 400px) {
    .store-topbar { gap: 8px; padding-right: 10px; padding-left: 10px; }
    .store-mobile-brand { font-size: 11px; }
    .store-topbar-actions { gap: 5px; }
    .store-cart-button > span:not(.store-cart-badge) { display: none; }
    .store-welcome { padding: 20px 16px; }
    .store-welcome-icon { display: none; }
    .store-product-bottom { align-items: stretch; flex-direction: column; }
    .store-add-button { width: 100%; }
  }
`;

export default function CustomerStorefront({
  user,
  onLogout,
  theme = 'dark',
  onToggleTheme
}) {
  const [products, setProducts] = useState([]);
  const [failedProductImages, setFailedProductImages] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/products')
      .then(data => setProducts(data))
      .catch(err => console.error('Failed to load products:', err))
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
    setCheckoutError('');
    try {
      const items = cart.map(item => ({ product_id: item.id, quantity: item.quantity }));
      await api('/customer/checkout', {
        method: 'POST',
        body: JSON.stringify({ items })
      });
      setCart([]);
      setIsCartOpen(false);
      setCheckoutSuccess(true);
    } catch (error) {
      setCheckoutError(error.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const initials = String(user?.name || 'Customer')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`customer-storefront theme-${theme === 'light' ? 'light' : 'dark'}`}>
      <style>{storefrontStyles}</style>
      {message && (
        <div className="store-toast" role="status" aria-live="polite">
          <Check size={15} /> {message}
        </div>
      )}

      <div className="store-layout">
        <aside className="store-sidebar d-none d-md-flex">
          <div className="store-brand d-flex align-items-center gap-3">
            <span className="store-brand-mark">
              <img src="/logo.png" alt="GlowTrack" className="rounded bg-white p-1" style={{ height: '40px', width: '40px', objectFit: 'contain' }} />
            </span>
            <span className="store-brand-copy d-flex flex-column justify-content-center">
              <strong>GlowTrack</strong>
              <small>CUSTOMER PORTAL</small>
            </span>
          </div>

          <div className="store-section-label">WORKSPACE</div>
          <nav aria-label="Customer navigation">
            <a className="store-nav-link active" href="#storefront" aria-current="page">
              <span className="store-nav-icon"><Package size={17} /></span>
              <span className="store-nav-copy">Storefront</span>
            </a>
          </nav>

          <div className="store-sidebar-bottom">
            <div className="store-profile">
              <span className="store-avatar" aria-hidden="true">{initials}</span>
              <span className="store-profile-copy">
                <strong>{user?.name || 'Customer'}</strong>
                <small>Customer account</small>
              </span>
            </div>
            <button className="store-logout" type="button" onClick={() => setShowLogoutModal(true)}>
              <LogOut size={15} /> <span className="store-logout-copy">Log out</span>
            </button>
          </div>
        </aside>

        <div className="store-main" id="storefront">
          <header className="store-topbar d-flex flex-wrap justify-content-between align-items-center w-100">
            <div className="store-mobile-brand d-flex d-md-none align-items-center gap-2">
              <span className="store-mobile-logo-badge">
                <img src="/logo.png" alt="GlowTrack" className="rounded" style={{ height: '35px', width: 'auto' }} />
              </span>
              <span>GlowTrack</span>
            </div>
            <div className="d-none d-md-block" aria-label="Breadcrumb">
              <div className="store-breadcrumb">
                <span>Workspace</span><ChevronRight size={13} /><strong>Storefront</strong>
              </div>
            </div>
            <div className="store-topbar-actions">
              <button
                className="store-icon-button d-md-none"
                type="button"
                onClick={() => setIsMobileMenuOpen(open => !open)}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="store-mobile-menu"
              >
                {isMobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
              </button>
              {onToggleTheme && (
                <button
                  className="store-icon-button"
                  type="button"
                  onClick={onToggleTheme}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              )}
              <button
                className="store-cart-button"
                type="button"
                onClick={() => setIsCartOpen(true)}
                aria-label={`Open cart, ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'items'}`}
              >
                <ShoppingCart size={16} /><span>Cart</span>
                {cartItemCount > 0 && <span className="store-cart-badge">{cartItemCount}</span>}
              </button>
            </div>
            {isMobileMenuOpen && (
              <nav className="store-mobile-menu d-md-none" id="store-mobile-menu" aria-label="Mobile navigation">
                <a href="#storefront" onClick={() => setIsMobileMenuOpen(false)}>
                  <Package size={16} /> Storefront
                </a>
                <button type="button" onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsCartOpen(true);
                }}>
                  <ShoppingCart size={16} /> Open cart ({cartItemCount})
                </button>
                <button type="button" onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowLogoutModal(true);
                }}>
                  <LogOut size={16} /> Log out
                </button>
              </nav>
            )}
          </header>

          <main className="store-content px-3">
            <section className="store-welcome">
              <div className="store-welcome-copy">
                <p className="store-eyebrow">YOUR CUSTOMER PORTAL</p>
                <h1>Welcome, {user?.name?.split(' ')[0] || 'there'}</h1>
                <p>Discover products from our collection and shop with confidence.</p>
              </div>
              <div className="store-welcome-icon" aria-hidden="true"><ShoppingCart size={32} /></div>
            </section>

            <section aria-labelledby="store-products-heading">
              <div className="store-section-heading">
                <div>
                  <h2 id="store-products-heading">Discover Products</h2>
                  <p>Explore our latest collection.</p>
                </div>
                {!loading && <span className="store-breadcrumb">{products.length} products</span>}
              </div>

              {loading ? (
                <div className="store-state" role="status">
                  <span className="spinner-border" aria-hidden="true" /> Loading products…
                </div>
              ) : products.length === 0 ? (
                <div className="store-state">No products are available right now. Please check back soon.</div>
              ) : (
                <div className="row g-3">
                  {products.map(product => (
                    <div className="col-12 col-md-6 col-lg-4" key={product.id}>
                      <article className="store-product-card card h-100">
                        <div
                          className="store-product-art"
                          style={{ height: '220px', width: '100%', backgroundColor: '#ffffff', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {productImagePaths[product.name] && !failedProductImages.has(productImagePaths[product.name]) ? (
                            <img
                              src={productImagePaths[product.name]}
                              alt={product.name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={() => {
                                setFailedProductImages(current => new Set(current).add(productImagePaths[product.name]));
                              }}
                            />
                          ) : (
                            <span aria-hidden="true"><Package size={37} strokeWidth={1.5} /></span>
                          )}
                        </div>
                        <div className="store-product-info card-body d-flex flex-column p-3">
                          <h3>{product.name}</h3>
                          <p className="store-product-description">
                            {product.description || 'No description available.'}
                          </p>
                          <div className="store-product-bottom">
                            <strong className="store-product-price">{money(product.price)}</strong>
                            <button
                              className="store-add-button"
                              type="button"
                              onClick={() => addToCart(product)}
                            >
                              <Plus size={14} /> Add to Cart
                            </button>
                          </div>
                        </div>
                      </article>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {isCartOpen && (
        <>
          <button
            className="store-backdrop"
            type="button"
            aria-label="Close cart"
            onClick={() => setIsCartOpen(false)}
          />
          <aside className="store-cart-panel" role="dialog" aria-modal="true" aria-labelledby="store-cart-heading">
            <header className="store-cart-header">
              <div className="store-cart-title">
                <span><ShoppingCart size={17} /></span>
                <div>
                  <h2 id="store-cart-heading">Your Cart</h2>
                  <p>{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in your bag</p>
                </div>
              </div>
              <button
                className="store-close-button"
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Close cart"
              >
                <X size={17} />
              </button>
            </header>

            {checkoutError && (
              <div className="store-checkout-error" role="alert">
                {checkoutError}
              </div>
            )}

            <div className="store-cart-items">
              {cart.length === 0 ? (
                <div className="store-cart-empty">
                  <ShoppingCart size={36} />
                  <strong>Your cart is empty</strong>
                  <span>Add something you love and it will appear here.</span>
                  <button type="button" onClick={() => setIsCartOpen(false)}>
                    Continue shopping <ArrowRight size={13} />
                  </button>
                </div>
              ) : cart.map(item => (
                <div className="store-cart-item" key={item.id}>
                  <div className="store-cart-item-art"><Package size={21} /></div>
                  <div className="store-cart-item-main">
                    <strong>{item.name}</strong>
                    <span>{money(item.price)}</span>
                    <div className="store-quantity" aria-label={`Quantity: ${item.quantity}`}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        <Minus size={12} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <button
                    className="store-remove-button"
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <footer className="store-cart-footer">
                <div className="store-total">
                  <span>Order total</span>
                  <strong>{money(cartTotal)}</strong>
                </div>
                <button
                  className="store-checkout-button"
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkingOut}
                >
                  {checkingOut ? 'Processing…' : <>Proceed to Checkout <ChevronRight size={15} /></>}
                </button>
                <small>Secure checkout · Taxes calculated at checkout</small>
              </footer>
            )}
          </aside>
        </>
      )}

      {showLogoutModal && (
        <>
          <div className="modal-backdrop fade show" />
          <div
            className="modal fade show d-block"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-logout-title"
            aria-describedby="customer-logout-description"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div
                className="modal-content border-0 rounded-4 shadow-lg"
                style={{ backgroundColor: theme === 'dark' ? '#342229' : '#fff' }}
              >
                <div className="modal-header border-0 px-4 pt-4 pb-2">
                  <h2 className={`modal-title fs-5 fw-semibold ${theme === 'dark' ? 'text-white' : 'text-dark'}`} id="customer-logout-title">
                    Confirm Logout
                  </h2>
                </div>
                <div
                  className={`modal-body px-4 py-3 ${theme === 'dark' ? 'text-light' : 'text-dark'} opacity-75`}
                  id="customer-logout-description"
                >
                  Are you sure you want to log out?
                </div>
                <div className="modal-footer border-0 px-4 pb-4">
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setShowLogoutModal(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-danger" type="button" onClick={onLogout}>
                    Log out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {checkoutSuccess && (
        <>
          <div className="modal-backdrop fade show" />
          <div
            className="modal fade show d-block"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-success-title"
            aria-describedby="checkout-success-description"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div
                className={`modal-content border-0 rounded-4 shadow-lg store-success-modal ${theme === 'dark' ? 'text-white' : 'text-dark'}`}
                style={{ backgroundColor: theme === 'dark' ? '#342229' : '#fff' }}
              >
                <div className="modal-body px-4 pt-5 pb-4 text-center">
                  <div className="store-success-icon" aria-hidden="true">
                    <CheckCircle2 size={34} />
                  </div>
                  <h2 className={`modal-title fs-4 fw-semibold ${theme === 'dark' ? 'text-white' : 'text-dark'} mt-3`} id="checkout-success-title">
                    Order Successful!
                  </h2>
                  <p className="mb-0 mt-2" id="checkout-success-description">
                    Thank you for shopping! Your order has been placed.
                  </p>
                  <button
                    className="btn btn-primary rounded-pill px-4 mt-4"
                    type="button"
                    onClick={() => setCheckoutSuccess(false)}
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
