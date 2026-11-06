import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { money } from '../api.js';

export default function ProductPicker({
  products,
  value,
  onChange,
  placeholder = 'Choose a product',
  disabled = false,
  disableOutOfStock = false,
  showPrice = false
}) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);
  const selectedProduct = products.find(product => String(product.id) === String(value));

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!pickerRef.current?.contains(event.target)) setOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function chooseProduct(product) {
    if (disableOutOfStock && !product.stock_quantity) return;
    onChange(String(product.id));
    setOpen(false);
  }

  return (
    <div className={`product-picker${open ? ' is-open' : ''}`} ref={pickerRef}>
      <button
        className="form-select product-picker-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(current => !current)}
      >
        <span className="product-picker-selection">
          <strong>{selectedProduct?.name || placeholder}</strong>
          {selectedProduct && (
            <small>
              {showPrice && `${money(selectedProduct.price)} · `}
              {selectedProduct.stock_quantity} available
            </small>
          )}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {open && (
        <div className="product-picker-layer">
          <button
            className="product-picker-backdrop"
            type="button"
            aria-label="Close product list"
            onClick={() => setOpen(false)}
          />
          <div className="product-picker-menu" role="listbox" aria-label="Choose a product">
            <div className="product-picker-menu-heading">
              <strong>Choose a product</strong>
              <span>{products.length} products</span>
            </div>
            <div className="product-picker-options">
              {products.map(product => {
                const outOfStock = !product.stock_quantity;
                const selected = String(product.id) === String(value);
                return (
                  <button
                    className="product-picker-option"
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={disableOutOfStock && outOfStock}
                    key={product.id}
                    onClick={() => chooseProduct(product)}
                  >
                    <span className="product-picker-option-copy">
                      <strong>{product.name}</strong>
                      <small>
                        {showPrice && `${money(product.price)} · `}
                        {product.stock_quantity} available
                      </small>
                    </span>
                    {selected && <Check size={17} aria-hidden="true" />}
                  </button>
                );
              })}
              {!products.length && <p className="product-picker-empty">No products available.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
