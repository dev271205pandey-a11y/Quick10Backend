const express = require('express');
const cors = require('cors');
const multer = require('multer');
const https = require('https');
const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
app.use(cors());
app.use(express.json());

// ================================================================
// MONGODB CONNECTION
// ================================================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://quickadmin:dev271201deva@cluster0.o9mlhyd.mongodb.net/quick10?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected!'))
  .catch(err => console.log('MongoDB Error: ' + err.message));

// ================================================================
// MONGODB SCHEMAS
// ================================================================

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number },
  weight: { type: String },
  unit: { type: String },
  category: { type: String },
  categoryName: { type: String },
  stock: { type: Number, default: 100 },
  active: { type: Boolean, default: true },
  brand: { type: String },
  description: { type: String },
  highlights: { type: String },
  returnPolicy: { type: String, default: '7 days return' },
  deliveryTime: { type: String, default: '10 mins' },
  sku: { type: String },
  measurementType: { type: String },
  quantity: { type: String },
  availableSizes: [{ type: String }],
  images: [{ type: String }],
  imageUrl: { type: String },
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  items: [{ type: mongoose.Schema.Types.Mixed }],
  address: { type: mongoose.Schema.Types.Mixed },
  paymentMethod: { type: String },
  total: { type: Number },
  status: { type: String, default: 'placed' },
  deliveryPartnerId: { type: String, default: null },
  estimatedTime: { type: Number, default: 10 },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  addresses: [{ type: mongoose.Schema.Types.Mixed }],
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);
const User = mongoose.model('User', UserSchema);

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
// OTP STORE (Memory - OTP ke liye memory theek hai)
// ================================================================
let otpStore = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
// ROUTES
// ================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Quick10 Backend is running!',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    time: new Date().toISOString(),
  });
});

// ── IMAGE UPLOAD ──────────────────────────────────────────────
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    res.json({ success: true, imageUrl: req.file.path });
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

app.post('/api/auth/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone and OTP required' });
  }

  // Test OTP
  if (otp === '123456') {
    try {
      let user = await User.findOne({ phone });
      if (!user) user = await User.create({ phone });
      return res.json({ success: true, message: 'Login successful', user });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  const stored = otpStore[phone];
  if (!stored) {
    return res.status(400).json({ success: false, message: 'OTP not sent. Please request again.' });
  }
  if (Date.now() > stored.expiresAt) {
    delete otpStore[phone];
    return res.status(400).json({ success: false, message: 'OTP expired.' });
  }
  if (stored.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
  delete otpStore[phone];

  try {
    let user = await User.findOne({ phone });
    if (!user) user = await User.create({ phone });
    res.json({ success: true, message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PRODUCTS ──────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { active: true };
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/products/all', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
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

    const product = await Product.create({
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
    });

    console.log('Product added to MongoDB: ' + name);
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── CATEGORIES ────────────────────────────────────────────────
app.get('/api/categories', (req, res) => {
  res.json({ success: true, categories });
});

// ── USERS ─────────────────────────────────────────────────────
app.get('/api/users/:phone', async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/users/:phone', async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (req.body.name) user.name = req.body.name;
    if (req.body.address) user.addresses.push({ id: 'a' + Date.now(), ...req.body.address });
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ORDERS ────────────────────────────────────────────────────
app.post('/api/orders', async (req, res) => {
  try {
    const { phone, items, address, paymentMethod, total } = req.body;
    if (!phone || !items || !address) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const order = await Order.create({
      phone, items, address,
      paymentMethod, total,
      status: 'placed',
    });
    console.log('New Order: ' + order._id + ' by ' + phone);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/orders/user/:phone', async (req, res) => {
  try {
    const orders = await Order.find({ phone: req.params.phone }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
        ...(req.body.deliveryPartnerId && { deliveryPartnerId: req.body.deliveryPartnerId }),
      },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELIVERY ──────────────────────────────────────────────────
app.get('/api/delivery/available-orders', async (req, res) => {
  try {
    const orders = await Order.find({
      status: 'packed',
      deliveryPartnerId: null,
    }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/delivery/accept-order', async (req, res) => {
  try {
    const { orderId, deliveryPartnerId } = req.body;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'picked', deliveryPartnerId },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================================================================
// SERVER START + SELF PING
// ================================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('Quick10 Backend running on port ' + PORT);
  console.log('MongoDB connecting...');
  console.log('Test OTP: 123456');

  setInterval(() => {
    https.get('https://quick10backend.onrender.com/health', (res) => {
      console.log('Self ping OK - ' + new Date().toLocaleTimeString());
    }).on('error', (err) => {
      console.log('Ping error: ' + err.message);
    });
  }, 14 * 60 * 1000);
});