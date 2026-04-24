const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Mock data
const products = [
  { id: '1', name: 'Amul Milk', price: 65, stock: 100 },
  { id: '2', name: 'Bread', price: 50, stock: 50 }
];

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

// Products API
app.get('/api/products', (req, res) => {
  res.json({ success: true, products });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}\n`);
});