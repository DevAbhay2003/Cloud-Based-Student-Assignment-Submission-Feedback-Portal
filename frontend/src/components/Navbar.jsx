import React from 'react';
import { 
  Cloud, 
  Database, 
  Server, 
  User, 
  LogOut, 
  ShieldCheck, 
  Layers, 
  Activity,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function Navbar({ 
  user, 
  onLogout, 
  onSwitchUser, 
  onOpenArch, 
  healthStatus 
}) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#070b14]/85 border-b border-white/10 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand / Title with animated glow */}
        <div className="flex items-center gap-3.5">
          <div className="relative group cursor-pointer" onClick={onOpenArch}>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative w-11 h-11 bg-[#0b1324] rounded-xl border border-white/20 flex items-center justify-center shadow-lg">
              <Cloud className="w-6 h-6 text-cyan-400 animate-float" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#070b14] rounded-full radar-ring"></div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                CloudEdu
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 border border-blue-500/30">
                Coursework Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:flex items-center gap-2">
              <span>Decoupled Cloud Object Storage</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Cloud DB Live
              </span>
            </p>
          </div>
        </div>

        {/* Live Cloud Telemetry & User Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Cloud Architecture Interactive Blueprint Button */}
          <button
            onClick={onOpenArch}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 hover:from-indigo-500/20 hover:to-blue-500/20 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer shadow-sm shadow-indigo-500/10"
            title="Inspect Cloud Architecture Diagram and Components"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Architecture Flow</span>
          </button>

          {/* Quick Demo Switcher Tabs */}
          {user && (
            <div className="flex items-center gap-1 bg-slate-900/90 border border-white/10 rounded-xl p-1 shadow-inner">
              <button
                onClick={() => onSwitchUser('teacher')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  user.role === 'teacher'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>👩‍🏫</span>
                <span>Teacher</span>
              </button>
              <button
                onClick={() => onSwitchUser('student')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  user.role === 'student'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>👨‍🎓</span>
                <span>Student</span>
              </button>
            </div>
          )}

          {/* User Profile Badge */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-bold text-white tracking-tight">{user.name}</span>
                <span className="text-[10px] text-cyan-400 font-mono font-medium capitalize">
                  {user.role} Account
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-[1px] shadow-md shadow-indigo-500/20">
                <div className="w-full h-full bg-[#0a0f1d] rounded-[11px] flex items-center justify-center text-xs font-black text-cyan-300">
                  {user.name.charAt(0)}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-mono">Guest Mode</div>
          )}
        </div>
      </div>
    </header>
  );
}
