import React, { useState } from 'react';
import { 
  Cloud, 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Database,
  HardDrive,
  Cpu,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { api, setAuthToken, setStoredUser } from '../services/api';

export default function AuthModal({ onAuthSuccess, initialRole = 'student' }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await api.login({ email, password });
      } else {
        res = await api.register({ name, email, password, role });
      }
      setAuthToken(res.access_token);
      setStoredUser(res.user);
      onAuthSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole) => {
    setError('');
    setLoading(true);
    try {
      const demoEmail = demoRole === 'teacher' ? 'teacher@university.edu' : 'alice@student.edu';
      const demoPass = demoRole === 'teacher' ? 'Teacher@123' : 'Student@123';
      const res = await api.login({ email: demoEmail, password: demoPass });
      setAuthToken(res.access_token);
      setStoredUser(res.user);
      onAuthSuccess(res.user);
    } catch (err) {
      setError('Could not auto-login with demo credentials. Ensure database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Visual Column: Cloud Architecture Graphic */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Decoupled Cloud Computing Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Assignment Submission & Feedback Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Enterprise academic platform featuring role-based authentication, cloud relational database integration, and decoupled object storage for large PDF and ZIP submissions.
          </p>

          {/* Graphical Microservices Topology Diagram */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3.5 shadow-2xl relative overflow-hidden">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Cloud Microservice Topology</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Online
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-1.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-white">FastAPI</span>
                <span className="text-[9px] text-slate-400">Stateless REST</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-1.5">
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-white">Cloud DB</span>
                <span className="text-[9px] text-slate-400">Metadata & Marks</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5">
                  <HardDrive className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-white">S3 Storage</span>
                <span className="text-[9px] text-slate-400">Binary Artifacts</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
              <span>Security Protocol:</span>
              <span className="font-mono text-cyan-300 font-bold">JWT HS256 + Bcrypt Salt</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sleek Glassmorphic Login / Register Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto glass-panel p-6 sm:p-8 relative glow-border shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {isLogin ? 'Sign In to Portal' : 'Create Cloud Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select an account or use instant demo credentials
            </p>
          </div>

          {/* Quick Demo Instant Logins */}
          <div className="mb-6 bg-slate-950/70 p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              ⚡ 1-Click Instant Demo Authentication
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('teacher')}
                disabled={loading}
                className="py-2.5 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 text-blue-300 border border-blue-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>👩‍🏫 Teacher Demo</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                disabled={loading}
                className="py-2.5 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 hover:from-emerald-600/30 hover:to-cyan-600/30 text-emerald-300 border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>👨‍🎓 Student Demo</span>
              </button>
            </div>
          </div>

          {/* Tabs: Sign In / Register */}
          <div className="flex rounded-xl bg-slate-950/90 p-1 mb-5 border border-white/10">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isLogin ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isLogin ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alan Turing"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                        role === 'student'
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-sm'
                          : 'border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('teacher')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                        role === 'teacher'
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-sm'
                          : 'border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      Teacher
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isLogin ? 'name@university.edu' : 'alice@student.edu'}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : isLogin ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate & Launch Workspace</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register Account</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
