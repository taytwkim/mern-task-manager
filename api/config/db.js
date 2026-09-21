const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    throw new Error('Set MONGODB_URI in api/.env before starting the server.');
  }

  try {
    // await pauses this function until the connection succeeds or fails.
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB');
  } catch (error) {
    // Avoid printing the connection string or potentially credential-bearing errors.
    throw new Error(
      'Could not connect to MongoDB. Check MONGODB_URI, database credentials, and Atlas IP access.'
    );
  }
}

module.exports = connectDB;
