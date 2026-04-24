const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const products = [
  { id: '1', name: 'Amul Milk 1L', category: 'Dairy', price: 65, stock: 100 },
  { id: '2', name: 'Bread', category: 'Bakery', price: 50, stock: 50 },
  { id: '3', name: 'Apple', category: 'Fruits', price: 120, stock: 80 }
];

const users = [];
const orders = [];

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.get('/api/products', (req, res) => {
  res.json({ success: true, products });
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, product });
});

app.post('/api/users/create', (req, res) => {
  const { phoneNumber, name } = req.body;
  const user = { userId: Date.now(), phoneNumber, name, createdAt: new Date() };
  users.push(user);
  res.json({ success: true, user });
});

app.get('/api/users/:phoneNumber', (req, res) => {
  const user = users.find(u => u.phoneNumber === req.params.phoneNumber);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, user });
});

app.post('/api/orders/create', (req, res) => {
  const { customerId, items } = req.body;
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const orderId = `ORD-${Date.now()}`;
  const order = {
    orderId,
    customerId,
    items,
    subtotal,
    totalAmount: subtotal + 20,
    status: 'pending',
    createdAt: new Date()
  };
  orders.push(order);
  io.emit('order-created', order);
  res.json({ success: true, orderId, totalAmount: order.totalAmount });
});

app.get('/api/orders/:customerId', (req, res) => {
  const customerOrders = orders.filter(o => o.customerId === req.params.customerId);
  res.json({ success: true, orders: customerOrders });
});

app.post('/api/orders/:orderId/status', (req, res) => {
  const { status } = req.body;
  const order = orders.find(o => o.orderId === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Not found' });
  order.status = status;
  io.emit('order-updated', order);
  res.json({ success: true, message: 'Updated' });
});

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Quick10 Backend Server');
  console.log('📡 Running on http://localhost:' + PORT);
  console.log('✅ Ready for React Native App');
  console.log('='.repeat(50) + '\n');
});

module.exports = { app, io };