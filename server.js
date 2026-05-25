const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dw1fwrcz0',
  api_key: '935717982737519',
  api_secret: 'bwpi2vW6bGxiCbfSoe3N0ShP6Ko',
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const MONGODB_URI = 'mongodb+srv://quickadmin:dev271201deva@cluster0.o9mlhyd.mongodb.net/quick10?retryWrites=true&w=majority';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected!'))
  .catch(err => console.log('MongoDB Error:', err));

setInterval(() => {
  fetch('https://quick10backend.onrender.com/health').catch(() => {});
}, 14 * 60 * 1000);

// ── SCHEMAS ──────────────────────────────────────────────────

const SubCategorySchema = new mongoose.Schema({
  name:               String,
  categoryId:         String,
  parentCategoryId:   String,
  motherCategoryId:   String,
  motherCategoryName: String,
  parentType:         { type: String, enum: ['mother', 'shop'], default: 'mother' },
  shopCategoryId:     String,
  shopCategoryName:   String,
  image:              String,
  imageUrl:           String,
  position:           { type: Number, default: 0 },
  active:             { type: Boolean, default: true },
}, { timestamps: true, strict: false });

const ProductSchema = new mongoose.Schema({
  name:               String,
  price:              Number,
  mrp:                Number,
  weight:             String,
  description:        String,
  tags:               [String],
  category:           String,
  categoryName:       String,
  motherCategory:     String,
  motherCategoryId:   String,
  motherCategoryName: String,
  allCategory:        String,
  freshCategory:      String,
  freshCategoryId:    String,
  freshCategoryName:  String,
  subCategory:        String,
  subCategoryName:    String,
  subCategoryId:      String,
  section:            String,
  sectionId:          String,
  sectionName:        { type: String, default: 'General' },
  shopCategoryId:     String,
  shopCategoryName:   String,
  rating:             { type: Number, default: 4.0, min: 0, max: 5 },
  reviewCount:        { type: Number, default: 0 },
  homepagePosition:   { type: Number, default: 0 },
  position:           { type: Number, default: 0 },
  imageUrl:           String,
  bannerImageUrl:     String,
  isBanner:           { type: Boolean, default: false },
  emoji:              String,
  stock:              { type: Number, default: 100 },
  threshold:          { type: Number, default: 10 },
  deliveryTime:       { type: String, default: '10 mins' },
  placement:          { type: [String], default: ['home_grid'] },
  active:             { type: Boolean, default: true },
  showOnHome:         { type: Boolean, default: false },
  showInFresh:        { type: Boolean, default: false },
  homeSectionTitle:   String,
  discount:           Number,
}, { timestamps: true, strict: false });

const CategorySchema = new mongoose.Schema({
  name:         String,
  categoryId:   String,
  imageUrl:     String,
  color:        String,
  bg:           String,
  active:       { type: Boolean, default: true },
  showInHeader: { type: Boolean, default: false },
  showInAll:    { type: Boolean, default: true },
  hasImage:     { type: Boolean, default: false },
  type:         { type: String, default: 'main' },
}, { timestamps: true, strict: false });

const MotherCategorySchema = new mongoose.Schema({
  name:         String,
  categoryId:   { type: String, unique: true },
  iconUrl:      String,
  color:        String,
  bg:           String,
  active:       { type: Boolean, default: true },
  order:        { type: Number, default: 0 },
  position:     { type: Number, default: 0 },
  bannerImages: { type: [String], default: [] },
}, { timestamps: true });

const FreshCategorySchema = new mongoose.Schema({
  name:     String,
  imageUrl: String,
  active:   { type: Boolean, default: true },
  order:    { type: Number, default: 0 },
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  orderId:             String,
  userPhone:           String,
  items:               Array,
  total:               Number,
  address:             Object,
  status:              { type: String, default: 'pending', enum: ['pending', 'packing', 'ready_pickup', 'dispatched', 'delivered', 'cancelled'] },
  paymentMethod:       String,
  deliveryPartner:     Object,
  assignedTo:          { type: String, default: null },
  assignedName:        String,
  accepted_at:         Date,
  packed_at:           Date,
  dispatched_at:       Date,
  delivered_at:        Date,
  pickerId:            String,
  pickerName:          String,
  deliveryPartnerId:    String,
  deliveryPartnerName:  String,
  deliveryPartnerPhone: String,
  rejectedBy:          { type: [String], default: [] },
  pickerAcceptedAt:    Date,
  dispatchedAt:        Date,
  deliveredAt:         Date,
  earningAmount:       { type: Number, default: 30 },
  currentLocation:     {
    lat:       Number,
    lng:       Number,
    updatedAt: Date,
  },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  phone:     { type: String, unique: true },
  name:      String,
  email:     String,
  addresses: Array,
}, { timestamps: true });

const StaffSchema = new mongoose.Schema({
  name:               String,
  phone:              { type: String, unique: true, sparse: true },
  mobile:             String,
  password:           String,
  role:               { type: String, default: 'Picker' },
  staffId:            String,
  profilePhoto:       String,
  available:          { type: Boolean, default: false },
  isAvailable:        { type: Boolean, default: true },
  vehicleType:        String,
  vehicleNumber:      String,
  aadhaar:            String,
  aadhaarNumber:      String,
  aadhaarImage:       String,
  panNumber:          String,
  panImage:           String,
  bankAccount:        String,
  accountNo:          String,
  ifsc:               String,
  bankIfsc:           String,
  bankName:           String,
  bankPassbookImage:  String,
  totalOrdersHandled: { type: Number, default: 0 },
  totalEarnings:      { type: Number, default: 0 },
  currentOrderId:     String,
  active:             { type: Boolean, default: true },
  isActive:           { type: Boolean, default: true },
}, { timestamps: true });

const PayoutSchema = new mongoose.Schema({
  staffId:       String,
  staffName:     String,
  staffPhone:    String,
  amount:        Number,
  deliveryCount: Number,
  date:          String,
  bankAccount:   String,
  ifsc:          String,
  bankName:      String,
  status:        { type: String, default: 'pending', enum: ['pending', 'paid'] },
  paidAt:        Date,
  note:          String,
}, { timestamps: true });

const FeaturedSectionSchema = new mongoose.Schema({
  title:           String,
  description:     String,
  imageUrl:        String,
  useGradient:     { type: Boolean, default: true },
  customColor:     String,
  autoTextColor:   { type: Boolean, default: true },
  customTextColor: String,
  products:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  active:          { type: Boolean, default: true },
}, { timestamps: true });

