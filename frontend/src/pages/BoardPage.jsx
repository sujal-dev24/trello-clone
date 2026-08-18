import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoardStore } from '../store/boardStore';
import Board from '../components/Board';
import BoardHeader from '../components/BoardHeader';
import FilterBar from '../components/FilterBar';
import { Kanban, LogOut, Plus, X, FolderKanban } from 'lucide-react';

const BoardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    user,
    logout,
    boards,
    activeBoard,
    fetchBoards,
    createBoard,
    fetchBoardData,
    leaveBoard,
    loading,
    error,
  } = useBoardStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // Sync state with URL parameter lifecycle
  useEffect(() => {
    if (id) {
      fetchBoardData(id);
    } else {
      // Clear socket listeners and active board when on the list page
      leaveBoard();
      fetchBoards();
    }

    return () => {
      // Disconnect socket when navigating away or unmounting page
      leaveBoard();
    };
  }, [id, fetchBoardData, leaveBoard, fetchBoards]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    setCreating(true);
    try {
      const created = await createBoard(newBoardTitle);
      setShowCreateModal(false);
      setNewBoardTitle('');
      // Navigate to the new board URL
      navigate(`/board/${created._id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  // Loading screen when entering a specific board
  if (id && loading && !activeBoard) {
    return (
      <div className="app-container">
        <nav className="app-nav">
          <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div className="nav-brand-icon">
              <Kanban size={18} />
            </div>
            <span>CoBoard</span>
          </div>
        </nav>
        <div className="empty-state" style={{ height: '70vh' }}>
          <div className="typing-dot" style={{ width: '12px', height: '12px', margin: '0 4px' }}></div>
          <div className="typing-dot" style={{ width: '12px', height: '12px', margin: '0 4px', animationDelay: '0.2s' }}></div>
          <div className="typing-dot" style={{ width: '12px', height: '12px', margin: '0 4px', animationDelay: '0.4s' }}></div>
          <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Entering workspace...</p>
        </div>
      </div>
    );
  }

  // Render specific Board Workspace if URL has board ID parameter
  if (id && activeBoard) {
    return (
      <div className="app-container">
        {/* Top Navbar */}
        <nav className="app-nav">
          <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div className="nav-brand-icon">
              <Kanban size={18} />
            </div>
            <span>CoBoard</span>
          </div>
          <div className="user-profile-menu">
            <span className="user-name">{user?.username}</span>
            <div className="user-avatar">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : 'U'}
            </div>
            <button 
              onClick={logout} 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </nav>

        {/* Board Workspace */}
        <div className="board-container">
          <BoardHeader />
          <FilterBar />
          <Board />
        </div>
      </div>
    );
  }

  // Render Dashboard selector by default (at path "/")
  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="app-nav">
        <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div className="nav-brand-icon">
            <Kanban size={18} />
          </div>
          <span>CoBoard</span>
        </div>
        <div className="user-profile-menu">
          <span className="user-name">{user?.username}</span>
          <div className="user-avatar">
            {user?.username ? user.username.slice(0, 2).toUpperCase() : 'U'}
          </div>
          <button 
            onClick={logout} 
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Dashboard Selector */}
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title-area">
            <h2>Your Workspaces</h2>
            <p>Select a board to collaborate in real-time or create a new one.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={16} />
            New Board
          </button>
        </div>

        {error && (
          <div 
            style={{ 
              maxWidth: '1200px',
              margin: '0 auto 20px auto',
              background: 'rgba(239, 68, 68, 0.15)', 
              color: '#f87171', 
              padding: '12px', 
              borderRadius: '8px', 
              fontSize: '13px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="empty-state">
            <div className="typing-dot" style={{ width: '12px', height: '12px', margin: '0 4px' }}></div>
            <div className="typing-dot" style={{ width: '12px', height: '12px', margin: '0 4px', animationDelay: '0.2s' }}></div>
            <div className="typing-dot" style={{ width: '12px', height: '12px', margin: '0 4px', animationDelay: '0.4s' }}></div>
            <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading boards...</p>
          </div>
        ) : boards.length === 0 ? (
          <div className="empty-state glass-panel" style={{ maxWidth: '600px', margin: '40px auto' }}>
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No boards found</h3>
            <p className="empty-state-desc" style={{ marginBottom: '24px' }}>
              You don't have any boards yet. Create a new board to start organizing your work.
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={16} />
              Create First Board
            </button>
          </div>
        ) : (
          <div className="boards-grid">
            {boards.map((board) => (
              <div 
                key={board._id} 
                className="board-card glass-panel" 
                onClick={() => navigate(`/board/${board._id}`)}
              >
                <div>
                  <h3 className="board-card-title">{board.title}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FolderKanban size={12} />
                    Created by {board.createdBy?.username === user?.username ? 'You' : board.createdBy?.username}
                  </p>
                </div>
                <div className="board-card-info">
                  <span>{board.members?.length || 1} Member{board.members?.length !== 1 ? 's' : ''}</span>
                  <div className="board-card-members">
                    {board.members?.slice(0, 4).map((member) => (
                      <div 
                        key={member._id} 
                        className="avatar-stack-item" 
                        title={member.username}
                      >
                        {member.username.slice(0, 2).toUpperCase()}
                      </div>
                    ))}
                    {board.members?.length > 4 && (
                      <div className="avatar-stack-item" title={`${board.members.length - 4} more`}>
                        +{board.members.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="create-board-card" onClick={() => setShowCreateModal(true)}>
              <Plus size={24} />
              <span>Create New Board</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal for creating a new board */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '450px' }}>
            <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
              <X size={18} />
            </button>
            <h3 className="modal-title">Create Board</h3>
            <form onSubmit={handleCreateBoard}>
              <div className="modal-form-group">
                <label className="modal-label">Board Title</label>
                <input
                  type="text"
                  placeholder="e.g. Project Launch"
                  className="input-field"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-footer" style={{ marginTop: '20px', padding: '10px 0' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={creating || !newBoardTitle.trim()}
                >
                  {creating ? 'Creating...' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardPage;
