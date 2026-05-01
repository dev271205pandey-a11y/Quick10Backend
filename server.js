const express = require('express');
const cors = require('cors');
const multer = require('multer');
const https = require('https');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
app.use(cors());
app.use(express.json());

// ================================================================
// CLOUDINARY CONFIG
// ================================================================
cloudinary.config({
  cloud_name: 'dw1fwrcz0',
  api_key: '935717982737519',
  api_secret: 'bwpi2vW6bGxiCbfSoe3N0ShP6Ko',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'quick10_products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'fill', quality: 'auto' }],
  },
});

const upload = multer({ storage });

// ================================================================
// DATABASE
// ================================================================
let users = [];
let orders = [];
let otpStore = {};
let products = [
  {
    id: 'p1',
    name: 'Amul Full Cream Milk',
    price: 32, mrp: 35,
    weight: '500ml', unit: 'ml',
    category: 'dairy', categoryName: 'Dairy & Eggs',
    stock: 100, active: true,
    brand: 'Amul',
    description: 'Fresh full cream milk',
    images: [], imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p2',
    name: 'Brown Bread',
    price: 45, mrp: 50,
    weight: '400g', unit: 'g',
    category: 'bakery', categoryName: 'Bakery',
    stock: 80, active: true,
    brand: 'Modern',
    description: 'Fresh brown bread',
    images: [], imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p3',
    name: 'Farm Fresh Eggs',
    price: 55, mrp: 60,
    weight: '6 pcs', unit: 'pcs',
    category: 'dairy', categoryName: 'Dairy & Eggs',
    stock: 100, active: true,
    brand: 'Farm Fresh',
    description: 'Fresh eggs from farm',
    images: [], imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p4',
    name: 'Onion',
    price: 25, mrp: 35,
    weight: '1kg', unit: 'kg',
    category: 'veggies', categoryName: 'Fruits & Veggies',
    stock: 200, active: true,
    brand: 'Fresh',
    description: 'Fresh onions',
    images: [], imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p5',
    name: 'Tomatoes',
    price: 22, mrp: 30,
    weight: '500g', unit: 'g',
    category: 'veggies', categoryName: 'Fruits & Veggies',
    stock: 150, active: true,
    brand: 'Fresh',
    description: 'Fresh red tomatoes',
    images: [], imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p6',
    name: "Lay's Classic",
    price: 20, mrp: 20,
    weight: '26g', unit: 'g',
    category: 'snacks', categoryName: 'Snacks',
    stock: 100, active: true,
    brand: "Lay's",
    description: 'Classic salted chips',
    images: [], imageUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p7',
    name: 'Dove Soap',
    price: 48, mrp: 55,
    weight: '100g', unit: 'g',
    category: 'personal_care', categoryName: 'Personal Care',
    stock: 75, active: true,
    brand: 'Dove',
    description: 'Moisturizing beauty soap',
    images: [], imageUrl: null,
    createdAt: new Date().toISOString(),
  },
];

const categories = [
  { id: 'dairy',         name: 'Dairy & Eggs',      color: '#0D47A1', bg: '#E3F2FD' },
  { id: 'veggies',       name: 'Fruits & Veggies',  color: '#1B5E20', bg: '#E8F5E9' },
  { id: 'snacks',        name: 'Snacks',             color: '#E65100', bg: '#FFF3E0' },
  { id: 'drinks',        name: 'Cold Drinks',        color: '#1A237E', bg: '#E8EAF6' },
  { id: 'personal_care', name: 'Personal Care',      color: '#4A148C', bg: '#F3E5F5' },
  { id: 'household',     name: 'Household',          color: '#006064', bg: '#E0F7FA' },
  { id: 'bakery',        name: 'Bakery',             color: '#E65100', bg: '#FFF3E0' },
  { id: 'meat',          name: 'Meat & Seafood',     color: '#B71C1C', bg: '#FFEBEE' },
  { id: 'fashion',       name: 'Fashion & Clothing', color: '#5B2ECC', bg: '#EDE7F6' },
  { id: 'electronics',   name: 'Electronics',        color: '#212121', bg: '#ECEFF1' },
  { id: 'pharmacy',      name: 'Pharmacy',           color: '#1B5E20', bg: '#F1F8E9' },
  { id: 'stationery',    name: 'Stationery',         color: '#4E342E', bg: '#EFEBE9' },
];

// ================================================================
// HELPERS
// ================================================================
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function findOrCreateUser(phone) {
  let user = users.find(u => u.phone === phone);
  if (!user) {
    user = {
      id: 'u' + Date.now(),
      phone, name: '',
      addresses: [],
      createdAt: new Date().toISOString(),
    };
    users.push(user);
  }
  return user;
}

// ================================================================
// ROUTES
// ================================================================

// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Quick10 Backend is running!',
    products: products.length,
    orders: orders.length,
    time: new Date().toISOString(),
  });
});

// ── IMAGE UPLOAD ──────────────────────────────────────────────
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    const imageUrl = req.file.path;
    console.log('Image uploaded: ' + imageUrl);
    res.json({ success: true, imageUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
  }
});

