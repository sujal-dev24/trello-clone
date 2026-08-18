const Board = require('../models/Board');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Create a new board
// @route   POST /api/boards
// @access  Private
const createBoard = async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!title) {
      res.status(400);
      return next(new Error('Please add a board title'));
    }

    const board = await Board.create({
      title,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    // Populate createdBy and members before returning
    const populatedBoard = await Board.findById(board._id)
      .populate('createdBy', 'username email')
      .populate('members', 'username email');

    res.status(201).json(populatedBoard);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's boards (where they are creator or member)
// @route   GET /api/boards
// @access  Private
const getBoards = async (req, res, next) => {
  try {
    const boards = await Board.find({
      members: req.user._id,
    })
      .populate('createdBy', 'username email')
      .populate('members', 'username email')
      .sort({ createdAt: -1 });

    res.json(boards);
  } catch (error) {
    next(error);
  }
};

// @desc    Get full board data (board info + populated tasks)
// @route   GET /api/boards/:id
// @access  Private
const getBoardData = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('members', 'username email');

    if (!board) {
      res.status(404);
      return next(new Error('Board not found'));
    }

    // Verify requesting user is a member of this board
    const isMember = board.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      res.status(403);
      return next(new Error('Access denied: You are not a member of this board'));
    }

    // Get all tasks for this board
    const tasks = await Task.find({ boardId: board._id })
      .populate('assignedTo', 'username email')
      .sort({ position: 1 });

    res.json({
      board,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Invite a member to a board
// @route   POST /api/boards/:id/invite
// @access  Private
const inviteMember = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      return next(new Error('Please provide an email to invite'));
    }

    const board = await Board.findById(req.params.id);

    if (!board) {
      res.status(404);
      return next(new Error('Board not found'));
    }

    // Verify requester is a member of this board
    const isMember = board.members.some(
      (mId) => mId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      res.status(403);
      return next(new Error('Access denied: Only members can invite others'));
    }

    // Find the user to invite by email
    const userToInvite = await User.findOne({ email });

    if (!userToInvite) {
      res.status(404);
      return next(new Error('User not found with this email'));
    }

    // Check if user is already a member
    const alreadyMember = board.members.some(
      (mId) => mId.toString() === userToInvite._id.toString()
    );

    if (alreadyMember) {
      res.status(400);
      return next(new Error('User is already a member of this board'));
    }

    // Add to members
    board.members.push(userToInvite._id);
    await board.save();

    // Fetch updated board
    const updatedBoard = await Board.findById(board._id)
      .populate('createdBy', 'username email')
      .populate('members', 'username email');

    res.json(updatedBoard);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBoard,
  getBoards,
  getBoardData,
  inviteMember,
};
