import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { type User, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { auth, initializationError } from './services/firebase';
import AuthScreen from './pages/AuthScreen';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import SchedulePage from './pages/Schedule';
import HistoryPage from './pages/History';
import { SystemError } from './components/SystemError';

function App() {

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Dark Mode State
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('medbox-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const toggleTheme = () => {
    setIsDark(prev => {
      const newVal = !prev;
      localStorage.setItem('medbox-theme', newVal ? 'dark' : 'light');
      return newVal;
    });
  };

  // Auth Listener
  useEffect(() => {
    if (!auth) {
      // Should be caught by initializationError, but double check
      setAuthLoading(false);
      return;
    }

    const initAuth = async () => {
      const token = (window as any).__initial_auth_token;
      if (token) {
        try {
          await signInWithCustomToken(auth!, token);
        } catch (e) {
          console.error("Token Sign-in Failed", e);
        }
      }
      setAuthLoading(false);
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []); 


  if(initializationError){
    return <SystemError error={initializationError} />;
  }

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300 ${isDark ? 'dark' : ''}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-200 dark:selection:bg-cyan-900 transition-colors duration-300">
        {/* Replace 'Router' with 'BrowserRouter' for production */}
        <Router>
          <Routes>
            <Route path="/login" element={
              user ? <Navigate to="/" replace /> : <AuthScreen isDark={isDark} toggleTheme={toggleTheme} />
            } />
            
            {/* Protected Routes */}
            <Route element={<RequireAuth user={user} />}>
              <Route element={<Layout user={user} isDark={isDark} toggleTheme={toggleTheme} />}>
                <Route path="/" element={<Dashboard user={user!} />} />
                <Route path="/schedule" element={<SchedulePage user={user!} />} />
                <Route path="/history" element={<HistoryPage user={user!} />} />
              </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </div>
    </div>
  );
  
}

export default App
