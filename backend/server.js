require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Keep track of connected users { userId: socketId }
const connectedUsers = new Map();

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('user-connected', (userId) => {
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);
    io.emit('online-users', Array.from(connectedUsers.keys()));
  });

  socket.on('send-message', (data) => {
    const receiverSocketIds = connectedUsers.get(data.receiverId);
    if (receiverSocketIds) {
      receiverSocketIds.forEach(id => {
        io.to(id).emit('receive-message', data);
      });
    }
  });

  socket.on('typing', ({ senderId, receiverId }) => {
    const receiverSocketIds = connectedUsers.get(receiverId);
    if (receiverSocketIds) {
      receiverSocketIds.forEach(id => {
        io.to(id).emit('typing', senderId);
      });
    }
  });

  // WebRTC Signaling
  socket.on('video-call-offer', (data) => {
    const receiverSocketIds = connectedUsers.get(data.receiverId);
    if (receiverSocketIds) {
      receiverSocketIds.forEach(id => {
        io.to(id).emit('video-call-offer', {
          offer: data.offer,
          callerId: data.callerId
        });
      });
    }
  });

  socket.on('video-call-answer', (data) => {
    const callerSocketIds = connectedUsers.get(data.callerId);
    if (callerSocketIds) {
      callerSocketIds.forEach(id => {
        io.to(id).emit('video-call-answer', {
          answer: data.answer
        });
      });
    }
  });

  socket.on('ice-candidate', (data) => {
    const targetSocketIds = connectedUsers.get(data.targetId);
    if (targetSocketIds) {
      targetSocketIds.forEach(id => {
        io.to(id).emit('ice-candidate', {
          candidate: data.candidate
        });
      });
    }
  });

  socket.on('call-ended', (data) => {
    const targetSocketIds = connectedUsers.get(data.targetId);
    if (targetSocketIds) {
      targetSocketIds.forEach(id => {
        io.to(id).emit('call-ended');
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    for (const [userId, socketIds] of connectedUsers.entries()) {
      if (socketIds.has(socket.id)) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          connectedUsers.delete(userId);
          io.emit('online-users', Array.from(connectedUsers.keys()));
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/connectnow';

console.log('Starting backend server...');
console.log('MONGO_URI is', process.env.MONGO_URI ? 'provided via env' : 'MISSING (falling back to localhost)');

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('FATAL MongoDB connection error:', err);
    process.exit(1);
  });
