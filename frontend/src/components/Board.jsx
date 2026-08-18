import React, { useState } from 'react';
import { useBoardStore } from '../store/boardStore';
import Column from './Column';
import TaskModal from './TaskModal';

const Board = () => {
  const { tasks, filters } = useBoardStore();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [createInStatus, setCreateInStatus] = useState(null);

  const columns = ['Todo', 'In Progress', 'Review', 'Done'];

  // Apply filters to tasks list
  const filteredTasks = tasks.filter((task) => {
    // 1. Priority Filter
    if (filters.priority !== 'all' && task.priority.toLowerCase() !== filters.priority) {
      return false;
    }

    // 2. Assignee Filter
    if (filters.assignee !== 'all') {
      if (filters.assignee === 'unassigned') {
        if (task.assignedTo) return false;
      } else {
        const assignedId = task.assignedTo?._id || task.assignedTo;
        if (assignedId !== filters.assignee) return false;
      }
    }

    // 3. Date Filter
    if (filters.date !== 'all') {
      if (!task.dueDate && filters.date !== 'none') return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      if (dueDate) dueDate.setHours(0, 0, 0, 0);

      if (filters.date === 'none') {
        if (task.dueDate) return false;
      } else if (filters.date === 'overdue') {
        if (!dueDate || dueDate >= today || task.status === 'Done') return false;
      } else if (filters.date === 'today') {
        if (!dueDate || dueDate.getTime() !== today.getTime()) return false;
      } else if (filters.date === 'week') {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        if (!dueDate || dueDate < today || dueDate > nextWeek) return false;
      }
    }

    return true;
  });

  const handleAddTaskClick = (status) => {
    setSelectedTask(null);
    setCreateInStatus(status);
    setShowModal(true);
  };

  const handleTaskClick = (task) => {
    setCreateInStatus(null);
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTask(null);
    setCreateInStatus(null);
  };

  return (
    <div className="board-canvas">
      {columns.map((status) => {
        // Get tasks for this specific column
        const columnTasks = filteredTasks.filter((t) => t.status === status);
        return (
          <Column
            key={status}
            status={status}
            tasks={columnTasks}
            onAddTask={handleAddTaskClick}
            onTaskClick={handleTaskClick}
          />
        );
      })}

      {showModal && (
        <TaskModal
          task={selectedTask}
          initialStatus={createInStatus}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Board;
