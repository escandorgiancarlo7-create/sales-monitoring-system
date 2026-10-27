import React, { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Boxes, CircleDollarSign, Package, ShoppingBag, Users } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import { CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, BarElement, PointElement, Tooltip } from 'chart.js';
import { api, money } from '../api.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

export function Dashboard({ onNavigate, darkMode = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/dashboard').then(setData).catch(err => setError(err.message)); }, []);
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="page-loading inline"><span className="spinner-border text-primary" /></div>;

  const { summary, sales, lowStock } = data;
  const chartData = {
    labels: sales.map(row => new Date(`${row.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })),
    datasets: [{
      label: 'Sales revenue', data: sales.map(row => Number(row.total)),
      borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,.08)',
      fill: true, tension: .38, pointRadius: 3, pointHoverRadius: 5, pointBackgroundColor: '#fff', pointBorderColor: '#4f46e5', pointBorderWidth: 2
    }]
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => money(context.raw) } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: darkMode ? '#94a3b8' : '#8791a4' }, border: { display: false } },
      y: { grid: { display: false }, ticks: { color: darkMode ? '#94a3b8' : '#8791a4', callback: value => money(value) }, border: { display: false } }
    }
  };
  const cards = [
    { label: "Today's revenue", value: money(summary.today_sales), icon: CircleDollarSign, color: 'blue', note: `${summary.today_transactions} transactions today`, change: '+12.8%' },
    { label: 'Transactions', value: Number(summary.today_transactions).toLocaleString(), icon: ShoppingBag, color: 'purple', note: 'Completed today', change: '+8.2%' },
    { label: 'Active products', value: Number(summary.active_products).toLocaleString(), icon: Package, color: 'orange', note: `${summary.stock_units} units in stock`, change: `${summary.low_stock} low` },
    { label: 'Customers', value: Number(summary.customers).toLocaleString(), icon: Users, color: 'green', note: 'Active customer records', change: '+4.3%' }
  ];
  return <>
    <div className="page-heading">
      <div><p className="eyebrow">OVERVIEW</p><h1>Good day, here's your business.</h1><p className="text-secondary mb-0">Monitor your sales and operations at a glance.</p></div>
      <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => onNavigate('sales')}><ShoppingBag size={16} /> New transaction</button>
    </div>
    <div className="summary-grid">
      {cards.map(card => {
        const Icon = card.icon;
        return <article className="summary-card" key={card.label}>
          <div className="summary-top"><span>{card.label}</span><div className={`metric-icon ${card.color}`}><Icon size={20} strokeWidth={1.9} /></div></div>
          <div className="metric-value">{card.value}</div>
          <div className="metric-foot"><span className="text-secondary">{card.note}</span><span className={`metric-change ${card.color === 'orange' ? 'warning' : ''}`}>{card.color === 'orange' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{card.change}</span></div>
        </article>;
      })}
    </div>
    <div className="dashboard-grid">
      <article className="panel chart-panel">
        <div className="panel-header"><div><h2>Sales overview</h2><p>Revenue over the last 7 days</p></div><span className="period-pill">Last 7 days <ArrowRight size={13} /></span></div>
        <div className="chart-area"><Line data={chartData} options={chartOptions} /></div>
      </article>
      <article className="panel stock-panel">
        <div className="panel-header"><div><h2>Stock alerts</h2><p>Products at or below reorder point</p></div><div className="stock-alert-count">{lowStock.length}</div></div>
        {lowStock.length === 0 ? <div className="empty-state compact"><div className="empty-icon"><Boxes size={20} /></div><strong>Stock levels look good</strong><span>No products need restocking.</span></div> :
          <div className="stock-list">{lowStock.map(product => <div className="stock-row" key={product.id}>
            <div className="product-glyph"><Package size={17} /></div>
            <div className="stock-product"><strong>{product.name}</strong><small>{product.sku}</small></div>
            <div className="stock-level"><strong>{product.stock_quantity}</strong><small>left</small></div>
          </div>)}</div>}
        <button className="text-link" onClick={() => onNavigate('inventory')}>View inventory <ArrowRight size={14} /></button>
      </article>
    </div>
    <article className="panel activity-panel">
      <div className="panel-header"><div><h2>Sales performance</h2><p>Daily revenue comparison</p></div><button className="btn btn-outline-secondary btn-sm" onClick={() => onNavigate('reports')}>View reports <ArrowRight size={14} /></button></div>
      <div className="mini-chart"><Bar data={{
        labels: sales.map(row => new Date(`${row.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })),
        datasets: [{ label: 'Revenue', data: sales.map(row => Number(row.total)), backgroundColor: '#c7d2fe', hoverBackgroundColor: '#4f46e5', borderRadius: 6, barPercentage: .48 }]
      }} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, beginAtZero: true } } }} /></div>
    </article>
  </>;
}
