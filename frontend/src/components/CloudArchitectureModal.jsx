import React from 'react';
import { 
  X, 
  Cloud, 
  Database, 
  HardDrive, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Zap, 
  Lock,
  ArrowRight
} from 'lucide-react';

export default function CloudArchitectureModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl glass-panel p-6 sm:p-8 relative shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px]">
            <div className="w-full h-full bg-[#0d1424] rounded-[15px] flex items-center justify-center">
              <Cloud className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Cloud Computing Architecture Specification
            </h2>
            <p className="text-xs text-slate-400">
              Interactive Blueprint: Microservices, Storage Decoupling, and Security
            </p>
          </div>
        </div>

        {/* Visual Architecture Pipeline */}
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-white/10 mb-6">
          <div className="text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-4 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>End-to-End System Pipeline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-white/5 flex flex-col items-center">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white">Client / SPA</span>
              <span className="text-[11px] text-slate-400 mt-1">React + Vite</span>
              <span className="text-[10px] text-slate-500 mt-1">Role-based JWT sessions</span>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-white/5 flex flex-col items-center">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white">REST API Gateway</span>
              <span className="text-[11px] text-slate-400 mt-1">FastAPI Backend</span>
              <span className="text-[10px] text-slate-500 mt-1">RBAC & Deadline validation</span>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-white/5 flex flex-col items-center">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2">
                <Database className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white">Cloud Database</span>
              <span className="text-[11px] text-slate-400 mt-1">PostgreSQL / Supabase</span>
              <span className="text-[10px] text-slate-500 mt-1">Users, Marks & Deadlines</span>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-white/5 flex flex-col items-center">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white">Object Storage</span>
              <span className="text-[11px] text-slate-400 mt-1">AWS S3 / Bucket Store</span>
              <span className="text-[10px] text-slate-500 mt-1">Raw PDF/ZIP Submissions</span>
            </div>
          </div>
        </div>

        {/* Why Cloud Storage vs Database */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>Cloud Database (Structured Data)</span>
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Stores relational entities: Users, Courses, Assignments, Submissions.</li>
              <li>Enforces ACID transactions on student deadlines and teacher marks.</li>
              <li>Never stores binary BLOBs to prevent I/O blocking and database bloat.</li>
              <li>Provides rapid indexing on <code className="text-cyan-300">student_id</code> and <code className="text-cyan-300">deadline</code>.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4" />
              <span>Cloud Object Storage (Unstructured Data)</span>
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Stores multi-megabyte binary artifacts: PDFs, DOCX, ZIP files.</li>
              <li>Hierarchical path: <code className="text-emerald-300 font-mono text-[11px]">assignments/aid/student_uid/v1_file.pdf</code></li>
              <li>Virtually unlimited elasticity: scales independently from application servers.</li>
              <li>Private access protected by signed URLs or authenticated gateway streaming.</li>
            </ul>
          </div>
        </div>

        {/* Scalability Under Peak Loads */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-300">
          <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Handling 100,000 Students Submitting Near Deadline</span>
          </h4>
          <p className="text-slate-400 leading-relaxed">
            In peak scenarios (e.g. 10 minutes before an 11:59 PM deadline), application servers face massive connection spikes. This system decouples heavy file I/O: the client uploads large binaries directly to Object Storage via presigned S3 URLs, while the backend API receives only lightweight metadata requests (500 bytes). A cloud Load Balancer auto-scales stateless containers, ensuring zero downtime.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg shadow-blue-600/30"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
