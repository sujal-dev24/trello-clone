import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoardStore } from '../store/boardStore';
import MemberList from './MemberList';
import { ArrowLeft, UserPlus, Users, Edit3 } from 'lucide-react';

const BoardHeader = () => {
  const navigate = useNavigate();
  const { activeBoard, onlineUsers, typingUsers } = useBoardStore();
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Check if someone is typing. Look inside typingUsers.
  // typingUsers format: { [taskId]: [username1, username2] }
  // We can aggregate all active typers for display in header
  const allTypers = [];
  Object.entries(typingUsers).forEach(([taskId, users]) => {
    users.forEach((username) => {
      if (!allTypers.includes(username)) {
        allTypers.push(username);
      }
    });
  });

  // Calculate members online status
  const memberList = activeBoard?.members || [];
  
  return (
    <header className="board-header">
      <div className="board-title-section">
        <button 
          onClick={() => navigate('/')} 
          className="board-back-btn" 
          title="Back to Workspaces"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="board-title">{activeBoard?.title}</h2>
      </div>

      <div className="board-meta-section">
        {/* Realtime Typing Indicators */}
        {allTypers.length > 0 && (
          <div className="typing-area">
            <Edit3 size={12} style={{ color: 'var(--color-primary)' }} />
            <span>
              {allTypers.join(', ')} {allTypers.length === 1 ? 'is' : 'are'} typing
            </span>
            <div style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}

        {/* Member Collaboration Avatars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="active-members-list" style={{ marginRight: '8px' }}>
            {memberList.slice(0, 5).map((member) => {
              const isOnline = onlineUsers.some((ou) => ou._id === member._id);
              return (
                <div key={member._id} className="avatar-container" title={`${member.username} (${isOnline ? 'Online' : 'Offline'})`}>
                  <div 
                    className="user-avatar" 
                    style={{ 
                      width: '30px', 
                      height: '30px', 
                      fontSize: '11px',
                      background: isOnline ? 'linear-gradient(135deg, #10b981, #059669)' : '#374151',
                      borderColor: isOnline ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                      marginLeft: '-4px'
                    }}
                  >
                    {member.username.slice(0, 2).toUpperCase()}
                  </div>
                  {isOnline && <span className="avatar-online-dot"></span>}
                </div>
              );
            })}
            {memberList.length > 5 && (
              <div 
                className="user-avatar" 
                style={{ width: '30px', height: '30px', fontSize: '11px', background: '#4b5563', marginLeft: '-4px' }}
                title={`${memberList.length - 5} more members`}
              >
                +{memberList.length - 5}
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowInviteModal(true)} 
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <UserPlus size={14} />
            Invite
          </button>
        </div>
      </div>

      {showInviteModal && (
        <MemberList onClose={() => setShowInviteModal(false)} />
      )}
    </header>
  );
};

export default BoardHeader;
