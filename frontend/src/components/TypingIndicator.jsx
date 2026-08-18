import React from 'react';
import { useBoardStore } from '../store/boardStore';
import { Edit } from 'lucide-react';

const TypingIndicator = ({ taskId }) => {
  const typingUsers = useBoardStore((state) => state.typingUsers);
  
  const key = taskId || 'board';
  const typers = typingUsers[key] || [];

  if (typers.length === 0) return null;

  return (
    <div 
      className="typing-indicator-container"
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px', 
        padding: '2px 8px', 
        borderRadius: '4px',
        background: 'rgba(99, 102, 241, 0.12)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        fontSize: '11px',
        color: '#a5b4fc',
        margin: '6px 0'
      }}
    >
      <Edit size={10} className="typing-icon" />
      <span>{typers.join(', ')} typing</span>
      <div style={{ display: 'inline-flex', gap: '1.5px', alignItems: 'center' }}>
        <span className="typing-dot" style={{ width: '3px', height: '3px', background: 'var(--color-primary)' }}></span>
        <span className="typing-dot" style={{ width: '3px', height: '3px', background: 'var(--color-primary)', animationDelay: '0.2s' }}></span>
        <span className="typing-dot" style={{ width: '3px', height: '3px', background: 'var(--color-primary)', animationDelay: '0.4s' }}></span>
      </div>
    </div>
  );
};

export default TypingIndicator;
