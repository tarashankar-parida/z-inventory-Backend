import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:0.0.0.0/z-inventory';

console.log('🔍 Checking MongoDB connection...');
console.log('📍 Connection string:', MONGODB_URI.replace(/\/\/.*@/, '//***@')); // Hide credentials

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    console.log('📊 Database:', MONGODB_URI.split('/').pop() || 'z-inventory');
    console.log('🔗 Ready state:', mongoose.connection.readyState);
    mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed!');
    console.error('Error:', err.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure MongoDB is installed and running');
    console.log('2. Start MongoDB with: mongod');
    console.log('3. Or check your MONGODB_URI in .env file');
    console.log('4. For MongoDB Atlas, ensure your IP is whitelisted');
    process.exit(1);
  });


