import React, { useEffect, useState } from 'react';
import { ArrowDownToLine, ChartNoAxesCombined } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { api, money } from '../api.js';

const day = value => value.toISOString().slice(0, 10);
export function ReportsPage() {
  const [from, setFrom] = useState(day(new Date(Date.now() - 29 * 86400000)));
  const [to, setTo] = useState(day(new Date()));
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  async function load() {
    setBusy(true); setError('');
    try { setReport(await api(`/reports?from=${from}&to=${to}`)); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  useEffect(() => { load(); }, []);
  function exportCsv() {
    if (!report) return;
    const rows = [['Date', 'Transactions', 'Revenue'], ...report.daily.map(row => [row.date, row.transactions, row.revenue])];
    rows.push([], ['Top products'], ['Product', 'Units sold', 'Revenue'], ...report.topProducts.map(row => [row.product_name, row.units_sold, row.revenue]));
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `sales-report-${from}-to-${to}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  return <>
    <div className="page-heading">
      <div><p className="eyebrow">ANALYTICS</p><h1>Reports</h1><p className="text-secondary mb-0">Understand revenue, transaction volume, and product performance.</p></div>
      <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={exportCsv} disabled={!report}><ArrowDownToLine size={16} /> Export CSV</button>
    </div>
    <article className="panel report-filter">
      <div className="filter-label"><div className="metric-icon blue"><ChartNoAxesCombined size={18} /></div><div><strong>Reporting period</strong><small>Choose a date range to refresh your report.</small></div></div>
      <div className="date-controls"><label>From<input className="form-control" type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} /></label><label>To<input className="form-control" type="date" value={to} min={from} onChange={e => setTo(e.target.value)} /></label><button className="btn btn-primary" onClick={load} disabled={busy}>Apply filters</button></div>
    </article>
    {error && <div className="alert alert-danger">{error}</div>}
    {busy ? <div className="panel-loading"><span className="spinner-border spinner-border-sm text-primary" /></div> : report && <>
      <div className="report-metrics">
        <article className="summary-card"><div className="summary-top"><span>Total revenue</span></div><div className="metric-value">{money(report.totals.revenue)}</div><div className="metric-foot"><span className="text-secondary">{from} to {to}</span></div></article>
        <article className="summary-card"><div className="summary-top"><span>Transactions</span></div><div className="metric-value">{Number(report.totals.transactions).toLocaleString()}</div><div className="metric-foot"><span className="text-secondary">Completed sales</span></div></article>
        <article className="summary-card"><div className="summary-top"><span>Average sale</span></div><div className="metric-value">{money(report.totals.average_sale)}</div><div className="metric-foot"><span className="text-secondary">Average transaction value</span></div></article>
      </div>
      <div className="report-grid">
        <article className="panel chart-panel"><div className="panel-header"><div><h2>Revenue by day</h2><p>Daily completed sales</p></div></div>
          <div className="report-chart"><Bar data={{ labels: report.daily.map(row => row.date), datasets: [{ label: 'Revenue', data: report.daily.map(row => Number(row.revenue)), backgroundColor: '#4169f5', borderRadius: 4 }] }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => money(context.raw) } } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#edf0f5' } } } }} />
          </div></article>
        <article className="panel table-panel top-products"><div className="panel-header"><div><h2>Top products</h2><p>Best sellers in this period</p></div></div>
          <div className="table-responsive"><table className="table data-table mb-0"><thead><tr><th>Product</th><th>Units</th><th>Revenue</th></tr></thead><tbody>{report.topProducts.map(row => <tr key={row.product_name}><td><strong>{row.product_name}</strong></td><td>{row.units_sold}</td><td>{money(row.revenue)}</td></tr>)}{!report.topProducts.length && <tr><td colSpan="3"><div className="empty-table">No sales in this period.</div></td></tr>}</tbody></table></div>
        </article>
      </div>
    </>}
  </>;
}