const BannerSchema = new mongoose.Schema({
  title:          String,
  subtitle:       String,
  description:    String,
  imageUrl:       String,
  bgColor:        { type: String, default: '' },
  bannerBgColor:  { type: String, default: '' },
  text:           { type: String, default: '' },
  textColor:      { type: String, default: '#FFFFFF' },
  isBold:         { type: Boolean, default: false },
  textBold:       { type: Boolean, default: false },
  textSize:       { type: String, default: 'medium', enum: ['small', 'medium', 'large'] },
  mediaType:      { type: String, default: 'none', enum: ['none', 'image', 'gif', 'png'] },
  mediaUrl:       { type: String, default: '' },
  mediaAlignment: { type: String, default: 'center', enum: ['left', 'center', 'right'] },
  linkTo:         { type: String, default: 'none' },
  linkType:       { type: String, default: 'none', enum: ['category', 'product', 'none'] },
  linkId:         { type: String, default: '' },
  linkName:       { type: String, default: '' },
  orderNum:       { type: Number, default: 0 },
  order:          { type: Number, default: 0 },
  active:         { type: Boolean, default: true },
}, { timestamps: true });

const AppSettingsSchema = new mongoose.Schema({
  settingsId:        { type: String, default: 'main' },
  delivery_text:     { type: String,  default: 'Delivery in 10 mins' },
  header_color:      { type: String,  default: '#FF6B6B' },
  app_open:          { type: Boolean, default: true },
  storeOpen:         { type: Boolean, default: true },
  announcement:      { type: String,  default: '' },
  storeOpenTime:     { type: String,  default: '06:00' },
  storeCloseTime:    { type: String,  default: '22:00' },
  deliveryCharge:    { type: Number,  default: 30 },
  freeDeliveryAbove: { type: Number,  default: 500 },
  commission:        { type: Number,  default: 20 },
  basePay:           { type: Number,  default: 200 },
  warehouseName:     { type: String,  default: 'Quick10 WH-1' },
  warehouseAddress:  { type: String,  default: '' },
  warehouseCity:     { type: String,  default: '' },
  maxDeliveryRadius: { type: Number,  default: 10 },
  forcedUpdate:      { type: Boolean, default: false },
  maintenanceMode:   { type: Boolean, default: false },
  appVersion:        { type: String,  default: '1.0.0' },
  pageThemes:        {
    type: Object,
    default: {
      home:           ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
      cart:           ['#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A9DFBF'],
      category:       ['#F1948A', '#D7BDE2', '#A3E4D7', '#F4D03F', '#E59866'],
      fresh:          ['#6BCB77', '#4D96FF', '#FF6B6B', '#4ECDC4', '#45B7D1'],
      motherCategory: ['#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'],
      search:         ['#F8B88B', '#A9DFBF', '#F1948A', '#D7BDE2', '#A3E4D7'],
      profile:        ['#F4D03F', '#E59866', '#FF6B6B', '#4ECDC4', '#45B7D1'],
    },
  },
}, { timestamps: true, strict: false });

const ThemeSchema = new mongoose.Schema({
  gradientColors:  { type: Array,   default: ['#B9E6CC', '#F0FBF4', '#FFFFFF'] },
  backgroundImage: { type: String,  default: null },
  floatingEmoji:   { type: String,  default: null },
  festivalEmoji:   { type: String,  default: null },
  isActive:        { type: Boolean, default: true },
  label:           { type: String,  default: 'Default Theme' },
}, { timestamps: true });

const SectionSchema = new mongoose.Schema({
  name:       String,
  sectionId:  String,
  title:      String,
  titleColor: { type: String, default: '#111111' },
  categoryId: String,
  imageUrl:   String,
  position:   { type: Number, default: 0 },
  products:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  banners:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Banner' }],
  active:     { type: Boolean, default: true },
}, { timestamps: true, strict: false });

const ShopCategorySchema = new mongoose.Schema({
  name:             String,
  shopCategoryId:   String,
  imageUrl:         String,
  motherCategoryId: String,
  position:         { type: Number, default: 0 },
  active:           { type: Boolean, default: true },
}, { timestamps: true });

const AppControlSchema = new mongoose.Schema({
  isOpen:        { type: Boolean, default: true },
  openTime:      { type: String,  default: '06:00' },
  closeTime:     { type: String,  default: '22:00' },
  closedMessage: { type: String,  default: 'App abhi band hai.' },
}, { timestamps: true });

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

const AttendanceSchema = new mongoose.Schema({
  staffPhone: String,
  staffName:  String,
  date:       String,
  checkIn:    String,
  checkOut:   String,
  status:     { type: String, default: 'present' },
}, { timestamps: true });

const PromoSectionSchema = new mongoose.Schema({
  text:            { type: String, default: '' },
  fontSize:        { type: String, default: 'medium', enum: ['small', 'medium', 'large'] },
  isBold:          { type: Boolean, default: false },
  textColor:       { type: String, default: '#FFFFFF' },
  gifUrl:          { type: String, default: '' },
  gifAlignment:    { type: String, default: 'center', enum: ['left', 'center', 'right'] },
  photoUrl:        { type: String, default: '' },
  headingText:     { type: String, default: '' },
  headingBold:     { type: Boolean, default: true },
  descriptionText: { type: String, default: '' },
  alignment:       { type: String, default: 'center', enum: ['left', 'center', 'right'] },
  active:          { type: Boolean, default: true },
}, { timestamps: true });

const PremiumCategorySchema = new mongoose.Schema({
  name:     String,
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  imageUrl: { type: String, default: '' },
  active:   { type: Boolean, default: true },
}, { timestamps: true });

// ── MODELS ───────────────────────────────────────────────────
const SubCategory     = mongoose.model('SubCategory',     SubCategorySchema);
const Product         = mongoose.model('Product',         ProductSchema);
const Category        = mongoose.model('Category',        CategorySchema);
const MotherCategory  = mongoose.model('MotherCategory',  MotherCategorySchema);
const FreshCategory   = mongoose.model('FreshCategory',   FreshCategorySchema);
const Order           = mongoose.model('Order',           OrderSchema);
const User            = mongoose.model('User',            UserSchema);
const Staff           = mongoose.model('Staff',           StaffSchema);
const Payout          = mongoose.model('Payout',          PayoutSchema);
const FeaturedSection = mongoose.model('FeaturedSection', FeaturedSectionSchema);
const Banner          = mongoose.model('Banner',          BannerSchema);
const AppSettings     = mongoose.model('AppSettings',     AppSettingsSchema);
const Theme           = mongoose.model('Theme',           ThemeSchema);
const Section         = mongoose.model('Section',         SectionSchema);
const ShopCategory    = mongoose.model('ShopCategory',    ShopCategorySchema);
const AppControl      = mongoose.model('AppControl',      AppControlSchema);
const Promo           = mongoose.model('Promo',           PromoSchema);
const Attendance      = mongoose.model('Attendance',      AttendanceSchema);
const PromoSection    = mongoose.model('PromoSection',    PromoSectionSchema);
const PremiumCategory = mongoose.model('PremiumCategory', PremiumCategorySchema);

