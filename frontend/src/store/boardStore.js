import { create } from 'zustand';
import API from '../services/api';
import { socket, connectSocket, disconnectSocket } from '../services/socket';

export const useBoardStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  boards: [],
  activeBoard: null,
  tasks: [],
  onlineUsers: [],
  typingUsers: {}, // key: taskId (or 'board' for general), value: array of usernames
  loading: false,
  error: null,
  filters: { priority: 'all', assignee: 'all', date: 'all' },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
  },

  clearFilters: () => {
    set({ filters: { priority: 'all', assignee: 'all', date: 'all' } });
  },

  // Auth actions
  setUser: (user, token) => {
    if (user && token) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      set({ user, error: null });
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      set({ user: null });
    }
  },

  logout: () => {
    const { activeBoard } = get();
    if (activeBoard) {
      disconnectSocket(activeBoard._id);
    }
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, boards: [], activeBoard: null, tasks: [], onlineUsers: [], typingUsers: {} });
  },

  // Board actions
  fetchBoards: async () => {
    set({ loading: true, error: null });
    try {
      const res = await API.get('/boards');
      set({ boards: res.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch boards', loading: false });
    }
  },

  createBoard: async (title) => {
    set({ loading: true, error: null });
    try {
      const res = await API.post('/boards', { title });
      set((state) => ({
        boards: [res.data, ...state.boards],
        loading: false,
      }));
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to create board', loading: false });
      throw err;
    }
  },

  inviteMember: async (boardId, email) => {
    try {
      const res = await API.post(`/boards/${boardId}/invite`, { email });
      set({ activeBoard: res.data });
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to invite member';
      set({ error: errMsg });
      throw new Error(errMsg);
    }
  },

  fetchBoardData: async (boardId) => {
    set({ loading: true, error: null });
    try {
      const res = await API.get(`/boards/${boardId}`);
      const { board, tasks } = res.data;
      
      set({ activeBoard: board, tasks, loading: false });

      // Connect and join socket room
      // Connect and join socket room
      const { user } = get();
      if (user) {
        // Clean up socket listeners first to prevent duplicates
        socket.off('online-users');
        socket.off('typing-start');
        socket.off('typing-stop');
        socket.off('task-created');
        socket.off('task-moved');
        socket.off('task-updated');
        socket.off('task-deleted');

        // Listen for online users updates
        socket.on('online-users', (users) => {
          set({ onlineUsers: users });
        });

        // Listen for typing indicators
        socket.on('typing-start', ({ taskId, username }) => {
          set((state) => {
            const key = taskId || 'board';
            const typing = state.typingUsers[key] || [];
            if (!typing.includes(username)) {
              return {
                typingUsers: {
                  ...state.typingUsers,
                  [key]: [...typing, username],
                },
              };
            }
            return state;
          });
        });

        socket.on('typing-stop', ({ taskId, username }) => {
          set((state) => {
            const key = taskId || 'board';
            const typing = state.typingUsers[key] || [];
            return {
              typingUsers: {
                ...state.typingUsers,
                [key]: typing.filter((name) => name !== username),
              },
            };
          });
        });

        // Listen for task updates from other users
        socket.on('task-created', (task) => {
          set((state) => ({
            tasks: [...state.tasks, task].sort((a, b) => a.position - b.position),
          }));
        });

        socket.on('task-moved', (movedTask) => {
          set((state) => ({
            tasks: state.tasks
              .map((t) => (t._id === movedTask._id ? movedTask : t))
              .sort((a, b) => a.position - b.position),
          }));
        });

        socket.on('task-updated', (updatedTask) => {
          set((state) => ({
            tasks: state.tasks
              .map((t) => (t._id === updatedTask._id ? updatedTask : t))
              .sort((a, b) => a.position - b.position),
          }));
        });

        socket.on('task-deleted', ({ taskId }) => {
          set((state) => ({
            tasks: state.tasks.filter((t) => t._id !== taskId),
          }));
        });

        // Finally, connect socket and join the board room (after listeners are registered)
        connectSocket(user, boardId);
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load board details', loading: false });
    }
  },

  leaveBoard: () => {
    const { activeBoard } = get();
    if (activeBoard) {
      disconnectSocket(activeBoard._id);
    }
    set({ activeBoard: null, tasks: [], onlineUsers: [], typingUsers: {} });
  },

  // Task actions
  createTask: async (taskData) => {
    const { activeBoard } = get();
    if (!activeBoard) return;

    try {
      const res = await API.post('/tasks', { ...taskData, boardId: activeBoard._id });
      const newTask = res.data;

      set((state) => ({
        tasks: [...state.tasks, newTask].sort((a, b) => a.position - b.position),
      }));

      // Broadcast creation via socket
      socket.emit('task-created', { boardId: activeBoard._id, task: newTask });
      return newTask;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to create task' });
      throw err;
    }
  },

  updateTask: async (taskId, updateData) => {
    const { activeBoard, tasks } = get();
    if (!activeBoard) return;

    // Capture original task state for revert on error
    const originalTasks = [...tasks];

    try {
      // Optimistic update
      set((state) => ({
        tasks: state.tasks
          .map((t) => (t._id === taskId ? { ...t, ...updateData } : t))
          .sort((a, b) => a.position - b.position),
      }));

      const res = await API.put(`/tasks/${taskId}`, updateData);
      const updatedTask = res.data;

      // Sync state with actual DB response (fully populated assignedTo user, etc.)
      set((state) => ({
        tasks: state.tasks
          .map((t) => (t._id === taskId ? updatedTask : t))
          .sort((a, b) => a.position - b.position),
      }));

      // Broadcast update via socket
      socket.emit('task-updated', { boardId: activeBoard._id, task: updatedTask });
      return updatedTask;
    } catch (err) {
      // Revert on error
      set({ tasks: originalTasks, error: err.response?.data?.message || 'Failed to update task' });
      throw err;
    }
  },

  deleteTask: async (taskId) => {
    const { activeBoard, tasks } = get();
    if (!activeBoard) return;

    const originalTasks = [...tasks];

    try {
      // Optimistic delete
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== taskId),
      }));

      await API.delete(`/tasks/${taskId}`);

      // Broadcast delete via socket
      socket.emit('task-deleted', { boardId: activeBoard._id, taskId });
    } catch (err) {
      set({ tasks: originalTasks, error: err.response?.data?.message || 'Failed to delete task' });
      throw err;
    }
  },

  moveTask: async (taskId, targetStatus, targetPosition) => {
    const { activeBoard, tasks } = get();
    if (!activeBoard) return;

    const originalTasks = [...tasks];

    // Optimistic sorting and relocation
    set((state) => ({
      tasks: state.tasks
        .map((t) => (t._id === taskId ? { ...t, status: targetStatus, position: targetPosition } : t))
        .sort((a, b) => a.position - b.position),
    }));

    try {
      const res = await API.put(`/tasks/${taskId}/move`, {
        status: targetStatus,
        position: targetPosition,
      });
      const movedTask = res.data;

      // Update state with server data (guarantees DB values are synced)
      set((state) => ({
        tasks: state.tasks
          .map((t) => (t._id === taskId ? movedTask : t))
          .sort((a, b) => a.position - b.position),
      }));

      // Broadcast move via socket
      socket.emit('task-moved', { boardId: activeBoard._id, task: movedTask });
    } catch (err) {
      // Revert if API fails
      set({ tasks: originalTasks, error: err.response?.data?.message || 'Failed to sync task move' });
    }
  },

  // Typing indicators trigger
  sendTypingStart: (taskId) => {
    const { activeBoard, user } = get();
    if (activeBoard && user) {
      socket.emit('typing-start', {
        boardId: activeBoard._id,
        taskId,
        username: user.username,
      });
    }
  },

  sendTypingStop: (taskId) => {
    const { activeBoard, user } = get();
    if (activeBoard && user) {
      socket.emit('typing-stop', {
        boardId: activeBoard._id,
        taskId,
        username: user.username,
      });
    }
  },
}));
