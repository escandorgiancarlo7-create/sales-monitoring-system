import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';
import { authenticate, allowRoles } from './middleware.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const adminRoles = allowRoles('admin', 'manager');
const adminOnly = allowRoles('admin');
const employeeOnly = allowRoles('admin', 'manager', 'cashier');
const customerOnly = allowRoles('customer');

app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://sales-monitoring-system-webv4.vercel.app',
  ...(process.env.FRONTEND_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean)
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const required = (value) => value !== undefined && value !== null && String(value).trim() !== '';
const positiveInteger = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0;

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body || {};
  if (!required(email) || !required(password)) return res.status(400).json({ error: 'Email and password are required.' });

  const normalizedEmail = String(email).trim().toLowerCase();
  const [employees] = await pool.execute(
    'SELECT id, name, email, role, password_hash, active FROM employees WHERE email = ?',
    [normalizedEmail]
  );
  const employee = employees[0];

  if (employee) {
    const isMatch = Number(employee.active) === 1 && employee.password_hash &&
      await bcrypt.compare(String(password), employee.password_hash);
    if (isMatch) {
      const token = jwt.sign(
        { sub: employee.id, role: employee.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );
      return res.json({
        token,
        user: { id: employee.id, name: employee.name, email: employee.email, role: employee.role }
      });
    }
  }

  const [customers] = await pool.execute(
    'SELECT id, name, email, password_hash, active FROM customers WHERE email = ? ORDER BY id DESC',
    [normalizedEmail]
  );
  let customer = null;
  for (const candidate of customers) {
    if (Number(candidate.active) === 1 && candidate.password_hash &&
        await bcrypt.compare(String(password), candidate.password_hash)) {
      customer = candidate;
      break;
    }
  }

  if (!customer) {
    console.log('Login failed for:', email, 'Employee found:', !!employee, 'Customer found:', customers.length > 0);
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { sub: customer.id, role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
  res.json({
    token,
    user: { id: customer.id, name: customer.name, email: customer.email, role: 'customer' }
  });
}));

