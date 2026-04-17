import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // show which URI is being used (partially redacted)
    const rawUri = process.env.MONGODB_URI || '';
    const safeUri = rawUri.replace(/:\/\/(.*?):(.*?)@/, '://$1:<password>@');
    console.log('Attempting MongoDB connection using URI:', safeUri);
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;
