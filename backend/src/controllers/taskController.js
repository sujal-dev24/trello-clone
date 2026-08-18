const Task = require('../models/Task');
const Board = require('../models/Board');

// Helper to check if user has access to the board
const checkBoardAccess = async (boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board) return false;
  return board.members.some((memberId) => memberId.toString() === userId.toString());
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, assignedTo, status, boardId } = req.body;

    if (!title || !boardId) {
      res.status(400);
      return next(new Error('Title and Board ID are required'));
    }

    // Verify user has access to this board
    const hasAccess = await checkBoardAccess(boardId, req.user._id);
    if (!hasAccess) {
      res.status(403);
      return next(new Error('Access denied: You are not a member of this board'));
    }

    // Check if task with same title exists on this board (case-insensitive)
    const existingTask = await Task.findOne({
      boardId,
      title: { $regex: new RegExp(`^${title.trim()}$`, 'i') },
    });
    if (existingTask) {
      res.status(400);
      return next(new Error('A task with this title already exists on this board'));
    }

    // Determine the next position index (highest position + 1000) for the column
    const targetStatus = status || 'Todo';
    const lastTask = await Task.findOne({ boardId, status: targetStatus })
      .sort({ position: -1 })
      .select('position');
    
    const nextPosition = lastTask ? lastTask.position + 1000 : 1000;

    const task = await Task.create({
      title,
      description: description || '',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      status: targetStatus,
      position: nextPosition,
      boardId,
    });

    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'username email');

    res.status(201).json(populatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Move / Reorder a task
// @route   PUT /api/tasks/:id/move
// @access  Private
const moveTask = async (req, res, next) => {
  try {
    const { status, position } = req.body;

    if (!status || position === undefined) {
      res.status(400);
      return next(new Error('Status and Position are required to move a task'));
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    // Verify user has access to the board
    const hasAccess = await checkBoardAccess(task.boardId, req.user._id);
    if (!hasAccess) {
      res.status(403);
      return next(new Error('Access denied: You are not a member of this board'));
    }

    task.status = status;
    task.position = position;
    await task.save();

    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'username email');

    res.json(populatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, assignedTo, status } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    // Verify user has access to the board
    const hasAccess = await checkBoardAccess(task.boardId, req.user._id);
    if (!hasAccess) {
      res.status(403);
      return next(new Error('Access denied: You are not a member of this board'));
    }

    // Check if another task with the same title already exists on this board (case-insensitive)
    if (title !== undefined && title.trim().toLowerCase() !== task.title.toLowerCase()) {
      const existingTask = await Task.findOne({
        boardId: task.boardId,
        _id: { $ne: task._id },
        title: { $regex: new RegExp(`^${title.trim()}$`, 'i') },
      });
      if (existingTask) {
        res.status(400);
        return next(new Error('A task with this title already exists on this board'));
      }
    }

    // Update fields if provided
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (status !== undefined) task.status = status;

    await task.save();

    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'username email');

    res.json(populatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    // Verify user has access to the board
    const hasAccess = await checkBoardAccess(task.boardId, req.user._id);
    if (!hasAccess) {
      res.status(403);
      return next(new Error('Access denied: You are not a member of this board'));
    }

    await Task.deleteOne({ _id: task._id });

    res.json({ message: 'Task deleted successfully', taskId: task._id, boardId: task.boardId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  moveTask,
  updateTask,
  deleteTask,
};
