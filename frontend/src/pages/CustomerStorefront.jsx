import React, { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function CustomerStorefront({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/products')
      .then(data => setProducts(data))
      .catch(err => console.error("Failed to load products:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4" style={{ minHeight: '100vh', background: 'var(--bs-body-bg)' }}>
      <div className="d-flex justify-content-between align-items-center mb-5 pb-3 border-bottom">
        <h2 className="m-0">Storefront</h2>
        <div className="d-flex align-items-center gap-3">
          <span className="text-secondary">Welcome, {user.name}</span>
          <button className="btn btn-outline-danger btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <h4 className="mb-4">Available Products</h4>
      
      {loading ? (
        <div className="spinner-border text-primary" role="status"></div>
      ) : (
        <div className="row g-4">
          {products.map(p => (
            <div className="col-md-4" key={p.id}>
              <div className="card shadow-sm h-100 border-0 rounded-4">
                <div className="card-body">
                  <h5 className="card-title">{p.name}</h5>
                  <p className="card-text text-secondary small mb-3">{p.description || 'No description available.'}</p>
                  <h4 className="text-primary mb-3">₱{p.price}</h4>
                  <button className="btn btn-primary w-100">Add to Cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}