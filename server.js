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

const SubCategorySchema = new mongoose.Schema({
  name: String,
  categoryId: String, // Mother Category से link
  imageUrl: String,
  active: { type: Boolean, default: true },
}, { timestamps: true, strict: false });

const SubCategory = mongoose.model('SubCategory', SubCategorySchema);

const ProductSchema = new mongoose.Schema({
  name:            String,
  price:           Number,
  mrp:             Number,
  weight:          String,
  description:     String,
  tags:            [String],
  category:        String,
  categoryName:    String,
  // ✅ Multi-category fields
  motherCategory:  String,
  allCategory:     String,
  freshCategory:   String,
  subCategory:     String,
  subCategoryName: String,
  imageUrl:        String,
  emoji:           String,
  stock:           { type: Number, default: 100 },
  active:          { type: Boolean, default: true },
  showOnHome:      { type: Boolean, default: false },
  showInFresh:     { type: Boolean, default: false },
  homeSectionTitle:String,
  discount:        Number,
}, { timestamps: true, strict: false });

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
// ── SOCKET.IO ─────────────────────────────────────────────────
const connectedUsers = {};

const chatMessages = {};
const deliveryChatMessages = {};

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Customer register
  socket.on('register', (phone) => {
    connectedUsers[phone] = socket.id;
    if (otpStore[phone] && Date.now() < otpStore[phone].expiresAt) {
      socket.emit('otp_received', {
        otp: otpStore[phone].otp,
        message: `Quick10 OTP: ${otpStore[phone].otp}`,
      });
    }
  });

  // Admin register
  socket.on('register_admin', () => {
    connectedUsers['admin'] = socket.id;
    socket.emit('all_chats', chatMessages);
    socket.emit('all_delivery_chats', deliveryChatMessages);
  });

  // Customer → Admin chat
  socket.on('customer_message', (data) => {
    const { phone, message, name } = data;
    if (!chatMessages[phone]) chatMessages[phone] = { phone, name: name || phone, messages: [] };
    const msg = { id: Date.now(), text: message, sender: 'customer', time: new Date().toISOString() };
    chatMessages[phone].messages.push(msg);
    const adminSocketId = connectedUsers['admin'];
    if (adminSocketId) io.to(adminSocketId).emit('new_customer_message', { phone, name: name || phone, message: msg, allMessages: chatMessages[phone].messages });
    socket.emit('message_sent', msg);
  });

  // Admin → Customer reply
  socket.on('admin_reply', (data) => {
    const { phone, message } = data;
    if (!chatMessages[phone]) chatMessages[phone] = { phone, messages: [] };
    const msg = { id: Date.now(), text: message, sender: 'admin', time: new Date().toISOString() };
    chatMessages[phone].messages.push(msg);
    const customerSocketId = connectedUsers[phone];
    if (customerSocketId) io.to(customerSocketId).emit('admin_message', msg);
    socket.emit('reply_sent', { phone, msg });
  });

  // Customer chat history
  socket.on('get_chat_history', (phone) => {
    socket.emit('chat_history', chatMessages[phone]?.messages || []);
  });

  // ✅ Delivery Partner register
  socket.on('delivery_register', (data) => {
    const { phone, name } = data;
    connectedUsers[`delivery_${phone}`] = socket.id;
    onlineDeliveryPartners[phone] = { socketId: socket.id, name, phone, busy: false };
    console.log(`Delivery partner registered: ${phone}`);
  });

  // ✅ Delivery Partner → Admin chat
  socket.on('delivery_message', (data) => {
    const { phone, name, message, orderId } = data;
    if (!deliveryChatMessages[phone]) {
      deliveryChatMessages[phone] = { phone, name: name || phone, messages: [] };
    }
    const msg = {
      id: Date.now(),
      text: message,
      sender: 'delivery',
      orderId,
      time: new Date().toISOString(),
    };
    deliveryChatMessages[phone].messages.push(msg);
    const adminSocketId = connectedUsers['admin'];
    if (adminSocketId) {
      io.to(adminSocketId).emit('new_delivery_message', {
        phone, name: name || phone, message: msg,
        allMessages: deliveryChatMessages[phone].messages,
      });
    }
    socket.emit('delivery_message_sent', msg);
  });

  // ✅ Admin → Delivery Partner reply
  socket.on('admin_delivery_reply', (data) => {
    const { phone, message } = data;
    if (!deliveryChatMessages[phone]) deliveryChatMessages[phone] = { phone, messages: [] };
    const msg = { id: Date.now(), text: message, sender: 'admin', time: new Date().toISOString() };
    deliveryChatMessages[phone].messages.push(msg);
    const deliverySocketId = connectedUsers[`delivery_${phone}`];
    if (deliverySocketId) io.to(deliverySocketId).emit('admin_delivery_message', msg);
    socket.emit('delivery_reply_sent', { phone, msg });
  });

  // Delivery chat history
  socket.on('get_delivery_chat_history', (phone) => {
    socket.emit('delivery_chat_history', deliveryChatMessages[phone]?.messages || []);
  });

  // Delivery online/offline
  socket.on('delivery_online', (data) => {
    const { phone, name } = data;
    onlineDeliveryPartners[phone] = { socketId: socket.id, name, phone, busy: false };
  });

  socket.on('delivery_offline', (phone) => {
    delete onlineDeliveryPartners[phone];
  });

  socket.on('delivery_busy', (phone) => {
    if (onlineDeliveryPartners[phone]) onlineDeliveryPartners[phone].busy = true;
  });

  socket.on('delivery_free', (phone) => {
    if (onlineDeliveryPartners[phone]) onlineDeliveryPartners[phone].busy = false;
  });

  socket.on('disconnect', () => {
    Object.keys(connectedUsers).forEach(key => {
      if (connectedUsers[key] === socket.id) delete connectedUsers[key];
    });
    Object.keys(onlineDeliveryPartners).forEach(key => {
      if (onlineDeliveryPartners[key]?.socketId === socket.id) delete onlineDeliveryPartners[key];
    });
  });
});

