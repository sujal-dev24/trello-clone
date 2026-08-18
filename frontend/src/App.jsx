import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useBoardStore } from './store/boardStore';
import AuthPage from './pages/AuthPage';
import BoardPage from './pages/BoardPage';

function App() {
  const user = useBoardStore((state) => state.user);

  return (
    <Router>
      <Routes>
        {/* Unauthenticated authentication route */}
        <Route 
          path="/auth" 
          element={!user ? <AuthPage /> : <Navigate to="/" replace />} 
        />
        
        {/* Protected Dashboard Route */}
        <Route 
          path="/" 
          element={user ? <BoardPage /> : <Navigate to="/auth" replace />} 
        />

        {/* Protected Board Workspace Route */}
        <Route 
          path="/board/:id" 
          element={user ? <BoardPage /> : <Navigate to="/auth" replace />} 
        />

        {/* Catch-all redirects to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
