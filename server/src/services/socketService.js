import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';

let io;

// Allowed origins for Socket.IO CORS
const allowedOrigins = [
  'http://localhost:5173',       // Dev frontend
  'http://51.20.131.117',        // Production
  'https://51.20.131.117',
];

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authenticate socket connections via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      });

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return next(new Error('Invalid or expired token'));
      }

      // Attach user to socket for downstream use
      socket.userId = user.id;
      socket.userEmail = user.email;
      next();
    } catch (err) {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected to socket: ${socket.id}`);

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected from socket: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
