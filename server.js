const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB Connect
const MONGODB_URI = 'mongodb+srv://quickadmin:dev271201deva@cluster0.o9mlhyd.mongodb.net/quick10?retryWrites=true&w=majority';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected!'))
  .catch(err => console.log('MongoDB Error:', err));

// Self ping
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
  showInHeader: { type: Boolean, default: false },
  showInAll: { type: Boolean, default: true },
}, { timestamps: true });

const MotherCategorySchema = new mongoose.Schema({
  name: String,
  categoryId: { type: String, unique: true },
  iconUrl: String,
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const FreshCategorySchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  orderId: String,
  userPhone: String,
  items: Array,
  total: Number,
  address: Object,
  status: { type: String, default: 'pending' },
  paymentMethod: String,
  deliveryPartner: Object,
  assignedTo: { type: String, default: null },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  phone: { type: String, unique: true },
  name: String,
  email: String,
  addresses: Array,
}, { timestamps: true });

const StaffSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'picker' },
  bankName: String,
  accountNo: String,
  ifsc: String,
  active: { type: Boolean, default: true },
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);
const Category = mongoose.model('Category', CategorySchema);
const MotherCategory = mongoose.model('MotherCategory', MotherCategorySchema);
const FreshCategory = mongoose.model('FreshCategory', FreshCategorySchema);
const Order = mongoose.model('Order', OrderSchema);
const User = mongoose.model('User', UserSchema);
const Staff = mongoose.model('Staff', StaffSchema);

// ── OTP STORE (in-memory, 2 min expiry) ──────────────────────
const otpStore = {};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const cleanExpiredOTPs = () => {
  const now = Date.now();
  Object.keys(otpStore).forEach(phone => {
    if (otpStore[phone].expiresAt < now) {
      delete otpStore[phone];
      console.log(`OTP expired and deleted for ${phone}`);
    }
  });
};

// Every 30 seconds clean expired OTPs
setInterval(cleanExpiredOTPs, 30 * 1000);

// ── SOCKET.IO ─────────────────────────────────────────────────
const connectedUsers = {}; // phone → socketId

const chatMessages = {}; // phone → messages array

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('register', (phone) => {
    connectedUsers[phone] = socket.id;
    console.log(`Phone ${phone} registered`);
    if (otpStore[phone] && Date.now() < otpStore[phone].expiresAt) {
      socket.emit('otp_received', {
        otp: otpStore[phone].otp,
        message: `Quick10 OTP: ${otpStore[phone].otp}`,
      });
    }
  });

  // ✅ Admin register
  socket.on('register_admin', () => {
    connectedUsers['admin'] = socket.id;
    console.log('Admin registered:', socket.id);
    // Admin को सब active chats भेजो
    socket.emit('all_chats', chatMessages);
  });

  // ✅ Customer → message भेजो
  socket.on('customer_message', (data) => {
    const { phone, message, name } = data;
    if (!chatMessages[phone]) {
      chatMessages[phone] = { phone, name: name || phone, messages: [] };
    }
    const msg = {
      id: Date.now(),
      text: message,
      sender: 'customer',
      time: new Date().toISOString(),
    };
    chatMessages[phone].messages.push(msg);

    // Admin को notify करो
    const adminSocketId = connectedUsers['admin'];
    if (adminSocketId) {
      io.to(adminSocketId).emit('new_customer_message', {
        phone,
        name: name || phone,
        message: msg,
        allMessages: chatMessages[phone].messages,
      });
    }

    // Customer को confirm करो
    socket.emit('message_sent', msg);
  });

  // ✅ Admin → reply भेजो
  socket.on('admin_reply', (data) => {
    const { phone, message } = data;
    if (!chatMessages[phone]) {
      chatMessages[phone] = { phone, messages: [] };
    }
    const msg = {
      id: Date.now(),
      text: message,
      sender: 'admin',
      time: new Date().toISOString(),
    };
    chatMessages[phone].messages.push(msg);

    // Customer को भेजो
    const customerSocketId = connectedUsers[phone];
    if (customerSocketId) {
      io.to(customerSocketId).emit('admin_message', msg);
    }

    // Admin को confirm करो
    socket.emit('reply_sent', { phone, msg });
  });

  // ✅ Chat history request
  socket.on('get_chat_history', (phone) => {
    const history = chatMessages[phone]?.messages || [];
    socket.emit('chat_history', history);
  });

  socket.on('disconnect', () => {
    Object.keys(connectedUsers).forEach(key => {
      if (connectedUsers[key] === socket.id) {
        delete connectedUsers[key];
      }
    });
    console.log('Socket disconnected:', socket.id);
  });
});

