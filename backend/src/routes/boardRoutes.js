const express = require('express');
const router = express.Router();
const {
  createBoard,
  getBoards,
  getBoardData,
  inviteMember,
} = require('../controllers/boardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All board routes are protected

router.route('/')
  .post(createBoard)
  .get(getBoards);

router.route('/:id')
  .get(getBoardData);

router.route('/:id/invite')
  .post(inviteMember);

module.exports = router;
