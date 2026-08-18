import React, { useState, useEffect, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';
import { X, Calendar, User, AlignLeft, AlertCircle, Trash2, CheckCircle2, Circle } from 'lucide-react';
import TypingIndicator from './TypingIndicator';

const TaskModal = ({ task, initialStatus, onClose }) => {
  const {
    activeBoard,
    createTask,
    updateTask,
    deleteTask,
    sendTypingStart,
    sendTypingStop,
  } = useBoardStore();

  const isEditMode = !!task;

  // Form states
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [status, setStatus] = useState(task?.status || initialStatus || 'Todo');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Typing debouncer ref
  const typingTimeoutRef = useRef(null);

  // Set initial formatted date and assignee
  useEffect(() => {
    if (task) {
      if (task.dueDate) {
        // Format for input type="date" (YYYY-MM-DD)
        const d = new Date(task.dueDate);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setDueDate(`${year}-${month}-${day}`);
      }
      
      const assigneeId = task.assignedTo?._id || task.assignedTo || '';
      setAssignedTo(assigneeId);
    }
  }, [task]);

  // Clean up typing indicators on modal close
  useEffect(() => {
    return () => {
      if (isEditMode && task?._id) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        sendTypingStop(task._id);
      }
    };
  }, [isEditMode, task?._id, sendTypingStop]);

  // Typing trigger handler
  const handleTyping = () => {
    if (!isEditMode || !task?._id) return;

    // Send typing start event
    sendTypingStart(task._id);

    // Clear previous timeout and set a new one
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(task._id);
    }, 2000); // Declared idle after 2 seconds
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Task title is required');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    const taskData = {
      title,
      description,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedTo: assignedTo || null,
    };

    try {
      if (isEditMode) {
        await updateTask(task._id, taskData);
      } else {
        await createTask(taskData);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task?._id) return;
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    setDeleting(true);
    setErrorMsg('');

    try {
      await deleteTask(task._id);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to delete task');
      setDeleting(false);
    }
  };

  const columns = ['Todo', 'In Progress', 'Review', 'Done'];

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isEditMode ? (
            <>
              <CheckCircle2 size={20} style={{ color: 'var(--color-primary)' }} />
              Edit Task Details
            </>
          ) : (
            <>
              <Circle size={20} style={{ color: 'var(--color-primary)' }} />
              Create New Task
            </>
          )}
        </h3>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        {/* Typing indicators */}
        {isEditMode && <TypingIndicator taskId={task._id} />}

        <form onSubmit={handleSave}>
          <div className="modal-body-layout">
            {/* Left side: content details */}
            <div className="modal-section-left">
              <div className="modal-form-group">
                <label className="modal-label">Task Title</label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  className="input-field"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); handleTyping(); }}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlignLeft size={12} />
                  Description
                </label>
                <textarea
                  placeholder="Add more details about this task..."
                  className="input-field"
                  rows={6}
                  style={{ resize: 'vertical' }}
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); handleTyping(); }}
                />
              </div>
            </div>

            {/* Right side: metadata and properties */}
            <div className="modal-section-right">
              <div className="modal-form-group">
                <label className="modal-label">Status Column</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field"
                >
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="input-field"
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={12} />
                  Assignee
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="input-field"
                >
                  <option value="">Unassigned</option>
                  {activeBoard?.members?.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={12} />
                  Due Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn btn-danger"
                  disabled={deleting}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
            
            <div className="modal-actions-right">
              <button 
                type="button" 
                onClick={onClose} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