// ── HEALTH ───────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

// ── AUTH ─────────────────────────────────────────────────────
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length !== 10) {
      return res.json({ success: false, message: 'Valid 10-digit phone number डालो' });
    }

    const otp = generateOTP();

    // OTP store — 2 minute expiry
    otpStore[phone] = {
      otp,
      expiresAt: Date.now() + 2 * 60 * 1000, // 2 minutes
    };

    console.log(`OTP for ${phone}: ${otp}`);

    // ✅ Socket से real-time OTP भेजो
    const socketId = connectedUsers[phone];
    if (socketId) {
      io.to(socketId).emit('otp_received', {
        otp,
        message: `Quick10 OTP: ${otp} (2 minutes valid)`,
      });
      console.log(`OTP sent via socket to ${phone}`);
    }

    // 2Factor voice OTP भी try करो
   

    res.json({
      success: true,
      message: 'OTP sent',
      // Dev mode में OTP भी भेजो
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const stored = otpStore[phone];

    if (!stored) {
      return res.json({ success: false, message: 'OTP expire हो गया। फिर भेजो।' });
    }

    if (Date.now() > stored.expiresAt) {
      delete otpStore[phone];
      return res.json({ success: false, message: 'OTP expire हो गया (2 min)। फिर भेजो।' });
    }

    if (stored.otp !== otp.toString()) {
      return res.json({ success: false, message: 'OTP गलत है' });
    }

    // ✅ OTP सही — तुरंत delete करो
    delete otpStore[phone];

    // User find या create
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone });
      await user.save();
    }

    res.json({ success: true, user, message: 'Login successful' });
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
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
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
    const category = new Category(req.body);
    await category.save();
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    let id = req.params.id;
    let result;
    if (mongoose.Types.ObjectId.isValid(id)) {
      result = await Category.findByIdAndDelete(id);
    }
    if (!result) {
      result = await Category.findOneAndDelete({ categoryId: id });
    }
    if (!result) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── MOTHER CATEGORIES ─────────────────────────────────────────
