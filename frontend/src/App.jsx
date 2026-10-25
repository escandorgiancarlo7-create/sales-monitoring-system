import React, { useEffect, useState } from 'react';
import {
  Activity, Boxes, ChartNoAxesCombined, ContactRound, LayoutDashboard, LogOut,
  Menu, Package, ShoppingCart, Users, X
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

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('sales-token', result.token);
      onLogin(result.user);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <main className="login-screen">
    <section className="login-card">
      <div className="brand-mark"><Activity size={24} /></div>
      <p className="eyebrow mt-4">SALES MONITOR</p>
      <h1>Welcome back</h1>
      <p className="text-secondary mb-4">Sign in to manage your business.</p>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <form onSubmit={submit}>
        <label className="form-label">Work email</label>
        <input className="form-control mb-3" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
        <label className="form-label">Password</label>
        <input className="form-control mb-4" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
        <button className="btn btn-primary w-100 py-2" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <small className="text-secondary d-block text-center mt-4">Ask your administrator for an account.</small>
    </section>
  </main>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(localStorage.getItem('sales-token')));
  const [page, setPage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('sales-token')) return;
    api('/auth/me').then(result => setUser(result.user))
      .catch(() => { localStorage.removeItem('sales-token'); setLoadError('Your session ended. Please sign in again.'); })
      .finally(() => setChecking(false));
  }, []);

  function logout() {
    localStorage.removeItem('sales-token');
    setUser(null);
    setPage('dashboard');
  }

  if (checking) return <div className="page-loading"><span className="spinner-border text-primary" /></div>;
  if (!user) return <><Login onLogin={setUser} />{loadError && <div className="login-toast">{loadError}</div>}</>;

  const visibleNav = navItems.filter(item => !item.roles || item.roles.includes(user.role));
  const heading = visibleNav.find(item => item.id === page)?.label || 'Dashboard';
  const content = (() => {
    if (page === 'dashboard') return <Dashboard onNavigate={setPage} />;
    if (page === 'products') return <DataPage type="products" />;
    if (page === 'customers') return <DataPage type="customers" />;
    if (page === 'employees') return <DataPage type="employees" />;
    if (page === 'inventory') return <InventoryPage />;
    if (page === 'sales') return <SalesPage />;
    if (page === 'reports') return <ReportsPage />;
    return <Dashboard onNavigate={setPage} />;
  })();

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-mark"><Activity size={22} /></div>
        <div><strong>Sales Monitor</strong><small>BUSINESS SUITE</small></div>
        <button className="icon-button sidebar-close d-lg-none" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X size={18} /></button>
      </div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav">
        {visibleNav.map(item => {
          const Icon = item.icon;
          return <button key={item.id} className={`nav-link ${page === item.id ? 'active' : ''}`} onClick={() => { setPage(item.id); setMobileOpen(false); }}>
            <Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>
            {item.id === 'inventory' && <span className="nav-dot" />}
          </button>;
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-profile">
          <div className="avatar">{user.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</div>
          <div className="profile-meta"><strong>{user.name}</strong><small>{user.role}</small></div>
          <button title="Sign out" aria-label="Sign out" className="icon-button text-secondary" onClick={logout}><LogOut size={17} /></button>
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
          <div className="avatar avatar-small">{user.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</div>
        </div>
      </header>
      <section className="content-area">
        {content}
      </section>
    </main>
  </div>;
}
