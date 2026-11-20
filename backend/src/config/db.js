
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing in .env file');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      
    });

    console.log('MongoDB connected successfully!');
    console.log('Database:', mongoose.connection.name);

  } catch (error) {
    console.error('MongoDB connection failed!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    process.exit(1);
  }
};

module.exports = connectDB;