// ── AUTH ──────────────────────────────────────────────────────
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length !== 10) {
    return res.status(400).json({ success: false, message: 'Invalid phone number' });
  }
  const otp = generateOTP();
  otpStore[phone] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
  console.log('OTP for ' + phone + ': ' + otp);
  res.json({ success: true, message: 'OTP sent successfully' });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone and OTP required' });
  }

  // Test OTP for development
  if (otp === '123456') {
    const user = findOrCreateUser(phone);
    return res.json({ success: true, message: 'Login successful', user });
  }

  const stored = otpStore[phone];
  if (!stored) {
    return res.status(400).json({ success: false, message: 'OTP not sent. Please request again.' });
  }
  if (Date.now() > stored.expiresAt) {
    delete otpStore[phone];
    return res.status(400).json({ success: false, message: 'OTP expired. Please request again.' });
  }
  if (stored.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
  delete otpStore[phone];
  const user = findOrCreateUser(phone);
  res.json({ success: true, message: 'Login successful', user });
});

// ── PRODUCTS ──────────────────────────────────────────────────
app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  let result = products.filter(p => p.active);
  if (category) result = result.filter(p => p.category === category);
  if (search) result = result.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  res.json({ success: true, products: result });
});

app.get('/api/products/all', (req, res) => {
  res.json({ success: true, products });
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, product });
});

app.post('/api/products', (req, res) => {
  const {
    name, price, mrp, weight, unit,
    category, categoryName, stock,
    brand, description, imageUrl, images,
    measurementType, quantity, availableSizes,
    highlights, returnPolicy, deliveryTime, sku,
  } = req.body;

  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Name and price required' });
  }

  const product = {
    id: 'p' + Date.now(),
    name,
    price: Number(price),
    mrp: Number(mrp) || Number(price),
    weight: weight || (quantity + unit),
    unit, category, categoryName,
    stock: Number(stock) || 100,
    active: true,
    brand: brand || '',
    description: description || '',
    highlights: highlights || '',
    returnPolicy: returnPolicy || '7 days return',
    deliveryTime: deliveryTime || '10 mins',
    sku: sku || '',
    measurementType: measurementType || 'weight',
    quantity: quantity || '',
    availableSizes: availableSizes || [],
    images: images || [],
    imageUrl: imageUrl || (images && images[0]) || null,
    createdAt: new Date().toISOString(),
  };

  products.push(product);
  console.log('Product added: ' + name);
  res.json({ success: true, product });
});

app.put('/api/products/:id', (req, res) => {
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  products[idx] = { ...products[idx], ...req.body };
  console.log('Product updated: ' + products[idx].name);
  res.json({ success: true, product: products[idx] });
});

app.delete('/api/products/:id', (req, res) => {
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  products[idx].active = false;
  res.json({ success: true, message: 'Product deactivated' });
});

// ── CATEGORIES ────────────────────────────────────────────────
app.get('/api/categories', (req, res) => {
  res.json({ success: true, categories });
});

// ── USERS ─────────────────────────────────────────────────────
app.get('/api/users/:phone', (req, res) => {
  const user = users.find(u => u.phone === phone);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, user });
});

app.put('/api/users/:phone', (req, res) => {
  const user = users.find(u => u.phone === req.params.phone);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  if (req.body.name) user.name = req.body.name;
  if (req.body.address) {
    user.addresses.push({ id: 'a' + Date.now(), ...req.body.address });
  }
  res.json({ success: true, user });
});

// ── ORDERS ────────────────────────────────────────────────────
app.post('/api/orders', (req, res) => {
  const { phone, items, address, paymentMethod, total } = req.body;
  if (!phone || !items || !address) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  const order = {
    id: 'ORD' + Date.now(),
    phone, items, address,
    paymentMethod, total,
    status: 'placed',
    createdAt: new Date().toISOString(),
    deliveryPartnerId: null,
    estimatedTime: 10,
  };
  orders.push(order);
  console.log('New Order: ' + order.id + ' by ' + phone);
  res.json({ success: true, order });
});

app.get('/api/orders', (req, res) => {
  const { status } = req.query;
  let result = [...orders];
  if (status) result = result.filter(o => o.status === status);
  res.json({ success: true, orders: result });
});

app.get('/api/orders/user/:phone', (req, res) => {
  const userOrders = orders.filter(o => o.phone === req.params.phone);
  res.json({ success: true, orders: userOrders });
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  res.json({ success: true, order });
});

app.put('/api/orders/:id/status', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  order.status = req.body.status;
  if (req.body.deliveryPartnerId) {
    order.deliveryPartnerId = req.body.deliveryPartnerId;
  }
  console.log('Order ' + order.id + ' status: ' + order.status);
  res.json({ success: true, order });
});

// ── DELIVERY ──────────────────────────────────────────────────
app.get('/api/delivery/available-orders', (req, res) => {
  const available = orders.filter(o =>
    o.status === 'packed' && !o.deliveryPartnerId
  );
  res.json({ success: true, orders: available });
});

app.post('/api/delivery/accept-order', (req, res) => {
  const { orderId, deliveryPartnerId } = req.body;
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  order.deliveryPartnerId = deliveryPartnerId;
  order.status = 'picked';
  res.json({ success: true, order });
});

// ================================================================
// SERVER START + SELF PING
// ================================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('Quick10 Backend running on port ' + PORT);
  console.log('Products: ' + products.length);
  console.log('Cloudinary: dw1fwrcz0');
  console.log('Test OTP: 123456');

  setInterval(() => {
    https.get('https://quick10backend.onrender.com/health', (res) => {
      console.log('Self ping OK - ' + new Date().toLocaleTimeString());
    }).on('error', (err) => {
      console.log('Ping error: ' + err.message);
    });
  }, 14 * 60 * 1000);
});