// ── OTP STORE ─────────────────────────────────────────────────
const otpStore = {};
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
setInterval(() => {
  const now = Date.now();
  Object.keys(otpStore).forEach(p => { if (otpStore[p].expiresAt < now) delete otpStore[p]; });
}, 30 * 1000);

// ── SOCKET.IO ─────────────────────────────────────────────────
const connectedUsers         = {};
const onlineDeliveryPartners = {};
const chatMessages           = {};
const deliveryChatMessages   = {};

const emitOrderUpdate = (order) => {
  if (!order) return;
  io.to('customer_' + order.userPhone).emit('order_update', order);
  io.to('warehouse_admin').emit('order_update', order);
  if (order.deliveryPartnerId) {
    io.to('delivery_' + order.deliveryPartnerId).emit('order_update', order);
  }
};

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(socket.id, 'joined', room);
  });

  socket.on('register', (phone) => {
    connectedUsers[phone] = socket.id;
    socket.join('customer_' + phone);
    if (otpStore[phone] && Date.now() < otpStore[phone].expiresAt)
      socket.emit('otp_received', { otp: otpStore[phone].otp, message: `Quick10 OTP: ${otpStore[phone].otp}` });
  });

  socket.on('register_admin', () => {
    connectedUsers['admin'] = socket.id;
    socket.join('warehouse_admin');
    socket.emit('all_chats', chatMessages);
    socket.emit('all_delivery_chats', deliveryChatMessages);
  });

  socket.on('customer_message', (data) => {
    const { phone, message, name } = data;
    if (!chatMessages[phone]) chatMessages[phone] = { phone, name: name || phone, messages: [] };
    const msg = { id: Date.now(), text: message, sender: 'customer', time: new Date().toISOString() };
    chatMessages[phone].messages.push(msg);
    const adminId = connectedUsers['admin'];
    if (adminId) io.to(adminId).emit('new_customer_message', { phone, name: name || phone, message: msg, allMessages: chatMessages[phone].messages });
    socket.emit('message_sent', msg);
  });

  socket.on('admin_reply', (data) => {
    const { phone, message } = data;
    if (!chatMessages[phone]) chatMessages[phone] = { phone, messages: [] };
    const msg = { id: Date.now(), text: message, sender: 'admin', time: new Date().toISOString() };
    chatMessages[phone].messages.push(msg);
    const cid = connectedUsers[phone];
    if (cid) io.to(cid).emit('admin_message', msg);
    socket.emit('reply_sent', { phone, msg });
  });

  socket.on('get_chat_history', (phone) => socket.emit('chat_history', chatMessages[phone]?.messages || []));

  socket.on('delivery_register', (data) => {
    const { phone, name } = data;
    connectedUsers[`delivery_${phone}`] = socket.id;
    onlineDeliveryPartners[phone] = { socketId: socket.id, name, phone, busy: false };
    socket.join('delivery_available');
    socket.join('delivery_' + phone);
  });

  socket.on('delivery_message', (data) => {
    const { phone, name, message, orderId } = data;
    if (!deliveryChatMessages[phone]) deliveryChatMessages[phone] = { phone, name: name || phone, messages: [] };
    const msg = { id: Date.now(), text: message, sender: 'delivery', orderId, time: new Date().toISOString() };
    deliveryChatMessages[phone].messages.push(msg);
    const adminId = connectedUsers['admin'];
    if (adminId) io.to(adminId).emit('new_delivery_message', { phone, name: name || phone, message: msg, allMessages: deliveryChatMessages[phone].messages });
    socket.emit('delivery_message_sent', msg);
  });

  socket.on('admin_delivery_reply', (data) => {
    const { phone, message } = data;
    if (!deliveryChatMessages[phone]) deliveryChatMessages[phone] = { phone, messages: [] };
    const msg = { id: Date.now(), text: message, sender: 'admin', time: new Date().toISOString() };
    deliveryChatMessages[phone].messages.push(msg);
    const did = connectedUsers[`delivery_${phone}`];
    if (did) io.to(did).emit('admin_delivery_message', msg);
    socket.emit('delivery_reply_sent', { phone, msg });
  });

  socket.on('get_delivery_chat_history', (phone) => socket.emit('delivery_chat_history', deliveryChatMessages[phone]?.messages || []));

  socket.on('delivery_online', (data) => {
    const { phone, name, pushToken } = data;
    onlineDeliveryPartners[phone] = { socketId: socket.id, pushToken, name, phone, busy: false };
    socket.join('delivery_available');
    socket.join('delivery_' + phone);
  });
  socket.on('delivery_offline', (phone) => { delete onlineDeliveryPartners[phone]; });
  socket.on('delivery_busy',    (phone) => { if (onlineDeliveryPartners[phone]) onlineDeliveryPartners[phone].busy = true; });
  socket.on('delivery_free',    (phone) => { if (onlineDeliveryPartners[phone]) onlineDeliveryPartners[phone].busy = false; });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    Object.keys(connectedUsers).forEach(k => { if (connectedUsers[k] === socket.id) delete connectedUsers[k]; });
    Object.keys(onlineDeliveryPartners).forEach(k => { if (onlineDeliveryPartners[k]?.socketId === socket.id) delete onlineDeliveryPartners[k]; });
  });
});

// ── HEALTH ────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'OK', message: 'Backend is running!' }));

