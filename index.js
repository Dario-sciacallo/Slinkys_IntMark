const express = require('express');
const cors = require('cors');
const { initDB, getDB, saveDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- USERS ---
app.get('/api/users', (req, res) => {
  const db = getDB();
  const result = db.exec('SELECT id, username, email, created_at FROM users');
  const users = result.length ? result[0].values.map(row => ({
    id: row[0], username: row[1], email: row[2], created_at: row[3]
  })) : [];
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password are required' });
  }
  const db = getDB();
  try {
    db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, password]);
    saveDB();
    const result = db.exec('SELECT id, username, email, created_at FROM users WHERE email = ?', [email]);
    res.status(201).json(result[0].values[0]);
  } catch (e) {
    res.status(409).json({ error: 'User already exists' });
  }
});

// --- PRODUCTS ---
app.get('/api/products', (req, res) => {
  const db = getDB();
  const result = db.exec('SELECT * FROM products');
  const products = result.length ? result[0].values.map(row => ({
    id: row[0], name: row[1], description: row[2], price: row[3], stock: row[4], category: row[5], created_at: row[6]
  })) : [];
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const { name, description, price, stock, category } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ error: 'name and price are required' });
  }
  const db = getDB();
  db.run('INSERT INTO products (name, description, price, stock, category) VALUES (?, ?, ?, ?, ?)',
    [name, description || null, price, stock || 0, category || null]);
  saveDB();
  res.status(201).json({ message: 'Product created' });
});

app.put('/api/products/:id', (req, res) => {
  const { name, description, price, stock, category } = req.body;
  const db = getDB();
  db.run('UPDATE products SET name=?, description=?, price=?, stock=?, category=? WHERE id=?',
    [name, description, price, stock, category, req.params.id]);
  saveDB();
  res.json({ message: 'Product updated' });
});

app.delete('/api/products/:id', (req, res) => {
  const db = getDB();
  db.run('DELETE FROM products WHERE id=?', [req.params.id]);
  saveDB();
  res.json({ message: 'Product deleted' });
});

// --- ORDERS ---
app.get('/api/orders', (req, res) => {
  const db = getDB();
  const result = db.exec('SELECT * FROM orders');
  const orders = result.length ? result[0].values.map(row => ({
    id: row[0], user_id: row[1], total: row[2], status: row[3], created_at: row[4]
  })) : [];
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const { user_id, items } = req.body;
  if (!user_id || !items || !items.length) {
    return res.status(400).json({ error: 'user_id and items are required' });
  }
  const db = getDB();
  let total = 0;
  items.forEach(item => {
    total += item.price * item.quantity;
  });
  db.run('INSERT INTO orders (user_id, total) VALUES (?, ?)', [user_id, total]);
  const orderId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
  items.forEach(item => {
    db.run('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [orderId, item.product_id, item.quantity, item.price]);
  });
  saveDB();
  res.status(201).json({ id: orderId, user_id, total, status: 'pending' });
});

app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const db = getDB();
  db.run('UPDATE orders SET status=? WHERE id=?', [status, req.params.id]);
  saveDB();
  res.json({ message: 'Order status updated' });
});

// --- START SERVER ---
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`SLYNKY-INTMARKET server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
