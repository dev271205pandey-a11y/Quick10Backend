require('dotenv').config()
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const mongoose = require('mongoose');
const http  = require('http');
const https = require('https');
const { Server } = require('socket.io');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcryptjs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dw1fwrcz0',
  api_key:    process.env.CLOUDINARY_API_KEY    || '935717982737519',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'bwpi2vW6bGxiCbfSoe3N0ShP6Ko',
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  if (req.method === 'GET') res.set('Cache-Control', 'public, max-age=300');
  next();
});

mongoose.connect('mongodb+srv://quickadmin:dev271201deva@cluster0.o9mlhyd.mongodb.net/quick10?retryWrites=true&w=majority')
  .then(() => console.log('MongoDB Connected to quick10!'))
  .catch(err => console.log('MongoDB Error:', err));

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
  keywords:           { type: [String], default: [] },
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
  paymentStatus:       { type: String, default: 'pending', enum: ['pending', 'paid', 'failed'] },
  paymentId:           String,
  paymentOrderId:      String,
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
  currentlyNotifying:  String,
  pickerAcceptedAt:    Date,
  dispatchedAt:        Date,
  deliveredAt:         Date,
  earningAmount:       { type: Number, default: 30 },
  currentLocation:     {
    lat:       Number,
    lng:       Number,
    updatedAt: Date,
  },
  customerLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  phone:     { type: String, unique: true, sparse: true },
  name:      String,
  email:     { type: String, unique: true, sparse: true },
  password:  String,
  addresses: Array,
  pushToken: { type: String, default: '' },
}, { timestamps: true });

const StaffSchema = new mongoose.Schema({
  name:               String,
  phone:              { type: String, unique: true, sparse: true },
  mobile:             String,
  password:           String,
  role:               { type: String, default: 'Picker' },
  staffId:            String,
  profilePhoto:       String,
  aboutText:          String,
  bio:                String,
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
  branchName:         String,
  bankPassbookImage:  String,
  totalOrdersHandled: { type: Number, default: 0 },
  totalEarnings:      { type: Number, default: 0 },
  currentOrderId:     String,
  active:             { type: Boolean, default: true },
  isActive:           { type: Boolean, default: true },
  isOnline:           { type: Boolean, default: false },
  lastAssignedAt:     { type: Date,    default: null },
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
  orderNum:                 { type: Number, default: 0 },
  order:                    { type: Number, default: 0 },
  active:                   { type: Boolean, default: true },
  targetMotherCategoryId:   { type: String, default: '' },
  targetMotherCategoryName: { type: String, default: '' },
  featuredProducts:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  showFeaturedProducts:     { type: Boolean, default: false },
}, { timestamps: true, strict: false });

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
  warehouseLat:      { type: Number,  default: null },
  warehouseLng:      { type: Number,  default: null },
  warehouseAddress:  { type: String,  default: '' },
  warehouseCity:     { type: String,  default: '' },
  maxDeliveryRadius: { type: Number,  default: 10 },
  forcedUpdate:      { type: Boolean, default: false },
  maintenanceMode:   { type: Boolean, default: false },
  appVersion:        { type: String,  default: '1.0.0' },
  freshBannerUrl:    { type: String,  default: '' },
  footerText:        { type: String,  default: 'Thank you for choosing Quick10! Fresh groceries delivered in 10 mins, with love.' },
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
  bgColor:    { type: String, default: '' },
  iconUrl:    { type: String, default: '' },
  fontStyle:  { type: String, default: 'default' },
  order:      { type: Number, default: 0 },
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
  image:            String,
  motherCategoryId: String,
  section:          { type: String, default: 'Other' },
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

const SpecialSectionSchema = new mongoose.Schema({
  titleLine1: { type: String, default: 'Special' },
  titleLine2: { type: String, default: 'For You' },
  subtitle:   { type: String, default: 'Fresh, Fixed — Delivered in 10 mins' },
  smallText:  { type: String, default: '✦ curated for you ✦' },
  imageUrl:   { type: String, default: '' },
  showImage:  { type: Boolean, default: false },
  active:     { type: Boolean, default: true },
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
const PremiumCategory  = mongoose.model('PremiumCategory',  PremiumCategorySchema);
const SpecialSection   = mongoose.model('SpecialSection',   SpecialSectionSchema);

const DeliveryTimesSchema = new mongoose.Schema({
  times:     { type: [String], default: ['20', '25', '30', '22', '28', '35'] },
  updatedAt: { type: Date, default: Date.now },
});
const DeliveryTimes = mongoose.model('DeliveryTimes', DeliveryTimesSchema);

const BroadcastSchema = new mongoose.Schema({
  message:   { type: String, required: true },
  imageUrl:  { type: String, default: '' },
  readBy:    { type: [String], default: [] },
  linkType:  { type: String, default: '' },
  linkValue: { type: String, default: '' },
  linkName:  { type: String, default: '' },
}, { timestamps: true });
const Broadcast = mongoose.model('Broadcast', BroadcastSchema);

const RatingSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  userEmail: { type: String, required: true },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  orderId:   { type: String },
}, { timestamps: true });
const Rating = mongoose.model('Rating', RatingSchema);