app.post('/api/auth/customer/register', asyncRoute(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!required(name) || !required(email) || !required(password) || String(password).length < 8) {
    return res.status(400).json({ error: 'Name, email, and a password of at least 8 characters are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const [employees] = await pool.execute(
    'SELECT id FROM employees WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );
  if (employees.length) {
    return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
  }

  const [customers] = await pool.execute(
    'SELECT id FROM customers WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );
  if (customers.length) {
    return res.status(409).json({ error: 'A customer profile with this email already exists. Contact the store to activate portal access.' });
  }

  const passwordHash = await bcrypt.hash(String(password), 12);
  const [result] = await pool.execute(
    'INSERT INTO customers (name, email, password_hash) VALUES (?, ?, ?)',
    [String(name).trim(), normalizedEmail, passwordHash]
  );
  const token = jwt.sign(
    { sub: result.insertId, role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.status(201).json({
    token,
    user: { id: result.insertId, name: String(name).trim(), email: normalizedEmail, role: 'customer' }
  });
}));

app.use('/api', authenticate);
app.get('/api/auth/me', (req, res) => res.json({ user: req.user }));

app.post('/api/customer/checkout', customerOnly, asyncRoute(async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0 ||
      items.some(item => !positiveInteger(item?.product_id) || !positiveInteger(item?.quantity))) {
    return res.status(400).json({ error: 'Add at least one item with a valid product and positive whole-number quantity.' });
  }

  const quantities = new Map();
  for (const item of items) {
    const productId = Number(item.product_id);
    const quantity = (quantities.get(productId) || 0) + Number(item.quantity);
    if (!Number.isSafeInteger(quantity)) {
      return res.status(400).json({ error: 'Item quantity is too large.' });
    }
    quantities.set(productId, quantity);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const productIds = [...quantities.keys()];
    const placeholders = productIds.map(() => '?').join(',');
    const [products] = await connection.query(
      `SELECT id, name, price, stock_quantity
       FROM products
       WHERE active = 1 AND id IN (${placeholders})
       FOR UPDATE`,
      productIds
    );

    if (products.length !== productIds.length) {
      await connection.rollback();
      return res.status(400).json({ error: 'One or more products are unavailable.' });
    }

    let totalCents = 0;
    for (const product of products) {
      const quantity = quantities.get(Number(product.id));
      if (Number(product.stock_quantity) < quantity) {
        await connection.rollback();
        return res.status(400).json({ error: `Insufficient stock for ${product.name}.` });
      }
      const priceCents = Math.round(Number(product.price) * 100);
      totalCents += priceCents * quantity;
      if (!Number.isSafeInteger(totalCents)) {
        await connection.rollback();
        return res.status(400).json({ error: 'Order total is too large.' });
      }
    }

    const total = totalCents / 100;
    const [sale] = await connection.execute(
      'INSERT INTO sales (customer_id, employee_id, total, status) VALUES (?, NULL, ?, ?)',
      [req.user.id, total, 'completed']
    );

    for (const product of products) {
      const quantity = quantities.get(Number(product.id));
      const priceCents = Math.round(Number(product.price) * 100);
      const lineTotal = priceCents * quantity / 100;
      await connection.execute(
        'INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)',
        [sale.insertId, product.id, product.name, quantity, product.price, lineTotal]
      );
      await connection.execute(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [quantity, product.id]
      );
      await connection.execute(
        'INSERT INTO inventory_movements (product_id, employee_id, type, quantity, note) VALUES (?, NULL, ?, ?, ?)',
        [product.id, 'sale', -quantity, `Customer order #${sale.insertId}`]
      );
    }

    await connection.commit();
    res.status(201).json({ id: sale.insertId, total });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

app.get('/api/customer/orders', customerOnly, asyncRoute(async (req, res) => {
  const [orders] = await pool.execute(
    'SELECT id, total, status, created_at FROM sales WHERE customer_id = ? ORDER BY created_at DESC, id DESC',
    [req.user.id]
  );
  if (!orders.length) return res.json([]);

  const orderIds = orders.map(order => order.id);
  const placeholders = orderIds.map(() => '?').join(',');
  const [items] = await pool.execute(
    `SELECT sale_id, product_name, quantity, unit_price, line_total
     FROM sale_items
     WHERE sale_id IN (${placeholders})
     ORDER BY sale_id, id`,
    orderIds
  );
  const itemsByOrder = new Map();
  for (const item of items) {
    const orderItems = itemsByOrder.get(item.sale_id) || [];
    orderItems.push({
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total
    });
    itemsByOrder.set(item.sale_id, orderItems);
  }

  res.json(orders.map(order => ({ ...order, items: itemsByOrder.get(order.id) || [] })));
}));

app.get('/api/dashboard', employeeOnly, asyncRoute(async (_req, res) => {
  const [[summary]] = await pool.query(`
    SELECT
      (SELECT COALESCE(SUM(total), 0) FROM sales WHERE status = 'completed' AND DATE(created_at) = CURDATE()) AS today_sales,
      (SELECT COUNT(*) FROM sales WHERE status = 'completed' AND DATE(created_at) = CURDATE()) AS today_transactions,
      (SELECT COUNT(*) FROM products WHERE active = 1) AS active_products,
      (SELECT COALESCE(SUM(stock_quantity), 0) FROM products WHERE active = 1) AS stock_units,
      (SELECT COUNT(*) FROM products WHERE active = 1 AND stock_quantity <= reorder_level) AS low_stock,
      (SELECT COUNT(*) FROM customers WHERE active = 1) AS customers
  `);
  const [sales] = await pool.query(`
    SELECT DATE_FORMAT(day_list.day, '%Y-%m-%d') AS date,
           COALESCE(SUM(s.total), 0) AS total
    FROM (
      SELECT CURDATE() - INTERVAL seq DAY AS day
      FROM (
        SELECT 0 seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
        UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
      ) days
    ) day_list
    LEFT JOIN sales s ON DATE(s.created_at) = day_list.day AND s.status = 'completed'
    GROUP BY day_list.day ORDER BY day_list.day
  `);
  const [lowStock] = await pool.execute(
    'SELECT id, sku, name, stock_quantity, reorder_level FROM products WHERE active = 1 AND stock_quantity <= reorder_level ORDER BY stock_quantity ASC LIMIT 8'
  );
  res.json({ summary, sales, lowStock });
}));

app.get('/api/products', asyncRoute(async (req, res) => {
  const query = req.user.role === 'customer'
    ? 'SELECT id, sku, name, description, price, stock_quantity, reorder_level, active FROM products WHERE active = 1 ORDER BY name'
    : 'SELECT id, sku, name, description, price, cost, stock_quantity, reorder_level, active, created_at FROM products ORDER BY name';
  const [rows] = await pool.query(query);
  res.json(rows);
}));

app.post('/api/products', adminRoles, asyncRoute(async (req, res) => {
  const { sku, name, description = '', price, cost = 0, stock_quantity = 0, reorder_level = 5 } = req.body || {};
  if (![sku, name, price].every(required) || !Number.isFinite(Number(price)) || Number(price) < 0 ||
      !Number.isFinite(Number(cost)) || Number(cost) < 0 || !Number.isInteger(Number(stock_quantity)) || Number(stock_quantity) < 0 ||
      !Number.isInteger(Number(reorder_level)) || Number(reorder_level) < 0) {
    return res.status(400).json({ error: 'Provide a SKU, name, valid non-negative price/cost, and valid inventory quantities.' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'INSERT INTO products (sku, name, description, price, cost, stock_quantity, reorder_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [String(sku).trim(), String(name).trim(), description, Number(price), Number(cost), Number(stock_quantity), Number(reorder_level)]
    );
    if (Number(stock_quantity) > 0) await connection.execute(
      'INSERT INTO inventory_movements (product_id, employee_id, type, quantity, note) VALUES (?, ?, ?, ?, ?)',
      [result.insertId, req.user.id, 'restock', Number(stock_quantity), 'Opening stock']
    );
    await connection.commit();
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

app.put('/api/products/:id', adminRoles, asyncRoute(async (req, res) => {
  const { sku, name, description = '', price, cost = 0, reorder_level = 5, active = true } = req.body || {};
  if (![sku, name, price].every(required) || !Number.isFinite(Number(price)) || Number(price) < 0 ||
      !Number.isFinite(Number(cost)) || Number(cost) < 0 || !Number.isInteger(Number(reorder_level)) || Number(reorder_level) < 0) {
    return res.status(400).json({ error: 'Provide valid product details and non-negative prices and reorder level.' });
  }
  const [result] = await pool.execute(
    'UPDATE products SET sku = ?, name = ?, description = ?, price = ?, cost = ?, reorder_level = ?, active = ? WHERE id = ?',
    [String(sku).trim(), String(name).trim(), description, Number(price), Number(cost), Number(reorder_level), Boolean(active), req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Product not found.' });
  res.json({ success: true });
}));

app.delete('/api/products/:id', adminOnly, asyncRoute(async (req, res) => {
  const [result] = await pool.execute('UPDATE products SET active = 0 WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Product not found.' });
  res.status(204).end();
}));

app.get('/api/inventory', employeeOnly, asyncRoute(async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT m.id, m.product_id, p.sku, p.name AS product_name, m.type, m.quantity, m.note, m.created_at, e.name AS employee_name
    FROM inventory_movements m
    JOIN products p ON p.id = m.product_id
    LEFT JOIN employees e ON e.id = m.employee_id
    ORDER BY m.created_at DESC, m.id DESC LIMIT 200
  `);
  res.json(rows);
}));

app.post('/api/inventory/adjustments', adminRoles, asyncRoute(async (req, res) => {
  const { product_id, quantity, note } = req.body || {};
  if (!positiveInteger(product_id) || !Number.isInteger(Number(quantity)) || Number(quantity) === 0 || !required(note)) {
    return res.status(400).json({ error: 'Select a product, provide a non-zero whole-number adjustment, and enter a reason.' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT stock_quantity FROM products WHERE id = ? AND active = 1 FOR UPDATE', [product_id]);
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Product not found.' });
    }
    const updatedStock = rows[0].stock_quantity + Number(quantity);
    if (updatedStock < 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Adjustment cannot reduce stock below zero.' });
    }
    await connection.execute('UPDATE products SET stock_quantity = ? WHERE id = ?', [updatedStock, product_id]);
    await connection.execute(
      'INSERT INTO inventory_movements (product_id, employee_id, type, quantity, note) VALUES (?, ?, ?, ?, ?)',
      [product_id, req.user.id, Number(quantity) > 0 ? 'adjustment_in' : 'adjustment_out', Number(quantity), String(note).trim()]
    );
    await connection.commit();
    res.status(201).json({ success: true, stock_quantity: updatedStock });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

app.get('/api/customers', employeeOnly, asyncRoute(async (_req, res) => {
  const [rows] = await pool.query('SELECT id, name, email, phone, address, created_at FROM customers WHERE active = 1 ORDER BY name');
  res.json(rows);
}));

app.post('/api/customers', employeeOnly, asyncRoute(async (req, res) => {
  const { name, email = '', phone = '', address = '', password = '' } = req.body || {};
  if (!required(name)) return res.status(400).json({ error: 'Customer name is required.' });
  if (password && String(password).length < 8) {
    return res.status(400).json({ error: 'Customer portal passwords must be at least 8 characters.' });
  }
  const passwordHash = password ? await bcrypt.hash(String(password), 12) : null;
  const [result] = await pool.execute(
    'INSERT INTO customers (name, email, phone, address, password_hash) VALUES (?, ?, ?, ?, ?)',
    [String(name).trim(), String(email).trim().toLowerCase(), String(phone).trim(), String(address).trim(), passwordHash]
  );
  res.status(201).json({ id: result.insertId });
}));

app.put('/api/customers/:id', employeeOnly, asyncRoute(async (req, res) => {
  const { name, email = '', phone = '', address = '', password = '' } = req.body || {};
  if (!required(name)) return res.status(400).json({ error: 'Customer name is required.' });
  if (password && String(password).length < 8) {
    return res.status(400).json({ error: 'Customer portal passwords must be at least 8 characters.' });
  }
  const passwordHash = password ? await bcrypt.hash(String(password), 12) : null;
  const [result] = await pool.execute(
    'UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, password_hash = COALESCE(?, password_hash) WHERE id = ? AND active = 1',
    [String(name).trim(), String(email).trim().toLowerCase(), String(phone).trim(), String(address).trim(), passwordHash, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Customer not found.' });
  res.json({ success: true });
}));

app.delete('/api/customers/:id', employeeOnly, asyncRoute(async (req, res) => {
  const [result] = await pool.execute('UPDATE customers SET active = 0 WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Customer not found.' });
  res.status(204).end();
}));

app.get('/api/employees', adminOnly, asyncRoute(async (_req, res) => {
  const [rows] = await pool.query('SELECT id, name, email, role, active, created_at FROM employees ORDER BY name');
  res.json(rows);
}));

app.post('/api/employees', adminOnly, asyncRoute(async (req, res) => {
  const { name, email, password, role = 'cashier' } = req.body || {};
  if (![name, email, password].every(required) || String(password).length < 8 || !['admin', 'manager', 'cashier'].includes(role)) {
    return res.status(400).json({ error: 'Name, email, a password of at least 8 characters, and a valid role are required.' });
  }
  const hash = await bcrypt.hash(String(password), 12);
  const [result] = await pool.execute(
    'INSERT INTO employees (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [String(name).trim(), String(email).trim().toLowerCase(), hash, role]
  );
  res.status(201).json({ id: result.insertId });
}));

app.put('/api/employees/:id', adminOnly, asyncRoute(async (req, res) => {
  const { name, email, role, active } = req.body || {};
  if (![name, email].every(required) || !['admin', 'manager', 'cashier'].includes(role) || typeof active !== 'boolean') {
    return res.status(400).json({ error: 'Name, email, a valid role, and active status are required.' });
  }
  if (Number(req.params.id) === req.user.id && !active) return res.status(400).json({ error: 'You cannot deactivate your own account.' });
  const [result] = await pool.execute(
    'UPDATE employees SET name = ?, email = ?, role = ?, active = ? WHERE id = ?',
    [String(name).trim(), String(email).trim().toLowerCase(), role, active, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Employee not found.' });
  res.json({ success: true });
}));

app.get('/api/sales', employeeOnly, asyncRoute(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  const [rows] = await pool.execute(`
    SELECT s.id, s.total, s.status, s.created_at, c.name AS customer_name, e.name AS employee_name,
           (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS item_count
    FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
    LEFT JOIN employees e ON e.id = s.employee_id
    ORDER BY s.created_at DESC, s.id DESC LIMIT ?
  `, [limit]);
  res.json(rows);
}));

app.post('/api/sales', employeeOnly, asyncRoute(async (req, res) => {
  const { customer_id = null, items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0 || items.some((item) => !positiveInteger(item.product_id) || !positiveInteger(item.quantity))) {
    return res.status(400).json({ error: 'Add at least one item with a valid product and positive whole-number quantity.' });
  }
  const quantities = new Map();
  items.forEach(({ product_id, quantity }) => quantities.set(Number(product_id), (quantities.get(Number(product_id)) || 0) + Number(quantity)));
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (customer_id !== null) {
      const [customers] = await connection.execute('SELECT id FROM customers WHERE id = ? AND active = 1', [customer_id]);
      if (!customers.length) {
        await connection.rollback();
        return res.status(400).json({ error: 'Selected customer is unavailable.' });
      }
    }
    const productIds = [...quantities.keys()];
    const placeholders = productIds.map(() => '?').join(',');
    const [products] = await connection.query(
      `SELECT id, name, price, stock_quantity FROM products WHERE active = 1 AND id IN (${placeholders}) FOR UPDATE`,
      productIds
    );
    if (products.length !== productIds.length) {
      await connection.rollback();
      return res.status(400).json({ error: 'One or more products are unavailable.' });
    }
    let total = 0;
    for (const product of products) {
      const quantity = quantities.get(product.id);
      if (product.stock_quantity < quantity) {
        await connection.rollback();
        return res.status(400).json({ error: `Insufficient stock for ${product.name}.` });
      }
      total += product.price * quantity;
    }
    const [sale] = await connection.execute(
      'INSERT INTO sales (customer_id, employee_id, total, status) VALUES (?, ?, ?, ?)',
      [customer_id, req.user.id, total, 'completed']
    );
    for (const product of products) {
      const quantity = quantities.get(product.id);
      await connection.execute(
        'INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)',
        [sale.insertId, product.id, product.name, quantity, product.price, product.price * quantity]
      );
      await connection.execute('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [quantity, product.id]);
      await connection.execute(
        'INSERT INTO inventory_movements (product_id, employee_id, type, quantity, note) VALUES (?, ?, ?, ?, ?)',
        [product.id, req.user.id, 'sale', -quantity, `Sale #${sale.insertId}`]
      );
    }
    await connection.commit();
    res.status(201).json({ id: sale.insertId, total });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

app.get('/api/sales/:id', employeeOnly, asyncRoute(async (req, res) => {
  const [[sale]] = await pool.execute(`
    SELECT s.id, s.total, s.status, s.created_at, c.name AS customer_name, e.name AS employee_name
    FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
    LEFT JOIN employees e ON e.id = s.employee_id WHERE s.id = ?
  `, [req.params.id]);
  if (!sale) return res.status(404).json({ error: 'Sale not found.' });
  const [items] = await pool.execute(
    'SELECT product_name, quantity, unit_price, line_total FROM sale_items WHERE sale_id = ? ORDER BY id',
    [req.params.id]
  );
  res.json({ ...sale, items });
}));

app.get('/api/reports', adminRoles, asyncRoute(async (req, res) => {
  const from = req.query.from || new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const to = req.query.to || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
    return res.status(400).json({ error: 'Provide a valid date range.' });
  }
  const [daily] = await pool.query(`
    SELECT DATE_FORMAT(DATE(created_at), '%Y-%m-%d') AS date, COUNT(*) AS transactions, COALESCE(SUM(total), 0) AS revenue
    FROM sales WHERE status = 'completed' AND DATE(created_at) BETWEEN ? AND ?
    GROUP BY DATE(created_at) ORDER BY DATE(created_at)
  `, [from, to]);
  const [topProducts] = await pool.query(`
    SELECT si.product_name, SUM(si.quantity) AS units_sold, SUM(si.line_total) AS revenue
    FROM sale_items si JOIN sales s ON s.id = si.sale_id
    WHERE s.status = 'completed' AND DATE(s.created_at) BETWEEN ? AND ?
    GROUP BY si.product_id, si.product_name ORDER BY units_sold DESC LIMIT 10
  `, [from, to]);
  const [[totals]] = await pool.query(
    `SELECT COUNT(*) AS transactions, COALESCE(SUM(total), 0) AS revenue, COALESCE(AVG(total), 0) AS average_sale
     FROM sales WHERE status = 'completed' AND DATE(created_at) BETWEEN ? AND ?`,
    [from, to]
  );
  res.json({ from, to, totals, daily, topProducts });
}));

app.use((error, _req, res, _next) => {
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That email or SKU is already in use.' });
  console.error(error);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET must be set in the environment.');
  process.exit(1);
}
app.listen(port, () => console.log(`Sales monitoring API listening on http://localhost:${port}`));