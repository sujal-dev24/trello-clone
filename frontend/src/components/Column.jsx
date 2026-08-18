import React, { useState } from 'react';
import { useBoardStore } from '../store/boardStore';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';

const Column = ({ status, tasks, onAddTask, onTaskClick }) => {
  const moveTask = useBoardStore((state) => state.moveTask);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const taskId = e.dataTransfer.getData('text/plain');
    const sourceStatus = e.dataTransfer.getData('sourceStatus');

    if (!taskId) return;

    // Calculate dropping position index
    // Get all card DOM nodes inside the task list of this column
    const listElement = e.currentTarget.querySelector('.task-list');
    if (!listElement) return;

    const cardElements = Array.from(listElement.querySelectorAll('.task-card:not(.dragging)'));
    
    // Find dropping index by cursor Y position
    let dropIndex = -1;
    for (let i = 0; i < cardElements.length; i++) {
      const rect = cardElements[i].getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (e.clientY < midpoint) {
        dropIndex = i;
        break;
      }
    }

    let targetPosition = 1000;

    if (tasks.length === 0) {
      // Empty column
      targetPosition = 1000;
    } else if (dropIndex === 0) {
      // Dropped at the very top
      targetPosition = tasks[0].position / 2;
    } else if (dropIndex === -1) {
      // Dropped at the very bottom
      targetPosition = tasks[tasks.length - 1].position + 1000;
    } else {
      // Dropped between two cards
      const taskAbove = tasks[dropIndex - 1];
      const taskBelow = tasks[dropIndex];
      targetPosition = (taskAbove.position + taskBelow.position) / 2;
    }

    // Trigger state move (optimistic and dispatches REST and Socket events)
    moveTask(taskId, status, targetPosition);
  };

  return (
    <div 
      className={`column-container glass-panel ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <div className="column-title-wrapper">
          <span className="column-title">{status}</span>
          <span className="column-count">{tasks.length}</span>
        </div>
        <button 
          onClick={() => onAddTask(status)} 
          className="column-add-task-btn"
          title={`Add task to ${status}`}
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="task-list">
        {tasks.map((task) => (
          <TaskCard 
            key={task._id} 
            task={task} 
            onClick={onTaskClick} 
          />
        ))}
      </div>
    </div>
  );
};

export default Column;
