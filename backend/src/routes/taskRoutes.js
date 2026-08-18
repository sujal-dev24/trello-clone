const express = require('express');
const router = express.Router();
const {
  createTask,
  moveTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All task routes require JWT authorization

router.route('/')
  .post(createTask);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

router.route('/:id/move')
  .put(moveTask);

module.exports = router;
