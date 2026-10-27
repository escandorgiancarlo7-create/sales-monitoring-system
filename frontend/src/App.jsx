import CustomerStorefront from './pages/CustomerStorefront.jsx';
import React, { useState } from 'react';
import {
  Boxes, ChartNoAxesCombined, ContactRound, LayoutDashboard, LogOut,
  Menu, Moon, Package, ShoppingCart, Sun, Users, X
} from 'lucide-react';
import { api } from './api.js';
import { Dashboard } from './pages/Dashboard.jsx';
import { DataPage } from './pages/DataPage.jsx';
import { InventoryPage } from './pages/InventoryPage.jsx';
import { SalesPage } from './pages/SalesPage.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales transactions', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'customers', label: 'Customers', icon: ContactRound },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['admin'] },
    { id: 'reports', label: 'Reports', icon: ChartNoAxesCombined, roles: ['admin', 'manager'] }
  ];

  function Login({ onLogin, theme, onToggleTheme }) {
    const [registering, setRegistering] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function submit(event) {
      event.preventDefault();
      setBusy(true); setError('');
      try {
        const result = await api(registering ? '/auth/customer/register' : '/auth/login', {
          method: 'POST',
          body: JSON.stringify(registering
            ? { name, email, password, phone, address }
            : { email, password })
        });
        localStorage.setItem('sales-token', result.token);
        onLogin(result.user);
      } catch (err) { setError(err.message); } finally { setBusy(false); }
    }
    return <main className="login-screen">
      <button
        className="icon-button login-theme-toggle"
        type="button"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        onClick={onToggleTheme}
      >
        {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
      </button>
      <section className="login-card">
        <img src="/logo.png" alt="GlowTrack Logo" style={{ height: '50px', width: 'auto' }} />
        <p className="eyebrow mt-4">SALES MONITOR</p>
        <h1>{registering ? 'Create your account' : 'Welcome back'}</h1>
        <p className="text-secondary mb-4">
          {registering ? 'Create a customer account to shop and track your orders.' : 'Sign in to manage your business.'}
        </p>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={submit}>
          {registering && <>
            <label className="form-label">Full name</label>
            <input className="form-control mb-3" type="text" autoComplete="name" required value={name} onChange={e => setName(e.target.value)} />
            <label className="form-label">Mobile Number</label>
            <input className="form-control mb-3" type="tel" autoComplete="tel" required value={phone} onChange={e => setPhone(e.target.value)} />
            <label className="form-label">Address</label>
            <input className="form-control mb-3" type="text" autoComplete="street-address" required value={address} onChange={e => setAddress(e.target.value)} />
          </>}
          <label className="form-label">Work email</label>
          <input className="form-control mb-3" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
          <label className="form-label">Password</label>
          <input className="form-control mb-4" type="password" minLength={registering ? 8 : undefined} autoComplete={registering ? 'new-password' : 'current-password'} required value={password} onChange={e => setPassword(e.target.value)} />
          <button className="btn btn-primary w-100 py-2" disabled={busy}>
            {busy ? 'Please wait…' : registering ? 'Create customer account' : 'Sign in'}
          </button>
        </form>
        <button
          className="text-link login-mode-toggle mx-auto"
          type="button"
          onClick={() => { setRegistering(!registering); setError(''); }}
        >
          {registering ? 'Already have an account? Sign in' : 'New customer? Create an account'}
        </button>
        <small className="text-secondary d-block text-center mt-4">Ask your administrator for an account.</small>
      </section>
    </main>;
  }

  export default function App() {
    const [user, setUser] = React.useState(null);
    const [checking, setChecking] = React.useState(Boolean(localStorage.getItem('sales-token')));
    const [page, setPage] = React.useState('dashboard');
    const [inventoryRefreshKey, setInventoryRefreshKey] = React.useState(0);
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [loadError, setLoadError] = React.useState('');
    const [theme, setTheme] = React.useState(() => localStorage.getItem('sales-theme') === 'dark' ? 'dark' : 'light');
    const [showLogoutModal, setShowLogoutModal] = React.useState(false);
    const cancelLogoutRef = React.useRef(null);

    React.useEffect(() => {
      document.documentElement.setAttribute('data-bs-theme', theme);
      localStorage.setItem('sales-theme', theme);
    }, [theme]);

    React.useEffect(() => {
      if (!showLogoutModal) return undefined;

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      cancelLogoutRef.current?.focus();

      function handleKeyDown(event) {
        if (event.key === 'Escape') setShowLogoutModal(false);
      }

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = previousOverflow;
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [showLogoutModal]);

    React.useEffect(() => {
      if (!localStorage.getItem('sales-token')) return;
      api('/auth/me').then(result => setUser(result.user))
        .catch(() => { localStorage.removeItem('sales-token'); setLoadError('Your session ended. Please sign in again.'); })
        .finally(() => setChecking(false));
    }, []);

    function logout() {
      localStorage.removeItem('sales-token');
      setShowLogoutModal(false);
      setUser(null);
      setPage('dashboard');
    }

    if (checking) return <div className="page-loading"><span className="spinner-border text-primary" /></div>;
    if (!user) return <>
      <Login
        onLogin={setUser}
        theme={theme}
        onToggleTheme={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
      />
      {loadError && <div className="login-toast">{loadError}</div>}
    </>;
    if (user.role === 'customer') return (
      <CustomerStorefront
        user={user}
        onLogout={logout}
        theme={theme}
        onToggleTheme={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
      />
    );

    const visibleNav = navItems.filter(item => !item.roles || item.roles.includes(user.role));
    const heading = visibleNav.find(item => item.id === page)?.label || 'Dashboard';
    const content = (() => {
      if (page === 'dashboard') return <Dashboard onNavigate={setPage} darkMode={theme === 'dark'} />;
      if (page === 'products') return <DataPage type="products" refreshKey={inventoryRefreshKey} />;
      if (page === 'customers') return <DataPage type="customers" />;
      if (page === 'employees') return <DataPage type="employees" />;
      if (page === 'inventory') return <InventoryPage refreshKey={inventoryRefreshKey} />;
      if (page === 'sales') return <SalesPage />;
      if (page === 'reports') return <ReportsPage />;
      return <Dashboard onNavigate={setPage} />;
    })();

    return <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="GlowTrack Logo" style={{ height: '35px', width: 'auto' }} />
          <div><strong>Sales Monitor</strong><small>BUSINESS SUITE</small></div>
          <button className="icon-button sidebar-close d-lg-none" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {visibleNav.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={`nav-link ${page === item.id ? 'active' : ''}`} onClick={() => {
              setPage(item.id);
              if (item.id === 'products' || item.id === 'inventory') {
                setInventoryRefreshKey(current => current + 1);
              }
              setMobileOpen(false);
            }}>
              <span className="nav-icon"><Icon size={18} strokeWidth={1.8} /></span><span>{item.label}</span>
              {item.id === 'inventory' && <span className="nav-dot" />}
            </button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="avatar">{user.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</div>
            <div className="profile-meta"><strong>{user.name}</strong><small>{user.role}</small></div>
            <button title="Sign out" aria-label="Sign out" className="icon-button text-secondary" onClick={() => setShowLogoutModal(true)}><LogOut size={17} /></button>
          </div>
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-backdrop d-lg-none" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <main className="main-panel">
        <header className="topbar">
          <div className="d-flex align-items-center gap-3">
            <button className="icon-button d-lg-none" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <div className="breadcrumb-label">Workspace <span>/</span> <strong>{heading}</strong></div>
          </div>
          <div className="topbar-actions">
            <span className="today-label">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <button
              className="icon-button theme-toggle"
              type="button"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="avatar avatar-small">{user.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</div>
          </div>
        </header>
        <section className="content-area">
          {content}
        </section>
      </main>
      {showLogoutModal && (
        <div className="logout-modal-layer">
          <button
            className="logout-modal-backdrop"
            type="button"
            aria-label="Close logout confirmation"
            onClick={() => setShowLogoutModal(false)}
          />
          <div className="modal-dialog modal-dialog-centered logout-modal-dialog">
            <div
              className="modal-content border-0 rounded-4 shadow-lg text-white"
              style={{ backgroundColor: '#1e293b' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-modal-title"
              aria-describedby="logout-modal-description"
            >
              <div className="modal-header border-0 px-4 pt-4 pb-2">
                <h2 className="modal-title fs-5 fw-semibold text-white" id="logout-modal-title">Confirm Logout</h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowLogoutModal(false)}
                />
              </div>
              <div className="modal-body px-4 py-3 text-light opacity-75" id="logout-modal-description">
                Are you sure you want to log out?
              </div>
              <div className="modal-footer border-0 px-4 pb-4">
                <button
                  ref={cancelLogoutRef}
                  type="button"
                  className="btn btn-outline-light rounded-pill px-4"
                  onClick={() => setShowLogoutModal(false)}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-danger rounded-pill px-4" onClick={logout}>
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>;
  }
