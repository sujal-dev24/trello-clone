const socketIO = require('socket.io');

// Key: boardId, Value: Map of socketId -> User profile
const activeBoardUsers = new Map();

const initSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: '*', // Allow all origins for simplicity (customize for production)
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins a specific board room
    socket.on('join-board', ({ boardId, user }) => {
      if (!boardId || !user) return;

      const roomName = `board_${boardId}`;
      socket.join(roomName);
      socket.boardId = boardId;
      socket.user = user;

      console.log(`User ${user.username} (${socket.id}) joined room: ${roomName}`);

      // Initialize room active users map if it doesn't exist
      if (!activeBoardUsers.has(boardId)) {
        activeBoardUsers.set(boardId, new Map());
      }
      activeBoardUsers.get(boardId).set(socket.id, user);

      // Send the list of current online users to everyone in the room
      sendOnlineUsersList(io, boardId);
    });

    // User leaves board room explicitly (or navigates away)
    socket.on('leave-board', ({ boardId }) => {
      const targetBoardId = boardId || socket.boardId;
      if (!targetBoardId) return;

      const roomName = `board_${targetBoardId}`;
      socket.leave(roomName);
      console.log(`Socket ${socket.id} left room: ${roomName}`);

      removeUserFromBoard(socket.id, targetBoardId);
      sendOnlineUsersList(io, targetBoardId);
    });

    // Realtime typing indicators
    socket.on('typing-start', ({ boardId, taskId, username }) => {
      const roomName = `board_${boardId}`;
      socket.to(roomName).emit('typing-start', { taskId, username });
    });

    socket.on('typing-stop', ({ boardId, taskId, username }) => {
      const roomName = `board_${boardId}`;
      socket.to(roomName).emit('typing-stop', { taskId, username });
    });

    // Broadcast board updates
    socket.on('task-created', ({ boardId, task }) => {
      console.log(`Task created broadcast: ${task._id} on board ${boardId}`);
      socket.to(`board_${boardId}`).emit('task-created', task);
    });

    socket.on('task-moved', ({ boardId, task }) => {
      console.log(`Task moved broadcast: ${task._id} on board ${boardId}`);
      socket.to(`board_${boardId}`).emit('task-moved', task);
    });

    socket.on('task-updated', ({ boardId, task }) => {
      console.log(`Task updated broadcast: ${task._id} on board ${boardId}`);
      socket.to(`board_${boardId}`).emit('task-updated', task);
    });

    socket.on('task-deleted', ({ boardId, taskId, status }) => {
      console.log(`Task deleted broadcast: ${taskId} on board ${boardId}`);
      socket.to(`board_${boardId}`).emit('task-deleted', { taskId, status });
    });

    // Clean disconnect handling
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Look up where this socket was registered and clean up
      for (const [boardId, usersMap] of activeBoardUsers.entries()) {
        if (usersMap.has(socket.id)) {
          const user = usersMap.get(socket.id);
          console.log(`Removing user ${user.username} from board ${boardId} due to disconnect`);
          usersMap.delete(socket.id);
          
          if (usersMap.size === 0) {
            activeBoardUsers.delete(boardId);
          } else {
            sendOnlineUsersList(io, boardId);
          }
        }
      }
    });
  });

  return io;
};

// Helper: Remove user from board users map
const removeUserFromBoard = (socketId, boardId) => {
  if (activeBoardUsers.has(boardId)) {
    const usersMap = activeBoardUsers.get(boardId);
    usersMap.delete(socketId);
    if (usersMap.size === 0) {
      activeBoardUsers.delete(boardId);
    }
  }
};

// Helper: Broadcast unique online users for a board
const sendOnlineUsersList = (io, boardId) => {
  if (!boardId) return;

  const usersMap = activeBoardUsers.get(boardId);
  const onlineUsersList = [];
  
  if (usersMap) {
    // Collect unique users based on userId
    const seenUserIds = new Set();
    for (const user of usersMap.values()) {
      if (!seenUserIds.has(user._id)) {
        seenUserIds.add(user._id);
        onlineUsersList.push(user);
      }
    }
  }

  console.log(`Broadcasting online users count: ${onlineUsersList.length} for board: ${boardId}`);
  io.to(`board_${boardId}`).emit('online-users', onlineUsersList);
};

module.exports = { initSocket };
