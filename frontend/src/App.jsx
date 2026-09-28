import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import CloudArchitectureModal from './components/CloudArchitectureModal';
import { 
  api, 
  getStoredUser, 
  setStoredUser, 
  removeStoredUser, 
  getAuthToken, 
  setAuthToken, 
  removeAuthToken 
} from './services/api';
import { CheckCircle2, AlertCircle, Info, Cloud, HardDrive, ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);
  const [showArchModal, setShowArchModal] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Check backend health & verify token on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        const health = await api.getHealth();
        setHealthStatus(health);

        const token = getAuthToken();
        if (token) {
          const profile = await api.getMe();
          setUser(profile);
          setStoredUser(profile);
        }
      } catch (err) {
        console.warn('Backend or token init check:', err.message);
      } finally {
        setLoading(false);
      }
    };

    initApp();

    const handleUnauthorized = () => {
      setUser(null);
      showNotification('Your session has expired. Please sign in again.', 'info');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignored if network issue
    } finally {
      removeAuthToken();
      removeStoredUser();
      setUser(null);
      showNotification('Signed out of cloud portal successfully.', 'info');
    }
  };

  const handleSwitchUser = async (targetRole) => {
    try {
      const email = targetRole === 'teacher' ? 'teacher@university.edu' : 'alice@student.edu';
      const pass = targetRole === 'teacher' ? 'Teacher@123' : 'Student@123';
      const res = await api.login({ email, password: pass });
      setAuthToken(res.access_token);
      setStoredUser(res.user);
      setUser(res.user);
      showNotification(`Switched role to ${res.user.role.toUpperCase()}: ${res.user.name}`, 'success');
    } catch (err) {
      showNotification('Switch failed: ' + err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="w-full h-full border-4 border-indigo-500/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-xs text-slate-400 font-mono tracking-wider">Connecting to Cloud Gateway...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-blue-600 relative">
      {/* Background Graphic Elements */}
      <div className="bg-mesh-glow"></div>
      <div className="bg-grid-pattern"></div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-xs font-semibold backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-slate-900/90 border-blue-500/40 text-slate-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        onOpenArch={() => setShowArchModal(true)}
        healthStatus={healthStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!user ? (
          <AuthModal
            onAuthSuccess={(authedUser) => {
              setUser(authedUser);
              showNotification(`Signed in as ${authedUser.name} (${authedUser.role})`, 'success');
            }}
          />
        ) : user.role === 'teacher' || user.role === 'admin' ? (
          <TeacherDashboard user={user} onNotify={showNotification} />
        ) : (
          <StudentDashboard user={user} onNotify={showNotification} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-4 text-center text-xs text-slate-500 bg-[#05080f]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-bold tracking-tight">CloudEdu Assignment Portal</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-3">
            <span>Decoupled Storage Engine</span>
            <span>•</span>
            <span>Server-side UTC Validation</span>
            <span>•</span>
            <span>Role-Based Access Control</span>
          </div>
        </div>
      </footer>

      {/* Cloud Architecture Details Modal */}
      {showArchModal && (
        <CloudArchitectureModal onClose={() => setShowArchModal(false)} />
      )}
    </div>
  );
}
