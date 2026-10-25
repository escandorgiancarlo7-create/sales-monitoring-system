USE sales_monitoring;

START TRANSACTION;

DELETE movement
FROM inventory_movements AS movement
JOIN products AS product ON product.id = movement.product_id
WHERE product.sku NOT IN (
  'CCB-001', 'CCB-002', 'CCB-003', 'CCB-004', 'CCB-005',
  'CCB-006', 'CCB-007', 'CCB-008', 'CCB-009', 'CCB-010'
);

DELETE FROM products
WHERE sku NOT IN (
  'CCB-001', 'CCB-002', 'CCB-003', 'CCB-004', 'CCB-005',
  'CCB-006', 'CCB-007', 'CCB-008', 'CCB-009', 'CCB-010'
);

INSERT INTO products (sku, name, description, price, cost, stock_quantity, reorder_level) VALUES
('CCB-001', 'Chu Chu Beauty Heart Blush Duo', 'Heart-shaped blush duo', 399.00, 199.50, 50, 5),
('CCB-002', 'Chu Chu Beauty Heart Paint (Liquid Blush)', 'Liquid blush', 349.00, 174.50, 50, 5),
('CCB-003', 'Chu Chu Beauty Heart Brontour Duo', 'Heart-shaped bronzer and contour duo', 399.00, 199.50, 50, 5),
('CCB-004', 'Chu Chu Beauty Liquid Concealer', 'Liquid concealer', 299.00, 149.50, 50, 5),
('CCB-005', 'Chu Chu Beauty Lip Syrup', 'Lip syrup', 227.00, 113.50, 50, 5),
('CCB-006', 'Chu Chu Beauty Loose Powder', 'Loose setting powder', 349.00, 174.50, 50, 5),
('CCB-007', 'Chu Chu Heart Cloud Puff', 'Cloud-shaped makeup puff', 169.00, 84.50, 50, 5),
('CCB-008', 'Chu Chu Beauty Eyeshadow Palette', 'Eyeshadow palette', 349.00, 174.50, 50, 5),
('CCB-009', 'Chu Chu Beauty Jelly Highlighter', 'Jelly highlighter', 244.00, 122.00, 50, 5),
('CCB-010', 'Chu Chu Beauty Setting Spray', 'Setting spray', 649.00, 324.50, 50, 5)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  price = VALUES(price),
  cost = VALUES(cost),
  reorder_level = VALUES(reorder_level),
  active = TRUE;

COMMIT;

INSERT INTO customers (name, email, phone, address)
SELECT 'Alex Morgan', 'alex@example.com', '+1 555 0101', '18 Market Street'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE email = 'alex@example.com');
INSERT INTO customers (name, email, phone, address)
SELECT 'Taylor Reed', 'taylor@example.com', '+1 555 0102', '42 Cedar Avenue'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE email = 'taylor@example.com');