app.get('/api/mother-categories', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const cats = await MotherCategory.find({ active: true }).sort({ order: 1 });
    res.json({ success: true, categories: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/mother-categories', async (req, res) => {
  try {
    const cat = new MotherCategory(req.body);
    await cat.save();
    res.json({ success: true, category: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/mother-categories/:id', async (req, res) => {
  try {
    const cat = await MotherCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, category: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/mother-categories/:id', async (req, res) => {
  try {
    const result = await MotherCategory.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── FRESH CATEGORIES ─────────────────────────────────────────
app.get('/api/fresh-categories', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
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
    const result = await FreshCategory.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
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
    const { status, deliveryPartner } = req.body;
    const updateData = { status };
    if (deliveryPartner) updateData.deliveryPartner = deliveryPartner;
    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELIVERY ─────────────────────────────────────────────────
// ── DELIVERY ─────────────────────────────────────────────────

// Online delivery partners store
const onlineDeliveryPartners = {}; // phone → { socketId, pushToken, name, busy }

// ✅ Delivery partner online register
io.on('connection', (socket) => {
  // ... existing code के अंदर यह add करो

  socket.on('delivery_online', (data) => {
    const { phone, name, pushToken } = data;
    onlineDeliveryPartners[phone] = {
      socketId: socket.id,
      pushToken,
      name,
      phone,
      busy: false,
    };
    console.log(`Delivery partner online: ${phone}`);
  });

  socket.on('delivery_offline', (phone) => {
    delete onlineDeliveryPartners[phone];
    console.log(`Delivery partner offline: ${phone}`);
  });

  socket.on('delivery_busy', (phone) => {
    if (onlineDeliveryPartners[phone]) {
      onlineDeliveryPartners[phone].busy = true;
    }
  });

  socket.on('delivery_free', (phone) => {
    if (onlineDeliveryPartners[phone]) {
      onlineDeliveryPartners[phone].busy = false;
    }
  });
});

// ✅ Available orders (packed)
app.get('/api/delivery/available-orders', async (req, res) => {
  try {
    const orders = await Order.find({
      status: 'packed',
      assignedTo: null,
    });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Accept order
app.put('/api/delivery/accept-order', async (req, res) => {
  try {
    const { orderId, deliveryPartner } = req.body;
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'out_for_delivery',
        deliveryPartner,
        assignedTo: deliveryPartner.phone,
      },
      { new: true }
    );

    // Mark partner as busy
    if (onlineDeliveryPartners[deliveryPartner.phone]) {
      onlineDeliveryPartners[deliveryPartner.phone].busy = true;
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Reject order → 2 sec में next partner को
app.put('/api/delivery/reject-order', async (req, res) => {
  try {
    const { orderId, rejectedBy } = req.body;

    // Order वापस packed status में
    await Order.findByIdAndUpdate(orderId, {
      assignedTo: null,
      status: 'packed',
    });

    res.json({ success: true });

    // 2 second बाद next available partner को भेजो
    setTimeout(async () => {
      const order = await Order.findById(orderId);
      if (!order || order.status !== 'packed') return;

      // Available partners (not busy, not the one who rejected)
      const availablePartners = Object.values(onlineDeliveryPartners).filter(
        p => !p.busy && p.phone !== rejectedBy
      );

      if (availablePartners.length > 0) {
        const nextPartner = availablePartners[0];
        // Socket से notify करो
        io.to(nextPartner.socketId).emit('new_order_available', {
          order,
          message: 'नया order available है!',
        });
      }
    }, 2000);

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Deliver order
app.put('/api/delivery/deliver-order', async (req, res) => {
  try {
    const { orderId, deliveryPartnerPhone } = req.body;
    await Order.findByIdAndUpdate(orderId, { status: 'delivered' });

    // Partner free करो
    if (onlineDeliveryPartners[deliveryPartnerPhone]) {
      onlineDeliveryPartners[deliveryPartnerPhone].busy = false;
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ My active order
app.get('/api/delivery/my-order/:phone', async (req, res) => {
  try {
    const order = await Order.findOne({
      assignedTo: req.params.phone,
      status: 'out_for_delivery',
    });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── USERS ────────────────────────────────────────────────────
app.get('/api/users/:phone', async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone });
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/users/:phone', async (req, res) => {
  try {
    const { address, name, email } = req.body;
    let user = await User.findOne({ phone: req.params.phone });
    if (!user) user = new User({ phone: req.params.phone });
    if (name) user.name = name;
    if (email) user.email = email;
    if (address) {
      if (!user.addresses) user.addresses = [];
      const exists = user.addresses.find(a => a.id === address.id);
      if (!exists) user.addresses.push(address);
    }
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/users/:phone/addresses/:addressId', async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone });
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    user.addresses = user.addresses.filter(a => a.id !== req.params.addressId);
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── STAFF ─────────────────────────────────────────────────────
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
    if (exists) return res.json({ success: false, message: 'Phone already registered' });
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
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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
// ── RAZORPAY ─────────────────────────────────────────────────
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: 'rzp_test_SmOBM3Muj6dQnF',
  key_secret: '5M8Z7lP82qM4cNPxaQyrx12k',
});

app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100, // Paise में
      currency: 'INR',
      receipt: 'order_' + Date.now(),
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const crypto = require('crypto');
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', '5M8Z7lP82qM4cNPxaQyrx12k')
      .update(sign)
      .digest('hex');
    if (expectedSign === razorpay_signature) {
      res.json({ success: true, message: 'Payment verified!' });
    } else {
      res.json({ success: false, message: 'Invalid signature' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── SERVER START ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Quick10 Backend running on port ${PORT}`);
  console.log(`Socket.io ready`);
});