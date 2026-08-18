import React, { useState, useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';
import API from '../services/api';
import { X, Search, UserPlus, Users, Check } from 'lucide-react';

const MemberList = ({ onClose }) => {
  const { activeBoard, inviteMember, onlineUsers } = useBoardStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [invitingEmail, setInvitingEmail] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle user search when query changes (with simple debouncing)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      setErrorMsg('');
      try {
        const res = await API.get(`/users/search?q=${searchQuery}`);
        
        // Filter out users who are already members
        const filteredResults = res.data.filter(
          (u) => !activeBoard.members.some((m) => m._id === u._id)
        );
        
        setSearchResults(filteredResults);
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to search users');
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeBoard.members]);

  const handleInvite = async (email) => {
    setInvitingEmail(email);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await inviteMember(activeBoard._id, email);
      setSuccessMsg(`User invited successfully!`);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      setErrorMsg(err.message || 'Invitation failed');
    } finally {
      setInvitingEmail(null);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} style={{ color: 'var(--color-primary)' }} />
          Board Collaborators
        </h3>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            {successMsg}
          </div>
        )}

        {/* Invite Form */}
        <div className="modal-form-group">
          <label className="modal-label">Search Users to Invite</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Type username or email..."
              className="input-field"
              style={{ paddingLeft: '38px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Search Results */}
        {searchQuery.trim() && (
          <div className="member-search-results" style={{ marginBottom: '24px' }}>
            {searching ? (
              <div style={{ padding: '14px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                Searching users...
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '14px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                No joinable users found
              </div>
            ) : (
              searchResults.map((userResult) => (
                <div key={userResult._id} className="member-search-item">
                  <div className="member-search-info">
                    <span className="member-search-name">{userResult.username}</span>
                    <span className="member-search-email">{userResult.email}</span>
                  </div>
                  <button
                    onClick={() => handleInvite(userResult.email)}
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    disabled={invitingEmail === userResult.email}
                  >
                    <UserPlus size={12} />
                    {invitingEmail === userResult.email ? 'Inviting...' : 'Invite'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Active Collaborators list */}
        <div className="modal-form-group">
          <label className="modal-label" style={{ marginBottom: '12px' }}>Current Members</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
            {activeBoard.members?.map((member) => {
              const isOnline = onlineUsers.some((ou) => ou._id === member._id);
              const isCreator = activeBoard.createdBy === member._id || activeBoard.createdBy?._id === member._id;

              return (
                <div 
                  key={member._id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="avatar-container">
                      <div 
                        className="user-avatar" 
                        style={{ 
                          width: '32px', 
                          height: '32px', 
                          fontSize: '11px',
                          background: isOnline ? 'linear-gradient(135deg, #10b981, #059669)' : '#4b5563'
                        }}
                      >
                        {member.username.slice(0, 2).toUpperCase()}
                      </div>
                      {isOnline && <span className="avatar-online-dot"></span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#fff' }}>
                        {member.username} {isCreator && <span style={{ fontSize: '10px', color: 'var(--color-primary)', background: 'var(--color-primary-glow)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>Owner</span>}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{member.email}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    {isOnline ? (
                      <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} />
                        online
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>offline</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberList;
