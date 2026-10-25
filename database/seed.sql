USE sales_monitoring;

INSERT INTO products (sku, name, description, price, cost, stock_quantity, reorder_level) VALUES
('SKU-1001', 'Wireless Mouse', 'Ergonomic wireless mouse', 24.99, 12.00, 45, 8),
('SKU-1002', 'Mechanical Keyboard', 'Compact mechanical keyboard', 79.00, 42.00, 24, 5),
('SKU-1003', 'USB-C Hub', '7-in-1 USB-C connectivity hub', 39.50, 19.00, 31, 6),
('SKU-1004', 'Laptop Stand', 'Adjustable aluminum laptop stand', 34.00, 17.00, 18, 4),
('SKU-1005', 'Webcam HD', '1080p webcam with microphone', 54.99, 30.00, 3, 5)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO customers (name, email, phone, address)
SELECT 'Alex Morgan', 'alex@example.com', '+1 555 0101', '18 Market Street'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE email = 'alex@example.com');
INSERT INTO customers (name, email, phone, address)
SELECT 'Taylor Reed', 'taylor@example.com', '+1 555 0102', '42 Cedar Avenue'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE email = 'taylor@example.com');
