import React, { useState } from 'react';
import { Calendar, AlignLeft, User } from 'lucide-react';
import TypingIndicator from './TypingIndicator';
import { useBoardStore } from '../store/boardStore';

const TaskCard = ({ task, onClick }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', task._id);
    e.dataTransfer.setData('sourceStatus', task.status);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add active class for styling
    setTimeout(() => {
      const el = document.getElementById(`card-${task._id}`);
      if (el) el.classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    const el = document.getElementById(`card-${task._id}`);
    if (el) el.classList.remove('dragging');
  };

  // Format the due date beautifully
  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Check if the due date is overdue
  const isOverdue = (dateStr) => {
    if (!dateStr || task.status === 'Done') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  const dueDateFormatted = formatDueDate(task.dueDate);
  const overdue = isOverdue(task.dueDate);

  // Safe assignee name resolution (works for populated object, string ID, or unassigned)
  const getAssigneeName = () => {
    if (!task.assignedTo) return null;
    if (typeof task.assignedTo === 'object' && task.assignedTo.username) {
      return task.assignedTo.username;
    }
    const members = useBoardStore.getState().activeBoard?.members || [];
    const matched = members.find((m) => m._id === task.assignedTo);
    return matched ? matched.username : '';
  };
  
  const assigneeName = getAssigneeName();

  return (
    <div
      id={`card-${task._id}`}
      className="task-card glass-panel"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick(task)}
      style={{ cursor: 'grab' }}
    >
      <div className="task-card-header">
        <span className={`badge badge-${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
      </div>

      <h4 className="task-card-title">{task.title}</h4>

      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      {/* Realtime Typing Indicator on Card */}
      <TypingIndicator taskId={task._id} />

      <div className="task-card-footer">
        {dueDateFormatted ? (
          <div className={`task-card-date ${overdue ? 'overdue' : ''}`}>
            <Calendar size={12} />
            <span>{dueDateFormatted}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
            {task.description && <AlignLeft size={12} />}
          </div>
        )}

        <div className="task-card-assignee-area">
          {assigneeName ? (
            <div 
              className="task-card-assignee" 
              title={`Assigned to ${assigneeName}`}
            >
              {assigneeName.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <div className="task-card-empty-assignee" title="Unassigned">
              <User size={10} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