// ── GEOCODING ─────────────────────────────────────────────────
function _nominatimGet(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Quick10App/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (Array.isArray(results) && results.length > 0)
            resolve({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
          else resolve(null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
  });
}

// Balrampur region bounds — any result outside this is rejected as wrong
const BALRAMPUR_BOUNDS = { minLat: 26.5, maxLat: 28.5, minLng: 81.5, maxLng: 83.5 };
const VIEWBOX = `${BALRAMPUR_BOUNDS.minLng},${BALRAMPUR_BOUNDS.maxLat},${BALRAMPUR_BOUNDS.maxLng},${BALRAMPUR_BOUNDS.minLat}`;

function _isInBalrampurRegion(lat, lng) {
  return lat > BALRAMPUR_BOUNDS.minLat && lat < BALRAMPUR_BOUNDS.maxLat
      && lng > BALRAMPUR_BOUNDS.minLng && lng < BALRAMPUR_BOUNDS.maxLng;
}

async function geocodeAddress(addressObj) {
  try {
    let queries = [];

    if (typeof addressObj === 'string') {
      let q = addressObj.trim();
      if (!q.toLowerCase().includes('balrampur')) q += ', Balrampur, Uttar Pradesh';
      queries.push(q);
    } else {
      const addr = addressObj || {};
      // Always append Balrampur context to every search query
      const suffix = ', Balrampur, Uttar Pradesh, India';

      // 1. area + city (most specific)
      if (addr.area && addr.city) {
        queries.push(`${addr.area}, ${addr.city}${suffix}`);
      }
      // 2. city + state
      if (addr.city && addr.state) {
        queries.push(`${addr.city}, ${addr.state}, India`);
      }
      // 3. pincode
      if (addr.pincode) {
        queries.push(`${addr.pincode}, Balrampur, Uttar Pradesh, India`);
      }
      // 4. fullAddress fallback
      const fallback = addr.fullAddress ||
        [addr.houseNo, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
      if (fallback) queries.push(fallback + suffix);
    }

    for (const rawQ of queries) {
      const q   = encodeURIComponent(rawQ);
      // bounded=1 + viewbox restricts Nominatim to Balrampur region
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1` +
                  `&viewbox=${VIEWBOX}&bounded=1&q=${q}`;
      const r   = await _nominatimGet(url);
      if (r && _isInBalrampurRegion(r.lat, r.lng)) {
        console.log(`[GEOCODE] "${rawQ}" → ${r.lat}, ${r.lng}`);
        return r;
      }
      // Small delay between queries to respect Nominatim rate limit
      await new Promise(res => setTimeout(res, 300));
    }

    console.log('[GEOCODE] All queries failed for:', typeof addressObj === 'string' ? addressObj : addressObj?.city);
    return null;
  } catch (e) { console.log('[GEOCODE] Error:', e.message); return null; }
}

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

// ── Auto-delete chats older than 24 hours (runs every hour) ──
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let deleted = 0;
  for (const phone of Object.keys(chatMessages)) {
    const msgs = chatMessages[phone]?.messages;
    if (!msgs || msgs.length === 0) { delete chatMessages[phone]; deleted++; continue; }
    chatMessages[phone].messages = msgs.filter(m => new Date(m.time).getTime() > cutoff);
    if (chatMessages[phone].messages.length === 0) { delete chatMessages[phone]; deleted++; }
  }
  if (deleted > 0) console.log(`[Chat Cleanup] ${deleted} old chats deleted. Active: ${Object.keys(chatMessages).length}`);
}, 60 * 60 * 1000);

const emitOrderUpdate = (order) => {
  if (!order) return;
  io.to('warehouse_admin').emit('order_update', order);
  if (order.userPhone) io.to('customer_' + order.userPhone).emit('order_update', order);
  if (order.userEmail) io.to('customer_' + order.userEmail).emit('order_update', order);
  if (order.deliveryPartnerId) {
    io.to('delivery_' + order.deliveryPartnerId.toString()).emit('order_update', order);
  }
};

// Round-robin auto-assign: pick the delivery_partner with the oldest lastAssignedAt
// isOnline: true = partner is active in the app; isAvailable: true = not on a delivery
async function assignNextPartner(order) {
  const rejectedIds = (order.rejectedBy || [])
    .filter(id => mongoose.Types.ObjectId.isValid(String(id)))
    .map(id => new mongoose.Types.ObjectId(String(id)));

  const eligible = await Staff.find({
    role:        'delivery_partner',
    isActive:    true,
    isOnline:    true,
    isAvailable: true,
    _id:         { $nin: rejectedIds },
  }).lean();

  if (eligible.length === 0) {
    order.currentlyNotifying = null;
    await order.save();
    io.to('warehouse_admin').emit('no_partners_available', { orderId: order._id });
    return null;
  }

  // Sort ascending: null lastAssignedAt → epoch 0 → highest priority
  eligible.sort((a, b) => {
    const ta = a.lastAssignedAt ? new Date(a.lastAssignedAt).getTime() : 0;
    const tb = b.lastAssignedAt ? new Date(b.lastAssignedAt).getTime() : 0;
    return ta - tb;
  });

  const nextPartner = eligible[0];

  // Stamp lastAssignedAt NOW (notify time), not on accept
  await Staff.findByIdAndUpdate(nextPartner._id, { lastAssignedAt: new Date() });

  order.currentlyNotifying   = nextPartner._id;
  order.deliveryPartnerId    = nextPartner._id.toString();
  order.deliveryPartnerName  = nextPartner.name;
  order.deliveryPartnerPhone = nextPartner.phone;
  await order.save();

  const freshOrder = await Order.findById(order._id).lean();
  io.to('delivery_' + nextPartner._id.toString()).emit('new_order_available', {
    order:   freshOrder,
    earning: freshOrder?.earningAmount || 30,
  });

  console.log(`[ASSIGN] Order ${order._id} → ${nextPartner.name} (${nextPartner._id}) | lastAssignedAt: ${new Date().toISOString()}`);

  return nextPartner;
}

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(socket.id, 'joined', room);
  });

  socket.on('join', (room) => {
    socket.join(room);
    console.log(socket.id, 'joined room:', room);
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

  // Alias for warehouse admin panel
  socket.on('admin_join', () => {
    connectedUsers['admin'] = socket.id;
    socket.join('warehouse_admin');
    socket.emit('admin_authenticated', { success: true });
    socket.emit('all_chats', chatMessages);
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
    const { _id, phone, name } = data;
    const key = _id || phone;
    onlineDeliveryPartners[key] = { socketId: socket.id, name, phone, _id: key, busy: false };
    socket.join('delivery_available');
    socket.join('delivery_' + key);
    if (phone && phone !== key) socket.join('delivery_' + phone);
  });
  socket.on('delivery_offline', (data) => {
    const key = data && typeof data === 'object' ? (data._id || data.phone) : data;
    delete onlineDeliveryPartners[key];
    socket.leave('delivery_available');
  });
  socket.on('delivery_busy', (data) => {
    const key = data && typeof data === 'object' ? (data._id || data.phone) : data;
    if (onlineDeliveryPartners[key]) onlineDeliveryPartners[key].busy = true;
  });
  socket.on('delivery_free', (data) => {
    const key = data && typeof data === 'object' ? (data._id || data.phone) : data;
    if (onlineDeliveryPartners[key]) onlineDeliveryPartners[key].busy = false;
  });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    Object.keys(connectedUsers).forEach(k => { if (connectedUsers[k] === socket.id) delete connectedUsers[k]; });
    Object.keys(onlineDeliveryPartners).forEach(k => { if (onlineDeliveryPartners[k]?.socketId === socket.id) delete onlineDeliveryPartners[k]; });
  });
});

// ── ADMIN CHAT REST API ───────────────────────────────────────
app.get('/api/admin/chats', (req, res) => {
  const list = Object.values(chatMessages).map(c => ({
    phone:       c.phone,
    name:        c.name || c.phone,
    messages:    c.messages || [],
    lastMessage: (c.messages || []).slice(-1)[0]?.text || '',
    lastTime:    (c.messages || []).slice(-1)[0]?.time || '',
    unread:      0,
  }));
  res.json({ success: true, chats: list });
});

app.delete('/api/admin/chats/:phone', (req, res) => {
  delete chatMessages[req.params.phone];
  res.json({ success: true });
});

// ── DEBUG ─────────────────────────────────────────────────────
app.get('/api/debug/rooms', (req, res) => {
  const roomList = {};
  io.sockets.adapter.rooms.forEach((sockets, roomName) => {
    roomList[roomName] = sockets.size;
  });
  res.json({ rooms: roomList });
});

app.get('/api/debug', async (req, res) => {
  try {
    const count = await Product.countDocuments({});
    const collections = await mongoose.connection.db.listCollections().toArray();
    const dbName = mongoose.connection.db.databaseName;
    res.json({
      productCount: count,
      database: dbName,
      collections: collections.map(c => c.name)
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.get('/api/debug/fix-stuck-order', async (req, res) => {
  try {
    const order = await Order.findById('6a2d3a05d53f94db55e4e807');
    if (order) {
      order.currentlyNotifying = null;
      await order.save();
      return res.json({ success: true, message: 'Fixed', order });
    }
    res.json({ success: false, message: 'Order not found' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Safe fix: cancel only orders stuck for 24+ hours, reset only their assigned staff
app.get('/api/fix-stuck-orders', async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find stuck orders before updating so we can emit + reset matching staff
    const stuckOrders = await Order.find({
      status:    { $in: ['packing', 'accepted', 'pending'] },
      createdAt: { $lt: twentyFourHoursAgo },
    }).lean();

    if (stuckOrders.length === 0) {
      return res.json({ success: true, ordersFixed: 0, staffFixed: 0 });
    }

    const stuckIds = stuckOrders.map(o => o._id);

    await Order.updateMany({ _id: { $in: stuckIds } }, { status: 'cancelled' });

    // Emit socket update for each cancelled order
    stuckOrders.forEach(o => emitOrderUpdate({ ...o, status: 'cancelled' }));

    // Reset only staff whose currentOrderId was one of the cancelled orders
    const stuckIdStrings = stuckIds.map(id => id.toString());
    const staffResult = await Staff.updateMany(
      { currentOrderId: { $in: stuckIdStrings } },
      { currentOrderId: null, isAvailable: true }
    );

    res.json({
      success:    true,
      ordersFixed: stuckOrders.length,
      staffFixed:  staffResult.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ONE-TIME CLEANUP: clear invalid sectionNames ──────────────
app.get('/api/fix-section-duplicates', async (req, res) => {
  try {
    const dbSections = await Section.find({});
    const validSectionNames = new Set(dbSections.map(s => s.name).filter(Boolean));

    const products = await Product.find({
      sectionName: { $exists: true, $ne: 'General', $ne: '' },
    });

    let fixedCount = 0;
    for (const p of products) {
      if (p.sectionName && !validSectionNames.has(p.sectionName)) {
        await Product.findByIdAndUpdate(p._id, { sectionName: 'General' });
        fixedCount++;
      }
    }

    res.json({
      success: true,
      fixedCount,
      validSections: [...validSectionNames],
      message: `${fixedCount} products ka invalid sectionName 'General' kar diya`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── HEALTH ────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'OK', message: 'Backend is running!' }));

// ── NOTIFICATION SOUND (WAV generated in Node.js) ─────────────
app.get('/api/notification-sound', (req, res) => {
  const sampleRate  = 22050;
  const tones = [
    { freq: 880,  from: 0.00, to: 0.20 },
    { freq: 1100, from: 0.25, to: 0.45 },
    { freq: 1320, from: 0.50, to: 0.78 },
  ];
  const totalSamples = Math.floor(sampleRate * 0.85);
  const dataBytes    = totalSamples * 2; // 16-bit PCM
  const buf          = Buffer.alloc(44 + dataBytes);

  // WAV header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);           // PCM
  buf.writeUInt16LE(1, 22);           // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);           // block align
  buf.writeUInt16LE(16, 34);          // 16-bit
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    for (const tone of tones) {
      if (t >= tone.from && t < tone.to) {
        const dur = tone.to - tone.from;
        const lt  = t - tone.from;
        const env = Math.min(lt / 0.015, 1) * Math.min((dur - lt) / 0.015, 1);
        sample += env * 0.7 * Math.sin(2 * Math.PI * tone.freq * lt);
      }
    }
    const pcm = Math.max(-32768, Math.min(32767, Math.round(sample * 28000)));
    buf.writeInt16LE(pcm, 44 + i * 2);
  }

  res.set({
    'Content-Type':  'audio/wav',
    'Cache-Control': 'public, max-age=86400',
    'Content-Length': buf.length,
  });
  res.send(buf);
});

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

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.json({ success: false, message: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.json({ success: false, message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      name: name || 'Quick10 User',
      phone: email,
    });
    await user.save();

    res.json({ success: true, user: { _id: user._id, email: user.email, name: user.name } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.TEST_USER_EMAIL) {
      const user = await User.findOne({ email });
      if (!user) return res.json({ success: false, message: 'Test account not found' });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.json({ success: false, message: 'Invalid password' });
      return res.json({
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          addresses: user.addresses,
          isTestAccount: true
        },
        message: 'Test account login successful'
      });
    }

    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: 'Email not registered' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: 'Wrong password' });

    res.json({ success: true, user: { _id: user._id, email: user.email, name: user.name, addresses: user.addresses } });
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

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    // ── Search shortcut ───────────────────────────────────────────
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      const filter = {
        active: true,
        $or: [
          { name:        { $regex: searchTerm, $options: 'i' } },
          { keywords:    { $elemMatch: { $regex: searchTerm, $options: 'i' } } },
          { description: { $regex: searchTerm, $options: 'i' } },
        ],
      };
      const products = await Product.find(filter)
        .sort({ position: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      return res.json({ success: true, products, page, limit });
    }

    let filter = {};
    if (active === 'all') delete filter.active;

    if (req.query.ids) {
      const idArray = req.query.ids.split(',');
      filter._id = { $in: idArray };
    }

    if (isBanner === 'true')           filter.isBanner          = true;
    if (showInFresh === 'true')        filter.showInFresh        = true;
    if (inFeaturedSection === 'true')  filter.inFeaturedSection  = true;
    if (showOnHome === 'true')         filter.showOnHome         = true;
    if (sectionName)                   filter.sectionName        = sectionName;
    if (placement)                     filter.placement          = placement;
    if (freshCategoryId)               filter.freshCategoryId    = freshCategoryId;
    if (freshCategoryName)             filter.freshCategoryName  = freshCategoryName;

    const shopCatQuery = shopCategoryId || shopCategory;
    if (shopCatQuery || shopCategoryName) {
      let isValid = false;
      try { isValid = mongoose.Types.ObjectId.isValid(shopCatQuery); } catch (_) {}
      const shopCat = shopCatQuery
        ? await ShopCategory.findOne({
            $or: [
              ...(isValid ? [{ _id: shopCatQuery }] : []),
              { shopCategoryId: shopCatQuery },
            ],
          })
        : null;

      if (shopCat) {
        filter.$or = [
          { shopCategoryId: shopCat._id.toString() },
          { shopCategoryId: shopCat.shopCategoryId },
          { shopCategoryName: shopCat.name },
        ];
      } else {
        filter.$or = [
          { shopCategoryId: shopCatQuery || shopCategoryName },
          { shopCategoryName: shopCatQuery || shopCategoryName },
        ];
      }
    }

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

    const products = await Product.find(filter)
      .sort({ position: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    res.json({ success: true, products, page, limit });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/products/all', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ position: 1 }).lean();
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
    const categories = await Category.find({}).lean();
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
    const cats = await MotherCategory.find({}).sort({ order: 1, position: 1 }).lean();
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
    const cats = await FreshCategory.find({ active: true }).sort({ order: 1 }).lean();
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
    const filter = {};
    if (categoryId)       filter.categoryId       = categoryId;
    if (motherCategoryId) filter.motherCategoryId = motherCategoryId;
    if (shopCategoryId)   filter.shopCategoryId   = shopCategoryId;
    if (parentType)       filter.parentType       = parentType;
    const cats = await SubCategory.find(filter).sort({ position: 1 }).lean();
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
    const sections = await Section.find({ active: true }).sort({ position: 1 });
    const products = await Product.find({});

    const sectionsWithProducts = sections.map(section => {
      const sectionProducts = products.filter(p =>
        p.sectionName === section.name ||
        p.sectionId === section.sectionId
      );
      return {
        ...section.toObject(),
        products: sectionProducts
      };
    });

    res.json({ success: true, sections: sectionsWithProducts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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
    const sections = await Section.find({ active: true }).lean();
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
    const cats = await ShopCategory.find(filter).sort({ position: 1 }).lean();
    res.json({ success: true, categories: cats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.get('/api/shop-categories/by-mother/:motherCategoryId', async (req, res) => {
  try {
    const cats = await ShopCategory.find({ motherCategoryId: req.params.motherCategoryId, active: true }).sort({ position: 1 }).lean();
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
    const filter = {};
    if (req.query.status)            filter.status            = req.query.status;
    if (req.query.deliveryPartnerId) filter.deliveryPartnerId = req.query.deliveryPartnerId;
    if (req.query.userPhone)         filter.userPhone         = req.query.userPhone;
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();

    // Enrich orders with customer name from User collection (by phone)
    const phones  = [...new Set(orders.map(o => o.userPhone).filter(Boolean))];
    const users   = phones.length
      ? await User.find({ phone: { $in: phones } }, 'name phone').lean()
      : [];
    const userMap = {};
    users.forEach(u => { if (u.phone) userMap[u.phone] = u.name || ''; });

    const enriched = orders.map(o => ({
      ...o,
      customerName: userMap[o.userPhone] || '',
    }));

    res.json({ success: true, orders: enriched });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/orders', async (req, res) => {
  try {
    const WAREHOUSE_LAT = 27.4244;
    const WAREHOUSE_LNG = 82.1833;

    const order = new Order({ ...req.body, orderId: 'ORD' + Date.now() });
    await order.save();
    io.to('warehouse_admin').emit('new_order', order);
    res.json({ success: true, order });

    // Background geocoding — does not block the response
    const cLat = order.customerLocation?.lat;
    const cLng = order.customerLocation?.lng;
    const isMissing     = !cLat || !cLng;
    const isSameAsWH    = cLat === WAREHOUSE_LAT && cLng === WAREHOUSE_LNG;
    const isOutOfRegion = cLat && !_isInBalrampurRegion(cLat, cLng);

    if ((isMissing || isSameAsWH || isOutOfRegion) && order.address) {
      geocodeAddress(order.address).then(async (coords) => {
        if (coords) {
          await Order.findByIdAndUpdate(order._id, { customerLocation: coords });
          console.log(`[GEOCODE] Order ${order._id}: ${coords.lat}, ${coords.lng}`);
        }
      }).catch(() => {});
    }
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.get('/api/orders/user/:phone', async (req, res) => {
  try {
    const orders = await Order.find({ userPhone: req.params.phone }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.get('/api/orders/:id', async (req, res) => {
  try { const order = await Order.findById(req.params.id).lean(); res.json({ success: true, order }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Picker accepts order → status: packing, notify next eligible delivery partner (round-robin)
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

    const partner = await assignNextPartner(order);
    if (!partner) {
      io.to('warehouse_admin').emit('no_partners_available', {
        orderId: order._id,
        message: 'Koi available delivery partner nahi hai!',
      });
    }

    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Picker done packing → status: ready_pickup
// If a partner already has this order, push order_update to their screen.
// If no partner yet, run round-robin to find and notify the next eligible one.
app.put('/api/orders/:id/ready-pickup', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'ready_pickup', packed_at: new Date() },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });

    console.log(`[READY-PICKUP] orderId=${order._id} deliveryPartnerId=${order.deliveryPartnerId}`);

    if (order.deliveryPartnerId) {
      const room = 'delivery_' + order.deliveryPartnerId.toString();
      // Emit directly — explicit log so we can confirm delivery in server logs
      io.to(room).emit('order_update', order);
      console.log(`[SOCKET] order_update → ${room} (status: ready_pickup)`);

      io.to('customer_' + order.userPhone).emit('order_update', order);
      io.to('warehouse_admin').emit('order_update', order);
    } else {
      // No partner yet — reset rejectedBy and find the next eligible one
      console.log(`[READY-PICKUP] No partner assigned yet — running assignNextPartner`);
      order.rejectedBy = [];
      await order.save();
      const partner = await assignNextPartner(order);
      if (!partner) {
        io.to('warehouse_admin').emit('no_partners_available', {
          orderId: order._id,
          message: 'Koi available delivery partner nahi hai!',
        });
      }
      io.to('warehouse_admin').emit('order_update', order);
    }

    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delivery partner picks up → status: dispatched, mark partner busy
app.put('/api/orders/:id/dispatch', async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'dispatched', dispatched_at: new Date(), dispatchedAt: new Date(), deliveryPartnerId },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    if (deliveryPartnerId) {
      await Staff.findByIdAndUpdate(deliveryPartnerId, {
        isAvailable: false, available: false,
        currentOrderId: order._id.toString(),
      });
      if (onlineDeliveryPartners[deliveryPartnerId]) onlineDeliveryPartners[deliveryPartnerId].busy = true;
    }
    emitOrderUpdate(order);
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delivery partner delivered → status: delivered, free partner
app.put('/api/orders/:id/deliver', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'delivered', delivered_at: new Date(), deliveredAt: new Date() },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    emitOrderUpdate(order);
    const pid = req.body.deliveryPartnerId || order.deliveryPartnerId;
    if (pid) {
      await Staff.findByIdAndUpdate(pid, {
        $inc: { totalOrdersHandled: 1, totalEarnings: order.earningAmount || 30 },
        isAvailable: true, available: true, currentOrderId: null,
      });
      if (onlineDeliveryPartners[pid]) onlineDeliveryPartners[pid].busy = false;
    }
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Notify all available delivery partners
app.put('/api/orders/:id/notify-partners', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    io.to('delivery_available').emit('new_order_available', order);
    res.json({ success: true, message: 'Partners notified' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delivery partner accepts delivery
app.put('/api/orders/:id/accept-delivery', async (req, res) => {
  try {
    const { deliveryPartnerId, deliveryPartnerName, deliveryPartnerPhone, partnerName } = req.body;
    const resolvedName  = deliveryPartnerName || partnerName;
    const existing = await Order.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
    if (existing.deliveryPartnerId && existing.deliveryPartnerId !== deliveryPartnerId) {
      return res.json({ success: false, message: 'Order already taken by another partner' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        deliveryPartnerId,
        deliveryPartnerName:  resolvedName,
        deliveryPartnerPhone: deliveryPartnerPhone || existing.deliveryPartnerPhone,
        assignedTo:   deliveryPartnerId,
        assignedName: resolvedName,
      },
      { new: true }
    );
    emitOrderUpdate(order);
    if (onlineDeliveryPartners[deliveryPartnerId]) onlineDeliveryPartners[deliveryPartnerId].busy = true;
    // Mark partner busy in DB
    if (deliveryPartnerId) {
      await Staff.findByIdAndUpdate(deliveryPartnerId, {
        isAvailable:   false,
        available:     false,
        currentOrderId: order._id.toString(),
      });
    }
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delivery partner rejects delivery → notify next partner (round-robin via assignNextPartner)
app.put('/api/orders/:id/reject-delivery', async (req, res) => {
  try {
    const { partnerId, partnerName } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });

    // Add to rejectedBy (dedup), clear currentlyNotifying, then save
    if (!order.rejectedBy.map(String).includes(String(partnerId))) {
      order.rejectedBy.push(String(partnerId));
    }
    order.currentlyNotifying = null;
    await order.save();

    io.to('warehouse_admin').emit('partner_rejected', {
      orderId: order._id,
      partnerName,
      message: (partnerName || 'Partner') + ' ne order reject kar diya!',
    });

    const nextPartner = await assignNextPartner(order);

    if (!nextPartner) {
      io.to('warehouse_admin').emit('manual_assign_needed', {
        orderId: order._id,
        message: 'Koi available partner nahi hai! Manual assign karo!',
      });
    }

    res.json({ success: true, nextPartner: nextPartner?.name || null });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Admin manually assigns delivery partner → emit new_order_available directly to that partner
app.put('/api/orders/:id/assign-partner', async (req, res) => {
  try {
    // Accept both field name conventions (warehouse app uses both)
    const resolvedId = req.body.deliveryPartnerId || req.body.partnerId;

    const partner = await Staff.findById(resolvedId);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });

    // Remove this partner from rejectedBy in case they were previously rejected (allows re-assignment)
    order.rejectedBy = (order.rejectedBy || []).filter(
      id => String(id) !== String(resolvedId)
    );
    order.currentlyNotifying   = String(resolvedId);
    order.deliveryPartnerId    = String(resolvedId);
    order.deliveryPartnerName  = req.body.deliveryPartnerName || req.body.partnerName || partner.name;
    order.deliveryPartnerPhone = req.body.partnerPhone || partner.phone;
    order.status               = 'ready_pickup';
    await order.save();

    console.log('Emitting new_order_available to room: delivery_' + resolvedId);
    io.to('delivery_' + resolvedId).emit('new_order_available', {
      order,
      earning: order.earningAmount || 30,
      isManualAssign: true,
    });

    io.to('warehouse_admin').emit('order_update', order);
    res.json({ success: true, order });
  } catch (err) {
    console.log('Assign partner error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
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

// Backfill geocoded customerLocation for existing orders that have missing/default coords
app.put('/api/orders/:id/cancel', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', cancelledAt: new Date(), cancelledBy: req.body.cancelledBy || 'customer' },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    emitOrderUpdate(order);
    // Free up delivery partner if assigned
    const pid = order.deliveryPartnerId;
    if (pid) {
      await Staff.findByIdAndUpdate(pid, {
        isAvailable: true, available: true, currentOrderId: null,
      });
      if (onlineDeliveryPartners[pid]) onlineDeliveryPartners[pid].busy = false;
    }
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/orders/:id/geocode-address', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const addr = order.address || {};
    const addrText = typeof addr === 'string'
      ? addr
      : addr.fullAddress ||
        [addr.flat || addr.houseNo, addr.landmark, addr.area, addr.city, addr.pincode]
          .filter(Boolean).join(', ');

    if (!addrText) return res.json({ success: false, message: 'No address found on order' });

    const geo = await geocodeAddress(addrText);
    if (!geo) return res.json({ success: false, message: 'Geocoding failed — address not found' });

    await Order.findByIdAndUpdate(req.params.id, { customerLocation: geo });
    res.json({ success: true, customerLocation: geo, address: addrText });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Backfill geocoded customerLocation for old orders that have missing/default coords
app.get('/api/geocode-all-orders', async (req, res) => {
  try {
    const WAREHOUSE_LAT = 27.4244;
    const WAREHOUSE_LNG = 82.1833;
    const orders = await Order.find({
      $or: [
        { customerLocation: null },
        { customerLocation: { $exists: false } },
        { 'customerLocation.lat': { $exists: false } },
        { 'customerLocation.lat': WAREHOUSE_LAT },
      ],
    }).limit(50);

    let fixed = 0;
    for (const order of orders) {
      const coords = await geocodeAddress(order.address);
      if (coords) {
        await Order.findByIdAndUpdate(order._id, { customerLocation: coords });
        fixed++;
        console.log(`[GEOCODE-ALL] ${order._id}: ${coords.lat}, ${coords.lng}`);
      }
      // Rate limit Nominatim — 1 req/sec
      await new Promise(r => setTimeout(r, 1100));
    }
    res.json({ success: true, fixed, checked: orders.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Fix active orders with missing/wrong customerLocation
app.get('/api/geocode-pending-orders', async (req, res) => {
  try {
    const WAREHOUSE_LAT = 27.4244;
    const WAREHOUSE_LNG = 82.1833;
    const orders = await Order.find({
      status: { $nin: ['delivered', 'cancelled'] },
      $or: [
        { 'customerLocation.lat': { $exists: false } },
        { 'customerLocation.lat': null },
        { 'customerLocation.lat': WAREHOUSE_LAT },
        { 'customerLocation.lng': WAREHOUSE_LNG },
      ],
    }).lean();

    console.log(`[GEOCODE-PENDING] ${orders.length} active orders to fix`);
    let fixed = 0;

    for (const order of orders) {
      const coords = await geocodeAddress(order.address);
      if (coords) {
        await Order.findByIdAndUpdate(order._id, { customerLocation: coords });
        fixed++;
        console.log(`[GEOCODE-PENDING] Fixed ${order._id}: ${coords.lat}, ${coords.lng}`);
      }
      await new Promise(r => setTimeout(r, 1100)); // Nominatim 1 req/sec rate limit
    }

    res.json({ success: true, total: orders.length, fixed });
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

// Temporary cleanup: delete all active (non-delivered) orders, reset all staff
app.delete('/api/orders/delete-all-packing', async (req, res) => {
  try {
    const del = await Order.deleteMany({
      status: { $in: ['pending', 'accepted', 'packing', 'ready_pickup', 'dispatched'] }
    });
    await Staff.updateMany({}, { currentOrderId: null, isAvailable: true });
    res.json({ success: true, message: 'Cleared', deletedCount: del.deletedCount });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── DELIVERY ──────────────────────────────────────────────────
app.get('/api/delivery/available-orders', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'packed', assignedTo: null }).lean();
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
    const order = await Order.findOne({ assignedTo: req.params.phone, status: 'out_for_delivery' }).lean();
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

// ── TEMP DEBUG (remove after use) ─────────────────────────────
app.get('/api/staff/debug-all', async (req, res) => {
  try {
    const allStaff = await Staff.find({})
      .select('_id name phone role isActive isOnline isAvailable currentOrderId lastAssignedAt')
      .lean();
    res.json({ success: true, count: allStaff.length, staff: allStaff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── USERS ─────────────────────────────────────────────────────
app.get('/api/users/:phone', async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone }).lean();
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
app.post('/api/users/:phone/addresses', async (req, res) => {
  try {
    let user = await User.findOne({ phone: req.params.phone });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const newAddr = { ...req.body, id: Date.now().toString() };
    const updated = await User.findOneAndUpdate(
      { phone: req.params.phone },
      { $push: { addresses: newAddr } },
      { new: true }
    );
    res.json({ success: true, user: updated });
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

app.delete('/api/staff/delete-all', async (req, res) => {
  try {
    await Staff.deleteMany({});
    res.json({ success: true, message: 'All staff deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/staff', async (req, res) => {
  try {
    const filter = {};
    if (req.query.role)        filter.role        = req.query.role;
    if (req.query.isAvailable) filter.isAvailable = req.query.isAvailable === 'true';
    if (req.query.active)      filter.active      = req.query.active      === 'true';
    if (req.query.isActive)    filter.isActive    = req.query.isActive    === 'true';
    const staff = await Staff.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.get('/api/delivery-partners/:id', async (req, res) => {
  try {
    const partner = await Staff.findById(req.params.id).lean();
    if (!partner) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({
      success: true,
      partner: {
        _id:             partner._id,
        name:            partner.name,
        phone:           partner.phone,
        profileImageUrl: partner.profilePhoto || '',
        aboutText:       partner.aboutText    || '',
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
// Debug: see rotation state for all delivery partners
app.get('/api/staff/debug-rotation', async (req, res) => {
  try {
    const partners = await Staff.find(
      { role: 'delivery_partner' },
      'name isActive isAvailable isOnline lastAssignedAt currentOrderId'
    ).sort({ lastAssignedAt: 1 }).lean();

    res.json({
      success: true,
      count: partners.length,
      partners: partners.map(p => ({
        name:           p.name,
        isActive:       p.isActive,
        isAvailable:    p.isAvailable,
        isOnline:       p.isOnline,
        currentOrderId: p.currentOrderId || null,
        lastAssignedAt: p.lastAssignedAt || null,
        nextInLine:     !p.lastAssignedAt ? '★ FIRST' : undefined,
      })),
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/staff/:id', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).lean();
    if (!staff) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/staff', async (req, res) => {
  try {
    const phone = req.body.phone || req.body.mobile;
    const exists = await Staff.findOne({ $or: [{ phone }, { mobile: phone }].filter(x => Object.values(x)[0]) });
    if (exists) return res.json({ success: false, message: 'Phone number already registered' });
    const staffId = await generateStaffId(req.body.role || 'Picker');
    const staff = new Staff({ ...req.body, phone: phone || req.body.phone, staffId });
    await staff.save();
    res.json({ success: true, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/staff/:id', async (req, res) => {
  try {
    const updateFields = {};
    const allowed = ['name', 'phone', 'password', 'role', 'aadhaarNumber', 'panNumber',
      'bankName', 'branchName', 'accountNo', 'ifsc', 'bio', 'isActive', 'isAvailable'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updateFields[field] = req.body[field];
    });
    const staff = await Staff.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.delete('/api/staff/:id', async (req, res) => {
  try { await Staff.findByIdAndDelete(req.params.id); res.json({ success: true, message: 'Deleted' }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.get('/api/staff/delete-test/:id', async (req, res) => {
  try {
    const result = await Staff.findByIdAndDelete(req.params.id);
    if (result) {
      res.json({ success: true, message: 'Deleted', staff: result.name });
    } else {
      res.json({ success: false, message: 'Staff not found with id: ' + req.params.id });
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});
app.put('/api/staff/:id/availability', async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, { available: req.body.available, isAvailable: req.body.available }, { new: true });
    if (!staff) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/staff/:id/toggle-status', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Not found' });
    if (staff.currentOrderId && staff.isAvailable === true) {
      return res.json({ success: false, message: 'Active order hai, offline nahi ja sakte' });
    }
    staff.isAvailable = !staff.isAvailable;
    staff.available   = staff.isAvailable;
    await staff.save();
    res.json({ success: true, isAvailable: staff.isAvailable, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delivery partner online/offline toggle (called from delivery app)
app.put('/api/staff/:id/online-status', async (req, res) => {
  try {
    const { isOnline } = req.body;
    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isOnline (boolean) required' });
    }
    // Going offline: keep isAvailable true so they're eligible when they come back online.
    // isOnline is the gate for new order assignment — not isAvailable.
    const updateFields = isOnline
      ? { isOnline: true,  isAvailable: true,  available: true }
      : { isOnline: false, isAvailable: true,  available: true, currentOrderId: null };
    const staff = await Staff.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    io.to('warehouse_admin').emit('partner_status_update', {
      partnerId: staff._id,
      name:      staff.name,
      isOnline:  staff.isOnline,
    });
    res.json({ success: true, isOnline: staff.isOnline, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/staff/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.json({ success: false, message: 'Phone and password required' });
    }

    const staff = await Staff.findOne({ phone: phone.trim() });

    if (!staff) {
      return res.json({ success: false, message: 'Staff not found with this phone number' });
    }

    if (staff.password !== password.trim()) {
      return res.json({ success: false, message: 'Wrong password' });
    }

    res.json({
      success: true,
      staff: {
        _id: staff._id,
        name: staff.name,
        phone: staff.phone,
        role: staff.role,
        staffId: staff.staffId
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.get('/api/staff/:id/earnings', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Not found' });
    const orders = await Order.find({ deliveryPartnerId: req.params.id, status: 'delivered' }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, totalEarnings: staff.totalEarnings, totalOrdersHandled: staff.totalOrdersHandled, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/staff/:id/stats', async (req, res) => {
  try {
    const orders = await Order.find({
      deliveryPartnerId: req.params.id,
      status: 'delivered',
    }).lean();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayOrders = orders.filter(o => {
      const d = new Date(o.deliveredAt || o.createdAt);
      return d >= todayStart && d <= todayEnd;
    });

    const totalEarnings = orders.reduce((sum, o) => sum + (o.earningAmount || 30), 0);
    const todayEarnings = todayOrders.reduce((sum, o) => sum + (o.earningAmount || 30), 0);

    res.json({
      success: true,
      totalOrders:   orders.length,
      todayOrders:   todayOrders.length,
      totalEarnings,
      todayEarnings,
    });
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
    const payouts = await Payout.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, payouts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.get('/api/finance/payouts/:staffId', async (req, res) => {
  try {
    const payouts = await Payout.find({ staffId: req.params.staffId }).sort({ createdAt: -1 }).lean();
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
    const riders = await Staff.find({ role: { $in: ['Rider', 'rider', 'delivery_partner'] } }).lean();
    const todayPayouts = await Payout.find({ date: today }).lean();
    const settings = await AppSettings.findOne({}).lean();
    const commission = settings?.commission || 20;
    const basePay    = settings?.basePay    || 200;
    const start = new Date(); start.setHours(0,0,0,0);
    const end   = new Date(); end.setHours(23,59,59,999);
    const orders = await Order.find({ status: 'delivered', createdAt: { $gte: start, $lte: end } }).lean();
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
    const { image, type = 'general' } = req.body
    if (!image) return res.status(400).json({ success: false, message: 'image required' })

    const uploadOptions = { folder: 'quick10', fetch_format: 'auto', crop: 'limit' }

    if (type === 'thumbnail') {
      uploadOptions.width = 400
      uploadOptions.quality = 'auto:eco'
    } else if (type === 'icon') {
      uploadOptions.width  = 300
      uploadOptions.height = 300
      uploadOptions.quality = 'auto:best'
      uploadOptions.crop = 'fit'
    } else if (type === 'broadcast') {
      uploadOptions.quality = 'auto:best'
      uploadOptions.fetch_format = 'auto'
    } else {
      uploadOptions.width = 800
      uploadOptions.quality = 'auto:good'
    }

    const result = await cloudinary.uploader.upload(image, uploadOptions)
    const imageUrl = (type === 'broadcast' || type === 'icon')
      ? result.secure_url
      : result.secure_url.replace('/upload/', '/upload/w_400,q_70,f_auto/')
    res.json({ success: true, url: imageUrl })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
});

// ── RAZORPAY ──────────────────────────────────────────────────
const Razorpay = require('razorpay');
const razorpay = new Razorpay({ key_id: 'rzp_test_Su4auXVDl2cV9I', key_secret: 'T7KETzJA2yyfkgwONRd4C0sS' });
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
    const expected = crypto.createHmac('sha256', 'T7KETzJA2yyfkgwONRd4C0sS').update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
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
    // Push to all connected customers instantly
    io.emit('settings_updated', settings);
    res.json({ success: true, settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── DELIVERY TIMES ────────────────────────────────────────────
app.get('/api/delivery-times', async (req, res) => {
  try {
    const doc = await DeliveryTimes.findOne().lean();
    if (!doc) return res.json({ success: true, times: ['20', '25', '30', '22', '28', '35'] });
    res.json({ success: true, times: doc.times });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/delivery-times', async (req, res) => {
  try {
    const { times } = req.body;
    let doc = await DeliveryTimes.findOne();
    if (!doc) {
      doc = new DeliveryTimes({ times });
    } else {
      doc.times = times;
      doc.updatedAt = new Date();
    }
    await doc.save();
    res.json({ success: true, times: doc.times });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PROMO CODES ───────────────────────────────────────────────
app.get('/api/promo-codes', async (req, res) => {
  try { const promos = await Promo.find({}).sort({ createdAt: -1 }).lean(); res.json({ success: true, promos }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/promo-codes', async (req, res) => {
  try { const promo = new Promo(req.body); await promo.save(); res.json({ success: true, promo }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/promo-codes/validate', async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const promo = await Promo.findOne({ code: code.toUpperCase(), active: true }).lean();
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
    const records = await Attendance.find(filter).sort({ createdAt: -1 }).lean();
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
    const section = await FeaturedSection.findOne({}).populate('products');
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
    const banners = await Banner.find({})
      .sort({ orderNum: 1, order: 1, createdAt: -1 })
      .populate('featuredProducts')
      .lean();
    res.json({ success: true, banners });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.post('/api/banners', async (req, res) => {
  try {
    const b = new Banner(req.body); await b.save();
    const all = await Banner.find({ active: true }).sort({ orderNum: 1, order: 1 }).lean();
    io.emit('banners_updated', all);
    res.json({ success: true, banner: b });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.put('/api/banners/:id', async (req, res) => {
  try {
    const { featuredProducts, showFeaturedProducts, ...rest } = req.body;
    const b = await Banner.findByIdAndUpdate(
      req.params.id,
      { ...rest, featuredProducts: featuredProducts || [], showFeaturedProducts: !!showFeaturedProducts },
      { new: true }
    );
    if (!b) return res.status(404).json({ success: false, message: 'Not found' });
    const all = await Banner.find({ active: true }).sort({ orderNum: 1, order: 1 }).lean();
    io.emit('banners_updated', all);
    res.json({ success: true, banner: b });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
app.delete('/api/banners/:id', async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    const all = await Banner.find({ active: true }).sort({ orderNum: 1, order: 1 }).lean();
    io.emit('banners_updated', all);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
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
    const cats = await PremiumCategory.find({}).sort({ createdAt: -1 }).lean();
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

// ── SPECIAL SECTION ───────────────────────────────────────────
const specialSectionDefaults = {
  titleLine1: 'Special',
  titleLine2: 'For You',
  subtitle:   'Fresh, Fixed — Delivered in 10 mins',
  smallText:  '✦ curated for you ✦',
  imageUrl:   '',
  showImage:  false,
  active:     true,
};

app.get('/api/special-section', async (req, res) => {
  try {
    const section = await SpecialSection.findOne({});
    res.json({ success: true, section: section || specialSectionDefaults });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/special-section', async (req, res) => {
  try {
    const { titleLine1, titleLine2, subtitle, smallText, imageUrl, showImage } = req.body;
    const update = {};
    if (titleLine1 !== undefined) update.titleLine1 = titleLine1;
    if (titleLine2 !== undefined) update.titleLine2 = titleLine2;
    if (subtitle   !== undefined) update.subtitle   = subtitle;
    if (smallText  !== undefined) update.smallText  = smallText;
    if (imageUrl   !== undefined) update.imageUrl   = imageUrl;
    if (showImage  !== undefined) update.showImage  = showImage;
    const section = await SpecialSection.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true }
    );
    res.json({ success: true, section });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
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
        .sort({ position: 1 })
        .lean(),
      Product.find({ $or: [{ motherCategoryId: id }, { motherCategoryId: catId }, { motherCategory: catId }], active: true })
        .select('_id name price mrp weight imageUrl stock active subCategoryId subCategoryName discount rating')
        .lean(),
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
    }).lean();
    res.json({ success: true, products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── DEBUG ─────────────────────────────────────────────────────
app.get('/api/debug/products-sample', async (req, res) => {
  try {
    const products   = await Product.find({}).limit(5).lean();
    const categories = await Category.find({}).lean();
    res.json({
      products:   products.map(p => ({ name: p.name, category: p.category, shopCategoryId: p.shopCategoryId })),
      categories: categories.map(c => ({ _id: c._id, name: c.name, categoryId: c.categoryId })),
    });
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
    await Product.collection.createIndex({ active: 1, category: 1 });
    await Product.collection.createIndex({ shopCategoryId: 1 });
    await Product.collection.createIndex({ sectionId: 1 });
    await Product.collection.createIndex({ subCategoryId: 1 });
    await Product.collection.createIndex({ motherCategoryId: 1 });
    await Category.collection.createIndex({ active: 1 });
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

app.get('/api/auth/create-test-user', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs')
    const existing = await User.findOne({
      email: process.env.TEST_USER_EMAIL
    })
    if (existing) {
      return res.json({
        success: true,
        message: 'Test user already exists'
      })
    }
    const hashed = await bcrypt.hash(process.env.TEST_USER_PASSWORD, 10)
    const user = new User({
      email: process.env.TEST_USER_EMAIL,
      password: hashed,
      name: 'Google Reviewer',
      phone: '9999999999',
      addresses: [{
        id: 'test-addr-1',
        type: 'HOME',
        name: 'Google Reviewer',
        mobile: '9999999999',
        houseNo: '123',
        building: 'Test Building',
        area: 'Balrampur',
        city: 'Balrampur',
        state: 'Uttar Pradesh',
        pincode: '271201',
        isDefault: true
      }]
    })
    await user.save()
    res.json({ success: true, message: 'Test user created!' })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
})

// ── Unicode bold converter (A-Z, a-z, 0-9 only; other chars unchanged) ──
const toBoldUnicode = (text) => text.replace(/[A-Za-z0-9]/g, (c) => {
  const code = c.charCodeAt(0);
  if (c >= 'A' && c <= 'Z') return String.fromCodePoint(0x1D5D4 + (code - 65));
  if (c >= 'a' && c <= 'z') return String.fromCodePoint(0x1D5EE + (code - 97));
  return String.fromCodePoint(0x1D7EC + (code - 48));
});

// ── Push notification helper ──────────────────────────────────
const sendPushNotification = async (tokens, title, body, data = {}, imageUrl = '') => {
  if (!tokens || tokens.length === 0) return;
  const messages = tokens.map(token => ({
    to:        token,
    sound:     'default',
    title:     title,
    body:      body,
    data:      data,
    priority:  'high',
    channelId: 'default',
    ...(imageUrl ? { image: imageUrl } : {}),
  }));
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'Accept':          'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });
    const result = await response.json();
    console.log('Push notification sent:', result);
  } catch (err) {
    console.log('Push notification error:', err.message);
  }
};

app.post('/api/users/push-token', async (req, res) => {
  try {
    const { email, pushToken } = req.body;
    await User.findOneAndUpdate(
      { $or: [{ email }, { phone: email }] },
      { pushToken },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/broadcasts', async (req, res) => {
  try {
    const messages = await Broadcast.find({})
      .sort({ createdAt: -1 }).lean()
    res.json({ success: true, messages, broadcasts: messages })
  } catch(err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.post('/api/broadcasts', async (req, res) => {
  try {
    const { message, imageUrl, linkType, linkValue, linkName } = req.body
    if (!message) return res.status(400).json({
      success: false, message: 'Message required'
    })
    const broadcast = new Broadcast({
      message: message,
      imageUrl: imageUrl || '',
      linkType: linkType || '',
      linkValue: linkValue || '',
      linkName: linkName || '',
    })
    await broadcast.save()

    // Emit socket event
    io.emit('new_broadcast', broadcast)

    // Send push notification to all users with a token
    const users  = await User.find({ pushToken: { $ne: '' } }).lean()
    const tokens = users.map(u => u.pushToken).filter(Boolean)
    await sendPushNotification(
      tokens,
      'Quick10',
      toBoldUnicode(message),
      { type: 'broadcast', broadcastId: String(broadcast._id) },
      imageUrl || ''
    )

    res.json({ success: true, broadcast })
  } catch(err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.put('/api/broadcasts/:id/read', async (req, res) => {
  try {
    const { userPhone } = req.body
    await Broadcast.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: userPhone } }
    )
    res.json({ success: true })
  } catch(err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.delete('/api/broadcasts/:id', async (req, res) => {
  try {
    await Broadcast.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch(err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── RATINGS ───────────────────────────────────────────────────
app.post('/api/ratings', async (req, res) => {
  try {
    const { productId, userEmail, rating, orderId } = req.body
    const existing = await Rating.findOne({ productId, userEmail })
    if (existing) {
      existing.rating = rating
      await existing.save()
    } else {
      await new Rating({ productId, userEmail, rating, orderId }).save()
    }
    const allRatings = await Rating.find({ productId })
    const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
    const avgRating = Math.round(avg * 10) / 10
    await Product.findByIdAndUpdate(productId, {
      rating:      avgRating,
      ratingCount: allRatings.length,
    })
    res.json({ success: true, avgRating, totalRatings: allRatings.length })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.get('/api/ratings/:productId/:userEmail', async (req, res) => {
  try {
    const found = await Rating.findOne({
      productId: req.params.productId,
      userEmail: req.params.userEmail,
    })
    res.json({ success: true, rating: found?.rating || 0 })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── LOCATION CAPTURE PAGE (opens on phone, captures real GPS) ──
app.get('/set-location', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Quick10 - Set Warehouse Location</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F4F6F8;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:24px 16px}
.logo{width:48px;height:48px;background:#00A550;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;margin-bottom:8px}
h1{font-size:22px;font-weight:900;color:#111827;margin-bottom:4px;text-align:center}
.sub{font-size:14px;color:#6B7280;text-align:center;margin-bottom:28px;line-height:1.5}
.card{background:#fff;border-radius:18px;border:1px solid #E5E7EB;padding:22px;width:100%;max-width:420px;box-shadow:0 4px 16px rgba(0,0,0,.06);margin-bottom:14px}
.card-title{font-size:11px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:.6px;margin-bottom:16px}
.coord-row{display:flex;gap:12px;margin-bottom:12px}
.coord-box{flex:1;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:12px;text-align:center}
.coord-lbl{font-size:9px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.coord-val{font-size:17px;font-weight:800;color:#111827;font-variant-numeric:tabular-nums}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:15px;border-radius:12px;border:none;font-size:16px;font-weight:800;cursor:pointer;transition:opacity .15s}
.btn-green{background:#00A550;color:#fff}
.btn-green:disabled{opacity:.5;cursor:not-allowed}
.btn-outline{background:#F0FDF4;color:#00A550;border:2px solid #A7F3D0;margin-top:10px}
.status{text-align:center;padding:12px 16px;border-radius:10px;font-size:14px;font-weight:700;margin-top:6px;display:none}
.status.success{background:#F0FDF4;color:#065F46;display:block}
.status.error{background:#FEF2F2;color:#991B1B;display:block}
.status.info{background:#EFF6FF;color:#1E40AF;display:block}
.step{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px}
.step-num{width:28px;height:28px;background:#00A550;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#fff;flex-shrink:0}
.step-txt{font-size:13px;color:#374151;line-height:1.5;padding-top:4px}
.hidden{display:none}
input[type=text]{width:100%;padding:12px 14px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:14px;color:#111827;background:#F9FAFB;margin-bottom:12px;outline:none}
input[type=text]:focus{border-color:#00A550}
</style>
</head>
<body>
<div class="logo">Q</div>
<h1>Set Warehouse Location</h1>
<p class="sub">Warehouse par pahunchne ke baad<br/>apni real GPS location capture karo</p>

<div class="card">
  <div class="card-title">Steps</div>
  <div class="step"><div class="step-num">1</div><div class="step-txt">Warehouse location par physically pahuncho</div></div>
  <div class="step"><div class="step-num">2</div><div class="step-txt">Niche "Capture My Location" button dabaao</div></div>
  <div class="step"><div class="step-num">3</div><div class="step-txt">Location allow karo (browser permission)</div></div>
  <div class="step"><div class="step-num">4</div><div class="step-txt">"Save" button dabaao — location save ho jaayegi</div></div>
</div>

<div class="card">
  <div class="card-title">Warehouse Name (optional)</div>
  <input type="text" id="whName" placeholder="e.g. Balrampur Main Warehouse"/>

  <button class="btn btn-green" id="captureBtn" onclick="captureLocation()">
    Capture My Location
  </button>
  <div class="status info" id="gpsStatus">GPS locate kar raha hai...</div>

  <div id="coordDisplay" class="hidden" style="margin-top:16px">
    <div class="card-title" style="margin-bottom:10px">Captured Location</div>
    <div class="coord-row">
      <div class="coord-box"><div class="coord-lbl">Latitude</div><div class="coord-val" id="latVal">—</div></div>
      <div class="coord-box"><div class="coord-lbl">Longitude</div><div class="coord-val" id="lngVal">—</div></div>
    </div>
    <button class="btn btn-green" id="saveBtn" onclick="saveLocation()">Save as Warehouse Location</button>
    <button class="btn btn-outline" onclick="captureLocation()">Re-capture Location</button>
  </div>

  <div class="status" id="saveStatus"></div>
</div>

<script>
var capturedLat = null, capturedLng = null;

function captureLocation() {
  if (!navigator.geolocation) {
    showStatus('gpsStatus','error','GPS is browser mein support nahi karta. Please Chrome/Safari use karo.');
    return;
  }
  document.getElementById('captureBtn').disabled = true;
  document.getElementById('gpsStatus').className = 'status info';
  document.getElementById('gpsStatus').style.display = 'block';
  document.getElementById('gpsStatus').textContent = 'GPS locate kar raha hai... thoda wait karo';
  navigator.geolocation.getCurrentPosition(
    function(pos) {
      capturedLat = pos.coords.latitude;
      capturedLng = pos.coords.longitude;
      document.getElementById('latVal').textContent = capturedLat.toFixed(6);
      document.getElementById('lngVal').textContent = capturedLng.toFixed(6);
      document.getElementById('coordDisplay').classList.remove('hidden');
      document.getElementById('gpsStatus').style.display = 'none';
      document.getElementById('captureBtn').disabled = false;
    },
    function(err) {
      var msg = err.code === 1 ? 'Location access allow nahi kiya. Browser settings mein permission do.'
              : err.code === 2 ? 'GPS signal nahi mila. Bahar jaake try karo ya WiFi on karo.'
              : 'Location timeout. Dobara try karo.';
      document.getElementById('gpsStatus').className = 'status error';
      document.getElementById('gpsStatus').textContent = msg;
      document.getElementById('captureBtn').disabled = false;
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

function saveLocation() {
  if (capturedLat === null) { alert('Pehle location capture karo.'); return; }
  var saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  var name = document.getElementById('whName').value.trim() || 'Main Warehouse';
  fetch('/api/app-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ warehouseLat: capturedLat, warehouseLng: capturedLng, warehouseName: name })
  })
  .then(function(r){ return r.json(); })
  .then(function(d){
    if (d.success || d.settings) {
      var st = document.getElementById('saveStatus');
      st.className = 'status success';
      st.textContent = 'Location save ho gayi! Admin dashboard par update ho gayi.';
      saveBtn.textContent = 'Saved!';
    } else {
      throw new Error(d.message || 'Save failed');
    }
  })
  .catch(function(e){
    var st = document.getElementById('saveStatus');
    st.className = 'status error';
    st.textContent = 'Error: ' + e.message;
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save as Warehouse Location';
  });
}
</script>
</body>
</html>`);
});

// ── DAMAGE REPORT SCHEMA ──────────────────────────────────────
const DamageReportSchema = new mongoose.Schema({
  productId:    String,
  productName:  { type: String, required: true },
  productImage: String,
  skuId:        String,
  quantity:     { type: Number, default: 0 },
  pricePerUnit: { type: Number, default: 0 },
  reason:       { type: String, enum: ['Expired', 'Broken Packaging', 'Spilled', 'Damaged', 'Theft', 'Other'], default: 'Other' },
  reporter:     String,
  notes:        String,
  status:       { type: String, enum: ['pending', 'resolved'], default: 'pending' },
}, { timestamps: true, strict: false });

const DamageReport = mongoose.model('DamageReport', DamageReportSchema);

// GET all damage reports (most recent first)
app.get('/api/damage-reports', async (req, res) => {
  try {
    const limit   = parseInt(req.query.limit)  || 100;
    const reports = await DamageReport.find({}).sort({ createdAt: -1 }).limit(limit);
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST new damage report
app.post('/api/damage-reports', async (req, res) => {
  try {
    const report = new DamageReport(req.body);
    await report.save();
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH resolve a damage report
app.patch('/api/damage-reports/:id/resolve', async (req, res) => {
  try {
    const report = await DamageReport.findByIdAndUpdate(req.params.id, { status: 'resolved' }, { new: true });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE a damage report
app.delete('/api/damage-reports/:id', async (req, res) => {
  try {
    await DamageReport.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── SERVER START ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Quick10 running on ${PORT}`);
  console.log(`Socket.io ready`);
});
