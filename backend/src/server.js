const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const followRoutes = require('./routes/follow');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket connection authentication
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId =
      decoded.id ||
      decoded._id ||
      decoded.userId ||
      decoded.sub ||
      decoded.user?.id ||
      decoded.user?._id;

    if (!userId) {
      return next(new Error('User ID missing in token'));
    }

    socket.userId = String(userId);
    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
});

// Har user apne ID wale room mein join karega
io.on('connection', (socket) => {
  socket.join(socket.userId);

  console.log('User connected:', socket.userId);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
  });
});

// Routes ke andar io access karne ke liye
app.set('io', io);

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/auth', authRoutes);

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Instagram Clone Backend is running!');
});

const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing in backend/.env');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing in backend/.env');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connected successfully!');

    const PORT = Number.parseInt(process.env.PORT, 10) || 5000;

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Server startup error:', error.message);
    process.exit(1);
  }
};

startServer();