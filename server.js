const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// ===== MOCK DATABASE =====
const users = [];
const otpStore = {}; // { phone: { otp, expiry } }

// ===== PRODUCTS =====
const products = [
  { id: '1', name: 'Amul Milk', price: 65, stock: 100, category: 'Dairy' },
  { id: '2', name: 'Bread', price: 50, stock: 50, category: 'Bakery' },
  { id: '3', name: 'Eggs (12pcs)', price: 89, stock: 80, category: 'Dairy' },
  { id: '4', name: 'Butter', price: 55, stock: 60, category: 'Dairy' },
  { id: '5', name: 'Rice 1kg', price: 75, stock: 100, category: 'Grains' },
];

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

// ===== SEND OTP =====
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;

  if (!phone || phone.length !== 10) {
    return res.status(400).json({ success: false, message: 'Invalid phone number' });
  }

  // Mock OTP - हमेशा 123456
  const otp = '123456';
  const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore[phone] = { otp, expiry };

  console.log(`OTP for ${phone}: ${otp}`);

  res.json({
    success: true,
    message: `OTP sent to ${phone}`,
    // Testing के लिए OTP response में भेज रहे हैं
    // Production में यह हटाना होगा
    otp: otp,
  });
});

// ===== VERIFY OTP =====
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone and OTP required' });
  }

  const stored = otpStore[phone];

  if (!stored) {
    return res.status(400).json({ success: false, message: 'OTP not found. Please request again.' });
  }

  if (Date.now() > stored.expiry) {
    delete otpStore[phone];
    return res.status(400).json({ success: false, message: 'OTP expired. Please request again.' });
  }

  if (stored.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  // OTP correct — user save करो
  delete otpStore[phone];

  let user = users.find(u => u.phone === phone);
  if (!user) {
    user = { id: Date.now().toString(), phone, createdAt: new Date() };
    users.push(user);
  }

  res.json({
    success: true,
    message: 'OTP verified successfully',
    user: { id: user.id, phone: user.phone },
  });
});

// ===== PRODUCTS =====
app.get('/api/products', (req, res) => {
  res.json({ success: true, products });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));