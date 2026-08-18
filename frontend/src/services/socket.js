import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const connectSocket = (user, boardId) => {
  if (!socket.connected) {
    socket.connect();
  }
  socket.emit('join-board', { boardId, user });
  console.log(`Socket connecting and joining board ${boardId} for user ${user.username}`);
};

export const disconnectSocket = (boardId) => {
  if (socket.connected) {
    socket.emit('leave-board', { boardId });
    socket.disconnect();
    console.log(`Socket disconnected and left board ${boardId}`);
  }
};