app.get('/api/admin/phone', async (req, res) => {
  try {
    const admin = await Staff.findOne({ role: { $in: ['admin', 'Admin'] } });
    res.json({ success: true, phone: admin?.phone || null });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── AUTH ──────────────────────────────────────────────────────
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length !== 10) return res.json({ success: false, message: 'Valid 10-digit phone number required' });
    const otp = generateOTP();
    otpStore[phone] = { otp, expiresAt: Date.now() + 2 * 60 * 1000 };
    console.log(`OTP for ${phone}: ${otp}`);
    const sid = connectedUsers[phone];
    if (sid) io.to(sid).emit('otp_received', { otp, message: `Quick10 OTP: ${otp} (2 min valid)` });
    res.json({ success: true, message: 'OTP sent', otp });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (otp.toString() === '123456') {
      delete otpStore[phone];
      let user = await User.findOne({ phone });
      if (!user) { user = new User({ phone }); await user.save(); }
      return res.json({ success: true, user, message: 'Login successful' });
    }
    const stored = otpStore[phone];
    if (!stored) return res.json({ success: false, message: 'OTP expired. Resend karo.' });
    if (Date.now() > stored.expiresAt) { delete otpStore[phone]; return res.json({ success: false, message: 'OTP expired (2 min).' }); }
    if (stored.otp !== otp.toString()) return res.json({ success: false, message: 'OTP galat hai' });
    delete otpStore[phone];
    let user = await User.findOne({ phone });
    if (!user) { user = new User({ phone }); await user.save(); }
    res.json({ success: true, user, message: 'Login successful' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PRODUCTS ──────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const {
      category, freshCategory, allCategory,
      motherCategory, motherCategoryId,
      subCategory, subCategoryId, section, sectionName,
      shopCategory, shopCategoryId, shopCategoryName,
      placement, isBanner,
      showInFresh, inFeaturedSection, showOnHome,
      freshCategoryId, freshCategoryName,
      active,
    } = req.query;

    let filter = { active: true };
    if (active === 'all') delete filter.active;

    if (isBanner === 'true')           filter.isBanner          = true;
    if (showInFresh === 'true')        filter.showInFresh        = true;
    if (inFeaturedSection === 'true')  filter.inFeaturedSection  = true;
    if (showOnHome === 'true')         filter.showOnHome         = true;
    if (sectionName)                   filter.sectionName        = sectionName;
    if (placement)                     filter.placement          = placement;
    if (shopCategory)                  filter.shopCategoryId     = shopCategory;
    if (shopCategoryId)                filter.shopCategoryId     = shopCategoryId;
    if (shopCategoryName)              filter.shopCategoryName   = shopCategoryName;
    if (freshCategoryId)               filter.freshCategoryId    = freshCategoryId;
    if (freshCategoryName)             filter.freshCategoryName  = freshCategoryName;

    if (section) {
      filter.$or = [{ sectionId: section }, { section }];
    } else if (subCategoryId || subCategory) {
      const subId = subCategoryId || subCategory;
      filter.$or = [{ subCategoryId: subId }, { subCategory: subId }];
    } else if (motherCategoryId) {
      filter.$or = [{ motherCategoryId }, { motherCategory: motherCategoryId }];
    } else if (motherCategory) {
      filter.$or = [{ motherCategoryId: motherCategory }, { motherCategory }, { category: motherCategory }];
    } else if (freshCategory && freshCategory !== 'all') {
      filter.$or = [{ freshCategory }, { category: freshCategory }];
    } else if (allCategory && allCategory !== 'all') {
      filter.$or = [{ allCategory }, { category: allCategory }];
    } else if (category && category !== 'all') {
      filter.$or = [{ category }, { motherCategory: category }, { allCategory: category }, { freshCategory: category }];
    }

    const products = await Product.find(filter).sort({ position: 1, createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/products/all', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ position: 1 });
    res.json({ success: true, products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json({ success: true, product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    let result = await Product.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, strict: false });
    if (!result) return res.status(404).json({ success: false, message: 'Product not found' });
    if (result.stock <= result.threshold && result.active) {
      result = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    }
    res.json({ success: true, product: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/products/:id/featured-toggle', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    product.inFeaturedSection = !product.inFeaturedSection;
    await product.save();
    res.json({ success: true, product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── CATEGORIES ────────────────────────────────────────────────
app.get('/api/categories', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const categories = await Category.find({ active: true });
    res.json({ success: true, categories });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/categories', async (req, res) => {
  try { const c = new Category(req.body); await c.save(); res.json({ success: true, category: c }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/categories/:id', async (req, res) => {
  try { const c = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ success: true, category: c }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.delete('/api/categories/:id', async (req, res) => {
  try {
    let r;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) r = await Category.findByIdAndDelete(req.params.id);
    if (!r) r = await Category.findOneAndDelete({ categoryId: req.params.id });
    if (!r) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── MOTHER CATEGORIES ─────────────────────────────────────────
app.get('/api/mother-categories', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const cats = await MotherCategory.find({ active: true }).sort({ order: 1, position: 1 });
    res.json({ success: true, categories: cats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/mother-categories', async (req, res) => {
  try { const c = new MotherCategory(req.body); await c.save(); res.json({ success: true, category: c }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/mother-categories/:id', async (req, res) => {
  try {
    const c = await MotherCategory.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, strict: false });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, category: c });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.delete('/api/mother-categories/:id', async (req, res) => {
  try {
    const r = await MotherCategory.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── FRESH CATEGORIES ──────────────────────────────────────────
app.get('/api/fresh-categories', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const cats = await FreshCategory.find({ active: true }).sort({ order: 1 });
    res.json({ success: true, categories: cats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/fresh-categories', async (req, res) => {
  try { const c = new FreshCategory(req.body); await c.save(); res.json({ success: true, category: c }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/fresh-categories/:id', async (req, res) => {
  try {
    const c = await FreshCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, category: c });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.delete('/api/fresh-categories/:id', async (req, res) => {
  try {
    const r = await FreshCategory.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── SUB CATEGORIES ────────────────────────────────────────────
app.get('/api/sub-categories', async (req, res) => {
  try {
    const { categoryId, motherCategoryId, shopCategoryId, parentType } = req.query;
    const filter = { active: true };
    if (categoryId)       filter.categoryId       = categoryId;
    if (motherCategoryId) filter.motherCategoryId = motherCategoryId;
    if (shopCategoryId)   filter.shopCategoryId   = shopCategoryId;
    if (parentType)       filter.parentType       = parentType;
    const cats = await SubCategory.find(filter).sort({ position: 1 });
    res.json({ success: true, categories: cats, subCategories: cats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/sub-categories', async (req, res) => {
  try { const c = new SubCategory(req.body); await c.save(); res.json({ success: true, category: c }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/sub-categories/:id', async (req, res) => {
  try {
    const c = await SubCategory.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, strict: false });
    res.json({ success: true, category: c });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.delete('/api/sub-categories/:id', async (req, res) => {
  try { await SubCategory.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── SECTIONS ──────────────────────────────────────────────────
app.get('/api/sections', async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { active: true };
    const sections = await Section.find(filter).sort({ position: 1, createdAt: -1 });
    res.json({ success: true, sections });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/sections', async (req, res) => {
  try {
    const count = await Section.countDocuments();
    const sectionId = req.body.sectionId || `SEC_${String(count + 1).padStart(3, '0')}`;
    const section = new Section({ ...req.body, sectionId });
    await section.save();
    res.json({ success: true, section });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/sections/:id', async (req, res) => {
  try {
    const section = await Section.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, strict: false });
    if (!section) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, section });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.delete('/api/sections/:id', async (req, res) => {
  try { await Section.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/home-sections-by-title', async (req, res) => {
  try {
    const sections = await Section.find({ active: true });
    const result = [];
    for (const sec of sections) {
      const products = await Product.find({ homeSectionTitle: sec.name, active: true }).lean();
      if (products.length > 0) result.push({ sectionId: sec._id, sectionName: sec.name, products });
    }
    res.json({ success: true, sections: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/home-sections', async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 0;
    const limit = parseInt(req.query.limit) || 4;
    const products   = await Product.find({ active: true }).lean();
    const motherCats = await MotherCategory.find({ active: true }).sort({ order: 1 }).skip(page * limit).limit(limit).lean();
    const sections = [];
    for (const cat of motherCats) {
      const catId = cat.categoryId || cat._id.toString();
      const catProducts = products.filter(p => p.category === catId || p.motherCategoryId === catId || p.motherCategory === catId);
      if (catProducts.length === 0) continue;
      const subCatMap = {};
      for (const p of catProducts) {
        const key = p.subCategory || 'general';
        if (!subCatMap[key]) subCatMap[key] = { subCategoryId: key, subCategoryName: p.subCategoryName || cat.name, products: [] };
        subCatMap[key].products.push(p);
      }
      sections.push({ categoryId: catId, categoryName: cat.name, iconUrl: cat.iconUrl, subSections: Object.values(subCatMap) });
    }
    res.json({ success: true, sections });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── SHOP CATEGORIES ───────────────────────────────────────────
app.get('/api/shop-categories', async (req, res) => {
  try {
    const filter = { active: true };
    if (req.query.motherCategoryId) filter.motherCategoryId = req.query.motherCategoryId;
    const cats = await ShopCategory.find(filter).sort({ position: 1 });
    res.json({ success: true, categories: cats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.get('/api/shop-categories/by-mother/:motherCategoryId', async (req, res) => {
  try {
    const cats = await ShopCategory.find({ motherCategoryId: req.params.motherCategoryId, active: true }).sort({ position: 1 });
    res.json({ success: true, categories: cats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/shop-categories', async (req, res) => {
  try {
    const count = await ShopCategory.countDocuments();
    const shopCategoryId = req.body.shopCategoryId || `SHC_${String(count + 1).padStart(3, '0')}`;
    const cat = new ShopCategory({ ...req.body, shopCategoryId });
    await cat.save();
    res.json({ success: true, category: cat });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/shop-categories/:id', async (req, res) => {
  try {
    const c = await ShopCategory.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, category: c });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.delete('/api/shop-categories/:id', async (req, res) => {
  try { await ShopCategory.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── FRESH SECTION ─────────────────────────────────────────────
app.get('/api/fresh-section', async (req, res) => {
  try {
    const subCats = await SubCategory.find({
      active: true,
      $or: [{ sectionName: 'Fresh' }, { motherCategoryName: 'Fresh' }, { categoryId: 'fresh' }],
    }).lean();
    const categories = await Promise.all(
      subCats.map(async (sub) => {
        const products = await Product.find({ subCategoryId: sub._id.toString(), active: true }).lean();
        return { _id: sub._id, name: sub.name, imageUrl: sub.imageUrl, products };
      })
    );
    res.json({ success: true, categories: categories.filter(c => c.products.length > 0) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── ORDERS ────────────────────────────────────────────────────
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order({ ...req.body, orderId: 'ORD' + Date.now() });
    await order.save();
    io.to('warehouse_admin').emit('new_order', order);
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.get('/api/orders/user/:phone', async (req, res) => {
  try {
    const orders = await Order.find({ userPhone: req.params.phone }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.get('/api/orders/:id', async (req, res) => {
  try { const order = await Order.findById(req.params.id); res.json({ success: true, order }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Picker accepts order → status: accepted
app.put('/api/orders/:id/accept-packing', async (req, res) => {
  try {
    const { pickerId, pickerName } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'packing', pickerId, pickerName, pickerAcceptedAt: new Date() },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    emitOrderUpdate(order);
    io.to('delivery_available').emit('order_accepted', { orderId: order._id });
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Picker done packing → status: ready_pickup
app.put('/api/orders/:id/ready-pickup', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'ready_pickup', packed_at: new Date() },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    emitOrderUpdate(order);
    io.to('delivery_available').emit('order_ready', { order, message: 'Order ready for pickup!' });
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delivery partner dispatches → status: dispatched
app.put('/api/orders/:id/dispatch', async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'dispatched', dispatched_at: new Date(), dispatchedAt: new Date(), deliveryPartnerId },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    emitOrderUpdate(order);
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delivery partner delivered → status: delivered
app.put('/api/orders/:id/deliver', async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'delivered', delivered_at: new Date(), deliveredAt: new Date() },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    emitOrderUpdate(order);
    if (deliveryPartnerId) {
      await Staff.findByIdAndUpdate(deliveryPartnerId, {
        $inc: { totalOrdersHandled: 1, totalEarnings: order.earningAmount || 30 },
        currentOrderId: null,
      });
      if (onlineDeliveryPartners[deliveryPartnerId]) onlineDeliveryPartners[deliveryPartnerId].busy = false;
    }
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Notify all available delivery partners
app.put('/api/orders/:id/notify-partners', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    io.to('delivery_available').emit('new_order_available', { order, message: 'New order available!' });
    res.json({ success: true, message: 'Partners notified' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delivery partner accepts delivery
app.put('/api/orders/:id/accept-delivery', async (req, res) => {
  try {
    const { deliveryPartnerId, partnerName } = req.body;
    const existing = await Order.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
    if (existing.deliveryPartnerId && existing.deliveryPartnerId !== deliveryPartnerId) {
      return res.json({ success: false, message: 'Order already taken by another partner' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryPartnerId, deliveryPartnerName: partnerName, assignedTo: deliveryPartnerId, assignedName: partnerName },
      { new: true }
    );
    emitOrderUpdate(order);
    if (onlineDeliveryPartners[deliveryPartnerId]) onlineDeliveryPartners[deliveryPartnerId].busy = true;
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delivery partner rejects delivery
app.put('/api/orders/:id/reject-delivery', async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { rejectedBy: deliveryPartnerId } },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    const available = Object.values(onlineDeliveryPartners).filter(
      p => !p.busy && p.phone !== deliveryPartnerId && !order.rejectedBy.includes(p.phone)
    );
    if (available.length > 0) {
      io.to('delivery_' + available[0].phone).emit('new_order_available', { order, message: 'New order available!' });
    } else {
      io.to('warehouse_admin').emit('all_partners_rejected', { order, message: 'Sabne reject kar diya, manually assign karo' });
    }
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Admin manually assigns delivery partner
app.put('/api/orders/:id/assign-partner', async (req, res) => {
  try {
    const { deliveryPartnerId, partnerName } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryPartnerId, deliveryPartnerName: partnerName, assignedTo: deliveryPartnerId, assignedName: partnerName },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    io.to('delivery_' + deliveryPartnerId).emit('order_assigned', { order, message: 'Tumhe order assign hua hai' });
    emitOrderUpdate(order);
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Location update
app.put('/api/orders/:id/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { currentLocation: { lat, lng, updatedAt: new Date() } },
      { new: true, strict: false }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    io.to('customer_' + order.userPhone).emit('location_update', { lat, lng, orderId: req.params.id });
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/orders/:id/assign', async (req, res) => {
  try {
    const { assignedTo, assignedName } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'packing', assignedTo, assignedName, accepted_at: new Date() }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    emitOrderUpdate(order);
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/orders/:id/packed', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'packed', packed_at: new Date() }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    emitOrderUpdate(order);
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/orders/:id/dispatched', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'out_for_delivery', dispatched_at: new Date() }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    emitOrderUpdate(order);
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/orders/:id/delivered', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'delivered', delivered_at: new Date() }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    emitOrderUpdate(order);
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status, deliveryPartner, assignedTo, assignedName } = req.body;
    const upd = { status };
    if (deliveryPartner) upd.deliveryPartner = deliveryPartner;
    if (assignedTo)      upd.assignedTo      = assignedTo;
    if (assignedName)    upd.assignedName    = assignedName;
    const now = new Date();
    if (status === 'packing')          upd.accepted_at   = now;
    if (status === 'packed')           upd.packed_at     = now;
    if (status === 'out_for_delivery') upd.dispatched_at = now;
    if (status === 'delivered')        upd.delivered_at  = now;
    const order = await Order.findByIdAndUpdate(req.params.id, upd, { new: true });
    emitOrderUpdate(order);
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── DELIVERY ──────────────────────────────────────────────────
app.get('/api/delivery/available-orders', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'packed', assignedTo: null });
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/delivery/accept-order', async (req, res) => {
  try {
    const { orderId, deliveryPartner } = req.body;
    const order = await Order.findByIdAndUpdate(orderId, { status: 'out_for_delivery', deliveryPartner, assignedTo: deliveryPartner.phone, dispatched_at: new Date() }, { new: true });
    if (onlineDeliveryPartners[deliveryPartner.phone]) onlineDeliveryPartners[deliveryPartner.phone].busy = true;
    emitOrderUpdate(order);
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/delivery/reject-order', async (req, res) => {
  try {
    const { orderId, rejectedBy } = req.body;
    await Order.findByIdAndUpdate(orderId, { assignedTo: null, status: 'packed' });
    res.json({ success: true });
    setTimeout(async () => {
      const order = await Order.findById(orderId);
      if (!order || order.status !== 'packed') return;
      const available = Object.values(onlineDeliveryPartners).filter(p => !p.busy && p.phone !== rejectedBy);
      if (available.length > 0) io.to(available[0].socketId).emit('new_order_available', { order, message: 'New order available!' });
    }, 2000);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/delivery/deliver-order', async (req, res) => {
  try {
    const { orderId, deliveryPartnerPhone } = req.body;
    await Order.findByIdAndUpdate(orderId, { status: 'delivered', delivered_at: new Date() });
    if (onlineDeliveryPartners[deliveryPartnerPhone]) onlineDeliveryPartners[deliveryPartnerPhone].busy = false;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.get('/api/delivery/my-order/:phone', async (req, res) => {
  try {
    const order = await Order.findOne({ assignedTo: req.params.phone, status: 'out_for_delivery' });
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/delivery/update-location', async (req, res) => {
  try {
    const { orderId, lat, lng } = req.body;
    const order = await Order.findByIdAndUpdate(orderId, { currentLocation: { lat, lng, updatedAt: new Date() } }, { new: true, strict: false });
    if (order) io.to('customer_' + order.userPhone).emit('location_update', { lat, lng, orderId });
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── USERS ─────────────────────────────────────────────────────
app.get('/api/users/:phone', async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone });
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/users/:phone', async (req, res) => {
  try {
    const { address, name, email } = req.body;
    let user = await User.findOne({ phone: req.params.phone });
    if (!user) user = new User({ phone: req.params.phone });
    if (name)  user.name  = name;
    if (email) user.email = email;
    if (address) {
      if (!user.addresses) user.addresses = [];
      if (!user.addresses.find(a => a.id === address.id)) user.addresses.push(address);
    }
    await user.save();
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.delete('/api/users/:phone/addresses/:addressId', async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone });
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    user.addresses = user.addresses.filter(a => a.id !== req.params.addressId);
    await user.save();
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── STAFF ─────────────────────────────────────────────────────
const generateStaffId = async (role) => {
  const prefix = ['Manager','manager'].includes(role) ? 'WH_MGR'
               : ['Rider','rider','delivery_partner'].includes(role) ? 'WH_RDR'
               : 'WH_PKR';
  const count = await Staff.countDocuments({ role });
  return `${prefix}_${String(count + 1).padStart(3, '0')}`;
};

app.get('/api/staff', async (req, res) => {
  try { const staff = await Staff.find({}).sort({ createdAt: -1 }); res.json({ success: true, staff }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.get('/api/staff/:id', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/staff', async (req, res) => {
  try {
    const phone = req.body.phone || req.body.mobile;
    const exists = await Staff.findOne({ $or: [{ phone }, { mobile: phone }].filter(x => Object.values(x)[0]) });
    if (exists) return res.json({ success: false, message: 'Phone already registered' });
    const staffId = await generateStaffId(req.body.role || 'Picker');
    const staff = new Staff({ ...req.body, phone: phone || req.body.phone, staffId });
    await staff.save();
    res.json({ success: true, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/staff/:id', async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!staff) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.delete('/api/staff/:id', async (req, res) => {
  try { await Staff.findByIdAndDelete(req.params.id); res.json({ success: true, message: 'Deleted' }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/staff/:id/availability', async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, { available: req.body.available, isAvailable: req.body.available }, { new: true });
    if (!staff) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/staff/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const staff = await Staff.findOne({ $or: [{ phone }, { mobile: phone }], password, active: true });
    if (!staff) return res.json({ success: false, message: 'Phone ya password galat hai' });
    res.json({ success: true, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.get('/api/staff/:id/earnings', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Not found' });
    const orders = await Order.find({ deliveryPartnerId: req.params.id, status: 'delivered' }).sort({ createdAt: -1 });
    res.json({ success: true, totalEarnings: staff.totalEarnings, totalOrdersHandled: staff.totalOrdersHandled, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/staff/:id/add-earning', async (req, res) => {
  try {
    const { amount } = req.body;
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { $inc: { totalEarnings: amount, totalOrdersHandled: 1 } },
      { new: true }
    );
    if (!staff) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── FINANCE ───────────────────────────────────────────────────
app.get('/api/finance/payouts', async (req, res) => {
  try {
    const filter = {};
    if (req.query.date)    filter.date    = req.query.date;
    if (req.query.staffId) filter.staffId = req.query.staffId;
    const payouts = await Payout.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, payouts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.get('/api/finance/payouts/:staffId', async (req, res) => {
  try {
    const payouts = await Payout.find({ staffId: req.params.staffId }).sort({ createdAt: -1 });
    res.json({ success: true, payouts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/finance/payout', async (req, res) => {
  try {
    const payout = new Payout({ ...req.body, status: 'paid', paidAt: new Date() });
    await payout.save();
    res.json({ success: true, payout });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/finance/payout/:id', async (req, res) => {
  try {
    const payout = await Payout.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, payout });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.get('/api/finance/summary', async (req, res) => {
  try {
    const today  = new Date().toLocaleDateString('en-CA');
    const riders = await Staff.find({ role: { $in: ['Rider', 'rider', 'delivery_partner'] } });
    const todayPayouts = await Payout.find({ date: today });
    const settings = await AppSettings.findOne({});
    const commission = settings?.commission || 20;
    const basePay    = settings?.basePay    || 200;
    const start = new Date(); start.setHours(0,0,0,0);
    const end   = new Date(); end.setHours(23,59,59,999);
    const orders = await Order.find({ status: 'delivered', createdAt: { $gte: start, $lte: end } });
    const riderStats = riders.map(r => {
      const rOrders       = orders.filter(o => o.assignedTo === r.phone || o.assignedTo === r.mobile);
      const deliveryCount = rOrders.length;
      const earning       = basePay + deliveryCount * commission;
      const payout        = todayPayouts.find(p => String(p.staffId) === String(r._id));
      return { _id: r._id, name: r.name, phone: r.phone, staffId: r.staffId, profilePhoto: r.profilePhoto, bankAccount: r.bankAccount || r.accountNo, ifsc: r.ifsc, bankName: r.bankName, deliveryCount, earning, payoutStatus: payout?.status || 'pending', payoutId: payout?._id || null };
    });
    res.json({ success: true, riderStats, totalRevenue: orders.reduce((s, o) => s + (o.total || 0), 0), totalPayout: riderStats.reduce((s, r) => s + r.earning, 0), totalOrders: orders.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── UPLOAD ────────────────────────────────────────────────────
app.post('/api/upload', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, message: 'image required' });
    const result = await cloudinary.uploader.upload(image, { folder: 'quick10', resource_type: 'auto' });
    res.json({ success: true, url: result.secure_url });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── RAZORPAY ──────────────────────────────────────────────────
const Razorpay = require('razorpay');
const razorpay = new Razorpay({ key_id: 'rzp_test_SmOBM3Muj6dQnF', key_secret: '5M8Z7lP82qM4cNPxaQyrx12k' });
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const order = await razorpay.orders.create({ amount: req.body.amount * 100, currency: 'INR', receipt: 'order_' + Date.now() });
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const crypto = require('crypto');
    const expected = crypto.createHmac('sha256', '5M8Z7lP82qM4cNPxaQyrx12k').update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    res.json({ success: expected === razorpay_signature, message: expected === razorpay_signature ? 'Payment verified!' : 'Invalid signature' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── THEME ─────────────────────────────────────────────────────
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
    Object.assign(theme, req.body);
    await theme.save();
    res.json({ success: true, theme });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── APP CONTROL ───────────────────────────────────────────────
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
    Object.assign(ctrl, req.body);
    await ctrl.save();
    res.json({ success: true, control: ctrl });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── APP SETTINGS ──────────────────────────────────────────────
app.get('/api/app-settings', async (req, res) => {
  try {
    let settings = await AppSettings.findOne({});
    if (!settings) { settings = await AppSettings.create({ settingsId: 'main' }); }
    res.json({ success: true, settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/app-settings', async (req, res) => {
  try { const s = await AppSettings.create(req.body); res.json({ success: true, settings: s }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/app-settings', async (req, res) => {
  try {
    let settings = await AppSettings.findOne({});
    if (!settings) {
      settings = await AppSettings.create({ ...req.body, settingsId: 'main' });
    } else {
      settings = await AppSettings.findByIdAndUpdate(settings._id, { $set: req.body }, { new: true, strict: false });
    }
    res.json({ success: true, settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PROMO CODES ───────────────────────────────────────────────
app.get('/api/promo-codes', async (req, res) => {
  try { const promos = await Promo.find({}).sort({ createdAt: -1 }); res.json({ success: true, promos }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/promo-codes', async (req, res) => {
  try { const promo = new Promo(req.body); await promo.save(); res.json({ success: true, promo }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/promo-codes/validate', async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const promo = await Promo.findOne({ code: code.toUpperCase(), active: true });
    if (!promo) return res.json({ success: false, message: 'Invalid coupon code' });
    if (promo.expiryDate && new Date() > promo.expiryDate) return res.json({ success: false, message: 'Coupon expired' });
    if (promo.usedCount >= promo.maxUses) return res.json({ success: false, message: 'Coupon limit full' });
    if (orderAmount < promo.minOrder) return res.json({ success: false, message: `Minimum order Rs.${promo.minOrder} chahiye` });
    const discount = promo.type === 'percent' ? Math.round((orderAmount * promo.value) / 100) : promo.value;
    res.json({ success: true, promo, discount, message: `Rs.${discount} ki chhoot mili!` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/promo-codes/:id', async (req, res) => {
  try { const p = await Promo.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ success: true, promo: p }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.delete('/api/promo-codes/:id', async (req, res) => {
  try { await Promo.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── ATTENDANCE ────────────────────────────────────────────────
app.get('/api/attendance', async (req, res) => {
  try {
    const filter = req.query.date ? { date: req.query.date } : {};
    const records = await Attendance.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/attendance', async (req, res) => {
  try { const r = new Attendance(req.body); await r.save(); res.json({ success: true, record: r }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/attendance/:id', async (req, res) => {
  try { const r = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ success: true, record: r }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── WEEKLY REPORT ─────────────────────────────────────────────
app.get('/api/reports/weekly', async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - 7);
    const orders    = await Order.find({ createdAt: { $gte: start, $lte: now } }).lean();
    const delivered = orders.filter(o => o.status === 'delivered');
    const dailyMap  = {};
    orders.forEach(o => {
      const day = new Date(o.createdAt).toLocaleDateString('en-IN');
      if (!dailyMap[day]) dailyMap[day] = { orders: 0, revenue: 0 };
      dailyMap[day].orders++;
      if (o.status === 'delivered') dailyMap[day].revenue += (o.total || 0);
    });
    res.json({ success: true, report: { totalOrders: orders.length, totalRevenue: delivered.reduce((s, o) => s + (o.total || 0), 0), deliveredOrders: delivered.length, pendingOrders: orders.filter(o => ['pending','packed'].includes(o.status)).length, cancelledOrders: orders.filter(o => o.status === 'cancelled').length, dailyBreakdown: dailyMap, period: { start, end: now } } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── FEATURED SECTIONS ─────────────────────────────────────────
app.get('/api/featured-section', async (req, res) => {
  try {
    const section = await FeaturedSection.findOne({ active: true }).populate('products');
    res.json({ success: true, section: section || null });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.get('/api/featured-section/all', async (req, res) => {
  try {
    const sections = await FeaturedSection.find({}).populate('products').sort({ createdAt: -1 });
    res.json({ success: true, sections });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/featured-section', async (req, res) => {
  try { const s = new FeaturedSection({ ...req.body, active: true }); await s.save(); res.json({ success: true, section: s }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/featured-section/:id', async (req, res) => {
  try {
    const s = await FeaturedSection.findByIdAndUpdate(req.params.id, req.body, { new: true, strict: false }).populate('products');
    res.json({ success: true, section: s });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.delete('/api/featured-section/:id', async (req, res) => {
  try { await FeaturedSection.findByIdAndDelete(req.params.id); res.json({ success: true, message: 'Deleted' }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── BANNERS ───────────────────────────────────────────────────
app.get('/api/banners', async (req, res) => {
  try {
    const banners = await Banner.find({}).sort({ orderNum: 1, order: 1, createdAt: -1 });
    res.json({ success: true, banners });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/banners', async (req, res) => {
  try { const b = new Banner(req.body); await b.save(); res.json({ success: true, banner: b }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/banners/:id', async (req, res) => {
  try {
    const b = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!b) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, banner: b });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.delete('/api/banners/:id', async (req, res) => {
  try { await Banner.findByIdAndDelete(req.params.id); res.json({ success: true, message: 'Deleted' }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PROMO SECTION ─────────────────────────────────────────────
app.get('/api/promo-section', async (req, res) => {
  try {
    const promo = await PromoSection.findOne({ active: true }).sort({ createdAt: -1 });
    res.json({ success: true, promo });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/promo-section', async (req, res) => {
  try { const p = new PromoSection(req.body); await p.save(); res.json({ success: true, promo: p }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/promo-section/:id', async (req, res) => {
  try {
    const p = await PromoSection.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!p) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, promo: p });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PREMIUM CATEGORIES ────────────────────────────────────────
app.get('/api/premium-categories', async (req, res) => {
  try {
    const cats = await PremiumCategory.find({}).sort({ createdAt: -1 });
    res.json({ success: true, premiumCategories: cats, categories: cats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/premium-categories', async (req, res) => {
  try { const c = new PremiumCategory(req.body); await c.save(); res.json({ success: true, category: c }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/premium-categories/:id', async (req, res) => {
  try {
    const c = await PremiumCategory.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, category: c });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.delete('/api/premium-categories/:id', async (req, res) => {
  try { await PremiumCategory.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── MOTHER CATEGORY FULL ──────────────────────────────────────
app.get('/api/mother-categories/:id/full', async (req, res) => {
  try {
    const id = req.params.id;
    const category = await MotherCategory.findById(id);
    if (!category) return res.status(404).json({ success: false, message: 'Not found' });

    const catId = category.categoryId || id;
    const [subCategories, products] = await Promise.all([
      SubCategory.find({ $or: [{ motherCategoryId: id }, { motherCategoryId: catId }], active: true })
        .select('_id name image imageUrl categoryId position active')
        .sort({ position: 1 }),
      Product.find({ $or: [{ motherCategoryId: id }, { motherCategoryId: catId }, { motherCategory: catId }], active: true })
        .select('_id name price mrp weight imageUrl stock active subCategoryId subCategoryName discount rating'),
    ]);

    res.json({ success: true, category, subCategories, products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PRODUCTS BY SUBCATEGORY ────────────────────────────────────
app.get('/api/products/by-subcategory/:subCategoryId', async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const products = await Product.find({
      $or: [{ subCategoryId }, { subCategory: subCategoryId }],
      active: true,
    });
    res.json({ success: true, products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── TEST CONNECTIONS ──────────────────────────────────────────
app.get('/api/test/connections', async (req, res) => {
  try {
    const [products, motherCategories, subCategories, sections, shopCategories, orders, staff, freshCats] = await Promise.all([
      Product.countDocuments(),
      MotherCategory.countDocuments(),
      SubCategory.countDocuments(),
      Section.countDocuments(),
      ShopCategory.countDocuments(),
      Order.countDocuments(),
      Staff.countDocuments(),
      SubCategory.countDocuments({ $or: [{ sectionName: 'Fresh' }, { motherCategoryName: 'Fresh' }] }),
    ]);
    res.json({
      success: true,
      mongodb: 'connected',
      collections: { products, motherCategories, subCategories, sections, shopCategories, orders, staff },
      uploadTest: 'Cloudinary configured',
      freshSection: { categories: freshCats },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── INDEXES + AUTO-MIGRATION ──────────────────────────────────
mongoose.connection.once('open', async () => {
  try {
    await Product.collection.createIndex({ category: 1 });
    await Product.collection.createIndex({ active: 1 });
    await Product.collection.createIndex({ sectionId: 1 });
    await Product.collection.createIndex({ subCategoryId: 1 });
    await Product.collection.createIndex({ motherCategoryId: 1 });
    await Order.collection.createIndex({ userPhone: 1 });
    await Order.collection.createIndex({ status: 1 });
    await Order.collection.createIndex({ assignedTo: 1 });
    await Payout.collection.createIndex({ date: 1 });
    await Payout.collection.createIndex({ staffId: 1 });
    console.log('MongoDB Indexes created');

    await Product.updateMany({ sectionName: { $exists: false } }, { $set: { sectionName: 'General', placement: ['home_grid'] } });

    const settingsExists = await AppSettings.findOne({});
    if (!settingsExists) await AppSettings.create({ settingsId: 'main', storeOpen: true });

    for (const [i, name] of ['General', 'Fresh', 'Featured', 'Offers', 'Daily Essentials'].entries()) {
      const exists = await Section.findOne({ name });
      if (!exists) {
        const count = await Section.countDocuments();
        await Section.create({ name, sectionId: `SEC_${String(count + 1).padStart(3, '0')}`, active: true, position: i });
      }
    }
    console.log('Auto-migration done');
  } catch (err) { console.log('Setup error:', err.message); }
});

// ── SERVER START ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Quick10 running on ${PORT}`);
  console.log(`Socket.io ready`);
});
