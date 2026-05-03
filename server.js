const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB Connect
const MONGODB_URI = 'mongodb+srv://quickadmin:dev271201deva@cluster0.o9mlhyd.mongodb.net/quick10?retryWrites=true&w=majority';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected!'))
  .catch(err => console.log('MongoDB Error:', err));

// Self ping (prevent sleep)
setInterval(() => {
  fetch('https://quick10backend.onrender.com/health').catch(() => {});
}, 14 * 60 * 1000);

// ── SCHEMAS ──────────────────────────────────────────────────
const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  mrp: Number,
  weight: String,
  category: String,
  imageUrl: String,
  emoji: String,
  stock: { type: Number, default: 100 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
  name: String,
  categoryId: { type: String },
  imageUrl: String,
  color: String,
  bg: String,
  active: { type: Boolean, default: true },
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  orderId: String,
  userPhone: String,
  items: Array,
  total: Number,
  address: Object,
  status: { type: String, default: 'pending' },
  paymentMethod: String,
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  phone: { type: String, unique: true },
  name: String,
  email: String,
  addresses: Array,
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);
const Category = mongoose.model('Category', CategorySchema);
const Order = mongoose.model('Order', OrderSchema);
const User = mongoose.model('User', UserSchema);

// ── HEALTH ───────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

// ── AUTH ─────────────────────────────────────────────────────
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const otp = '123456';
    console.log(`OTP for ${phone}: ${otp}`);
    res.json({ success: true, message: 'OTP sent', otp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (otp !== '123456') {
      return res.json({ success: false, message: 'Invalid OTP' });
    }
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone });
      await user.save();
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PRODUCTS ─────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { active: true };
    if (category && category !== 'all') filter.category = category;
    const products = await Product.find(filter);
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/products/all', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const result = await Product.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── CATEGORIES ───────────────────────────────────────────────
app.get('/api/categories', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const categories = await Category.find({ active: true });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, categoryId, imageUrl, color, bg, active } = req.body;
    const category = new Category({ name, categoryId, imageUrl, color, bg, active });
    await category.save();
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const { name, categoryId, imageUrl, color, bg, active } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, categoryId, imageUrl, color, bg, active },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ FIXED: Actually verifies deletion
app.delete('/api/categories/:id', async (req, res) => {
  try {
    console.log('DELETE category request for ID:', req.params.id);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const result = await Category.findByIdAndDelete(req.params.id);
    console.log('Delete result:', result);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Category not found in DB' });
    }

    res.json({ success: true, message: 'Category deleted', deleted: result });
  } catch (err) {
    console.log('Delete error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ NEW: Cleanup all categories (one-time use)
app.delete('/api/categories-reset/all', async (req, res) => {
  try {
    const result = await Category.deleteMany({});
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} categories`,
      count: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ORDERS ───────────────────────────────────────────────────
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orderId = 'ORD' + Date.now();
    const order = new Order({ ...req.body, orderId });
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/orders/user/:phone', async (req, res) => {
  try {
    const orders = await Order.find({ userPhone: req.params.phone }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELIVERY ─────────────────────────────────────────────────
app.get('/api/delivery/available-orders', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'packed' });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/delivery/accept-order', async (req, res) => {
  try {
    const { orderId, deliveryPartner } = req.body;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'out_for_delivery', deliveryPartner },
      { new: true }
    );
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── USERS ────────────────────────────────────────────────────
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

app.delete('/api/users/:phone/addresses/:addressId', async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.addresses = user.addresses.filter(a => a.id !== req.params.addressId);
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/users/:phone', async (req, res) => {
  try {
    const { address, name, email } = req.body;
    let user = await User.findOne({ phone: req.params.phone });
    if (!user) {
      user = new User({ phone: req.params.phone });
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (address) {
      if (!user.addresses) user.addresses = [];
      const exists = user.addresses.find(a => a.id === address.id);
      if (!exists) {
        user.addresses.push(address);
      }
    }
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── IMAGE UPLOAD ─────────────────────────────────────────────
app.post('/api/upload', async (req, res) => {
  try {
    const { image } = req.body;
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: 'dw1fwrcz0',
      api_key: '935717982737519',
      api_secret: 'bwpi2vW6bGxiCbfSoe3N0ShP6Ko',
    });
    const result = await cloudinary.uploader.upload(image, { folder: 'quick10' });
    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// ── FRESH CATEGORIES ──────────────────────────────────────
const FreshCategorySchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const FreshCategory = mongoose.model('FreshCategory', FreshCategorySchema);

app.get('/api/fresh-categories', async (req, res) => {
  try {
    const cats = await FreshCategory.find({ active: true }).sort({ order: 1 });
    res.json({ success: true, categories: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/fresh-categories', async (req, res) => {
  try {
    const cat = new FreshCategory(req.body);
    await cat.save();
    res.json({ success: true, category: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/fresh-categories/:id', async (req, res) => {
  try {
    const cat = await FreshCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, category: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/fresh-categories/:id', async (req, res) => {
  try {
    await FreshCategory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// ── STAFF ─────────────────────────────────────────────────
const StaffSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'picker' }, // admin | picker
  bankName: String,
  accountNo: String,
  ifsc: String,
  active: { type: Boolean, default: true },
}, { timestamps: true });

const Staff = mongoose.model('Staff', StaffSchema);

app.get('/api/staff', async (req, res) => {
  try {
    const staff = await Staff.find({}).sort({ createdAt: -1 });
    res.json({ success: true, staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/staff', async (req, res) => {
  try {
    const exists = await Staff.findOne({ phone: req.body.phone });
    if (exists) return res.json({ success: false, message: 'यह phone number पहले से registered है' });
    const staff = new Staff(req.body);
    await staff.save();
    res.json({ success: true, staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  try {
    await Staff.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Staff removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Staff login
app.post('/api/staff/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const staff = await Staff.findOne({ phone, password, active: true });
    if (!staff) return res.json({ success: false, message: 'Phone या password गलत है' });
    res.json({ success: true, staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Quick10 Backend running on port ${PORT}`);
  console.log(`Test OTP: 123456`);
});