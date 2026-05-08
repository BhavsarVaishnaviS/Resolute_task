import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import StudentList from './components/StudentList';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (isAuthenticated) return <StudentList />;

  return showSignup ? (
    <SignupForm onSwitchToLogin={() => setShowSignup(false)} />
  ) : (
    <LoginForm onSwitchToSignup={() => setShowSignup(true)} />
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