// ✅ Get Admin/Manager phone
app.get('/api/admin/phone', async (req, res) => {
  try {
    const admin = await Staff.findOne({ role: 'admin' });
    res.json({ success: true, phone: admin?.phone || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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
    const { category, freshCategory, allCategory } = req.query;
    let filter = { active: true };

    if (freshCategory && freshCategory !== 'all') {
      filter.$or = [
        { freshCategory: freshCategory },
        { category:      freshCategory },
      ];
    } else if (allCategory && allCategory !== 'all') {
      filter.$or = [
        { allCategory: allCategory },
        { category:    allCategory },
      ];
    } else if (category && category !== 'all') {
      filter.$or = [
        { category:       category },
        { motherCategory: category },
        { allCategory:    category },
        { freshCategory:  category },
      ];
    }

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
    const { id } = req.params;
    const body = req.body;
    console.log('PUT /api/products/:id — id:', id);
    console.log('PUT body keys:', Object.keys(body));
    console.log('PUT body fields:', {
      description:    body.description,
      motherCategory: body.motherCategory,
      allCategory:    body.allCategory,
      freshCategory:  body.freshCategory,
      tags:           body.tags,
    });
    const result = await Product.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, strict: false }
    );
    if (!result) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    console.log('PUT saved fields:', {
      description:    result.description,
      motherCategory: result.motherCategory,
      allCategory:    result.allCategory,
      freshCategory:  result.freshCategory,
      tags:           result.tags,
    });
    res.json({ success: true, product: result });
  } catch (err) {
    console.log('PUT error:', err.message);
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
// ── SUB CATEGORIES ───────────────────────────────────────────
app.get('/api/sub-categories', async (req, res) => {
  try {
    const { categoryId } = req.query;
    const filter = { active: true };
    if (categoryId) filter.categoryId = categoryId;
    const cats = await SubCategory.find(filter);
    res.json({ success: true, categories: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/sub-categories', async (req, res) => {
  try {
    const cat = new SubCategory(req.body);
    await cat.save();
    res.json({ success: true, category: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/sub-categories/:id', async (req, res) => {
  try {
    const cat = await SubCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, category: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/sub-categories/:id', async (req, res) => {
  try {
    await SubCategory.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── HOME SECTIONS (products by category) ─────────────────────
app.get('/api/home-sections', async (req, res) => {
  try {
    // सब active products fetch करो
    const products = await Product.find({ active: true });

    // Mother categories fetch करो
    const motherCats = await MotherCategory.find({ active: true });

    // हर category के products group करो
    const sections = [];

    for (const cat of motherCats) {
      const catProducts = products.filter(p => p.category === cat.categoryId || p.category === cat._id.toString());
      if (catProducts.length === 0) continue;

      // Sub-categories के हिसाब से group करो
      const subCatMap = {};
      for (const p of catProducts) {
        const key = p.subCategory || 'general';
        if (!subCatMap[key]) {
          subCatMap[key] = {
            subCategoryId: key,
            subCategoryName: p.subCategoryName || cat.name,
            products: [],
          };
        }
        subCatMap[key].products.push(p);
      }

      sections.push({
        categoryId: cat.categoryId || cat._id,
        categoryName: cat.name,
        iconUrl: cat.iconUrl,
        subSections: Object.values(subCatMap),
      });
    }

    res.json({ success: true, sections });
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
// ── MONGODB INDEXES (Performance) ────────────────────────────
mongoose.connection.once('open', async () => {
  try {
    await Product.collection.createIndex({ category: 1 });
    await Product.collection.createIndex({ subCategory: 1 });
    await Product.collection.createIndex({ active: 1 });
    await Product.collection.createIndex({ showOnHome: 1 });
    await Product.collection.createIndex({ showInFresh: 1 });
    await Order.collection.createIndex({ userPhone: 1 });
    await Order.collection.createIndex({ status: 1 });
    await Order.collection.createIndex({ assignedTo: 1 });
    console.log('✅ MongoDB Indexes created');
  } catch (err) {
    console.log('Index error:', err.message);
  }
});

// ── HOME SECTIONS with Pagination ────────────────────────────
app.get('/api/home-sections', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 4;

    const products = await Product.find({ active: true }).lean();
    const motherCats = await MotherCategory.find({ active: true })
      .sort({ order: 1 })
      .skip(page * limit)
      .limit(limit)
      .lean();

    const sections = [];

    for (const cat of motherCats) {
      const catId = cat.categoryId || cat._id.toString();
      const catProducts = products.filter(p =>
        p.category === catId || p.category === cat._id.toString()
      );
      if (catProducts.length === 0) continue;

      const subCatMap = {};
      for (const p of catProducts) {
        const key = p.subCategory || 'general';
        if (!subCatMap[key]) {
          subCatMap[key] = {
            subCategoryId: key,
            subCategoryName: p.subCategoryName || cat.name,
            products: [],
          };
        }
        subCatMap[key].products.push(p);
      }

      sections.push({
        categoryId: catId,
        categoryName: cat.name,
        iconUrl: cat.iconUrl,
        subSections: Object.values(subCatMap),
      });
    }

    res.json({ success: true, sections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// ── THEME SCHEMA ─────────────────────────────────────────────
const ThemeSchema = new mongoose.Schema({
  gradientColors:  { type: Array,   default: ['#B9E6CC', '#F0FBF4', '#FFFFFF'] },
  backgroundImage: { type: String,  default: null },
  floatingEmoji:   { type: String,  default: null },
  isActive:        { type: Boolean, default: true },
  label:           { type: String,  default: 'Default Theme' },
}, { timestamps: true });
const Theme = mongoose.model('Theme', ThemeSchema);

// ── THEME ROUTES ──────────────────────────────────────────────
app.get('/api/theme', async (req, res) => {
  try {
    let theme = await Theme.findOne({});
    if (!theme) { theme = new Theme({}); await theme.save(); }
    res.json({ success: true, theme });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/theme', async (req, res) => {
  try {
    let theme = await Theme.findOne({});
    if (!theme) theme = new Theme({});
    const { gradientColors, backgroundImage, floatingEmoji, isActive, label } = req.body;
    if (gradientColors)            theme.gradientColors   = gradientColors;
    if (backgroundImage !== undefined) theme.backgroundImage = backgroundImage;
    if (floatingEmoji   !== undefined) theme.floatingEmoji   = floatingEmoji;
    if (isActive        !== undefined) theme.isActive        = isActive;
    if (label)                     theme.label            = label;
    await theme.save();
    res.json({ success: true, theme });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
const SectionSchema = new mongoose.Schema({
  name:   { type: String, unique: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });
const Section = mongoose.model('Section', SectionSchema);
app.get('/api/sections', async (req, res) => {
  try {
    const sections = await Section.find({ active: true }).sort({ createdAt: -1 });
    res.json({ success: true, sections });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/sections', async (req, res) => {
  try {
    const { name } = req.body;
    const section = new Section({ name });
    await section.save();
    res.json({ success: true, section });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/api/sections/:id', async (req, res) => {
  try {
    await Section.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/home-sections-by-title', async (req, res) => {
  try {
    const sections = await Section.find({ active: true });
    const result = [];
    for (const sec of sections) {
      const products = await Product.find({
        homeSectionTitle: sec.name, active: true
      }).lean();
      if (products.length > 0) {
        result.push({ sectionId: sec._id, sectionName: sec.name, products });
      }
    }
    res.json({ success: true, sections: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
const SectionSchema = new mongoose.Schema({
  name:   { type: String, unique: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });
const Section = mongoose.model('Section', SectionSchema);

app.get('/api/sections', async (req, res) => {
  try {
    const sections = await Section.find({ active: true }).sort({ createdAt: -1 });
    res.json({ success: true, sections });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/sections', async (req, res) => {
  try {
    const { name } = req.body;
    const section = new Section({ name });
    await section.save();
    res.json({ success: true, section });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/api/sections/:id', async (req, res) => {
  try {
    await Section.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/home-sections-by-title', async (req, res) => {
  try {
    const sections = await Section.find({ active: true });
    const result = [];
    for (const sec of sections) {
      const products = await Product.find({
        homeSectionTitle: sec.name, active: true
      }).lean();
      if (products.length > 0) {
        result.push({ sectionId: sec._id, sectionName: sec.name, products });
      }
    }
    res.json({ success: true, sections: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
// ── APP CONTROL ───────────────────────────────────────────
const AppControlSchema = new mongoose.Schema({
  isOpen:       { type: Boolean, default: true },
  openTime:     { type: String,  default: '06:00' },
  closeTime:    { type: String,  default: '22:00' },
  closedMessage:{ type: String,  default: 'App अभी बंद है। सुबह 6 बजे से फिर चालू होगा।' },
}, { timestamps: true });
const AppControl = mongoose.model('AppControl', AppControlSchema);

app.get('/api/app-control', async (req, res) => {
  try {
    let ctrl = await AppControl.findOne({});
    if (!ctrl) { ctrl = new AppControl({}); await ctrl.save(); }
    res.json({ success: true, control: ctrl });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/app-control', async (req, res) => {
  try {
    let ctrl = await AppControl.findOne({});
    if (!ctrl) ctrl = new AppControl({});
    const { isOpen, openTime, closeTime, closedMessage } = req.body;
    if (isOpen        !== undefined) ctrl.isOpen         = isOpen;
    if (openTime)                    ctrl.openTime        = openTime;
    if (closeTime)                   ctrl.closeTime       = closeTime;
    if (closedMessage)               ctrl.closedMessage   = closedMessage;
    await ctrl.save();
    res.json({ success: true, control: ctrl });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PROMO CODES ───────────────────────────────────────────
const PromoSchema = new mongoose.Schema({
  code:       { type: String, unique: true, uppercase: true },
  type:       { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  value:      { type: Number, default: 10 },
  minOrder:   { type: Number, default: 0 },
  maxUses:    { type: Number, default: 100 },
  usedCount:  { type: Number, default: 0 },
  active:     { type: Boolean, default: true },
  expiryDate: { type: Date, default: null },
}, { timestamps: true });
const Promo = mongoose.model('Promo', PromoSchema);

app.get('/api/promo-codes', async (req, res) => {
  try {
    const promos = await Promo.find({}).sort({ createdAt: -1 });
    res.json({ success: true, promos });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/promo-codes', async (req, res) => {
  try {
    const promo = new Promo(req.body);
    await promo.save();
    res.json({ success: true, promo });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/promo-codes/validate', async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const promo = await Promo.findOne({ code: code.toUpperCase(), active: true });
    if (!promo) return res.json({ success: false, message: 'Invalid coupon code' });
    if (promo.expiryDate && new Date() > promo.expiryDate)
      return res.json({ success: false, message: 'Coupon expired हो गया' });
    if (promo.usedCount >= promo.maxUses)
      return res.json({ success: false, message: 'Coupon limit पूरी हो गई' });
    if (orderAmount < promo.minOrder)
      return res.json({ success: false, message: `Minimum order ₹${promo.minOrder} चाहिए` });
    const discount = promo.type === 'percent'
      ? Math.round((orderAmount * promo.value) / 100)
      : promo.value;
    res.json({ success: true, promo, discount, message: `₹${discount} की छूट मिली!` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/promo-codes/:id', async (req, res) => {
  try {
    const promo = await Promo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, promo });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/api/promo-codes/:id', async (req, res) => {
  try {
    await Promo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── ATTENDANCE ────────────────────────────────────────────
const AttendanceSchema = new mongoose.Schema({
  staffPhone: String,
  staffName:  String,
  date:       String,
  checkIn:    String,
  checkOut:   String,
  status:     { type: String, default: 'present' },
}, { timestamps: true });
const Attendance = mongoose.model('Attendance', AttendanceSchema);

app.get('/api/attendance', async (req, res) => {
  try {
    const { date } = req.query;
    const filter = date ? { date } : {};
    const records = await Attendance.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const record = new Attendance(req.body);
    await record.save();
    res.json({ success: true, record });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/attendance/:id', async (req, res) => {
  try {
    const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, record });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── WEEKLY REPORT ─────────────────────────────────────────
app.get('/api/reports/weekly', async (req, res) => {
  try {
    const now   = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 7);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: now },
    }).lean();

    const totalOrders    = orders.length;
    const deliveredOrders= orders.filter(o => o.status === 'delivered');
    const totalRevenue   = deliveredOrders.reduce((s, o) => s + (o.total || 0), 0);
    const pendingOrders  = orders.filter(o => o.status === 'pending' || o.status === 'packed').length;
    const cancelledOrders= orders.filter(o => o.status === 'cancelled').length;

    // Daily breakdown
    const dailyMap = {};
    orders.forEach(o => {
      const day = new Date(o.createdAt).toLocaleDateString('en-IN');
      if (!dailyMap[day]) dailyMap[day] = { orders: 0, revenue: 0 };
      dailyMap[day].orders++;
      if (o.status === 'delivered') dailyMap[day].revenue += (o.total || 0);
    });

    res.json({
      success: true,
      report: {
        totalOrders, totalRevenue,
        deliveredOrders: deliveredOrders.length,
        pendingOrders, cancelledOrders,
        dailyBreakdown: dailyMap,
        period: { start, end: now },
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── SERVER START ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Quick10 Backend running on port ${PORT}`);
  console.log(`Socket.io ready`);
});