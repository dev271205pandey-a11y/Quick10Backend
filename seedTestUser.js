const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const MONGODB_URI = 'mongodb+srv://quickadmin:dev271201deva@cluster0.o9mlhyd.mongodb.net/quick10?retryWrites=true&w=majority'

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB')

  const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    name: String,
    phone: String,
    addresses: Array,
    isTestAccount: Boolean
  })

  const User = mongoose.models.User ||
    mongoose.model('User', UserSchema)

  const existing = await User.findOne({
    email: 'google-reviewer@quick10.com'
  })

  if (existing) {
    console.log('Test user already exists!')
    mongoose.disconnect()
    return
  }

  const hashed = await bcrypt.hash('Reviewer@Secure2026', 10)

  await User.create({
    email: 'google-reviewer@quick10.com',
    password: hashed,
    name: 'Google Reviewer',
    phone: '9999999999',
    isTestAccount: true,
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

  console.log('Test user created successfully!')
  console.log('Email: google-reviewer@quick10.com')
  console.log('Password: Reviewer@Secure2026')
  mongoose.disconnect()

}).catch(err => {
  console.log('Error:', err)
  mongoose.disconnect()
})
