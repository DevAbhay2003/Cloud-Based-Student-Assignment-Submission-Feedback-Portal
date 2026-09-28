import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle, 
  Clock, 
  Award, 
  AlertTriangle, 
  Download, 
  ChevronRight, 
  X, 
  FileCheck,
  RefreshCw,
  LayoutGrid,
  List,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  FileCode,
  HardDrive
} from 'lucide-react';
import { api } from '../services/api';

export default function StudentDashboard({ user, onNotify }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [activeUploadAssignment, setActiveUploadAssignment] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewFeedbackSub, setViewFeedbackSub] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getStudentDashboard();
      setStats(data);
    } catch (err) {
      onNotify('Failed to load dashboard metrics: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !activeUploadAssignment) return;

    setUploading(true);
    setUploadProgress(20);

    try {
      // Simulate real-time cloud transfer progression
      const t1 = setTimeout(() => setUploadProgress(60), 200);
      const t2 = setTimeout(() => setUploadProgress(85), 450);

      const res = await api.submitAssignment(activeUploadAssignment.id, selectedFile);
      clearTimeout(t1);
      clearTimeout(t2);
      setUploadProgress(100);

      onNotify(
        `Assignment "${activeUploadAssignment.title}" uploaded to Cloud Object Storage! (Status: ${res.submission_status})`,
        'success'
      );
      setActiveUploadAssignment(null);
      setSelectedFile(null);
      fetchDashboard();
    } catch (err) {
      onNotify('Upload rejected: ' + err.message, 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'GRADED':
        return <span className="badge-status badge-graded"><Award className="w-3 h-3" /> Graded</span>;
      case 'SUBMITTED':
        return <span className="badge-status badge-submitted"><CheckCircle className="w-3 h-3" /> Submitted</span>;
      case 'LATE':
        return <span className="badge-status badge-late"><Clock className="w-3 h-3" /> Late</span>;
      default:
        return <span className="badge-status badge-pending"><AlertTriangle className="w-3 h-3" /> Pending</span>;
    }
  };

  const formatDeadline = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Completion calculation for visual circle gauge
  const total = stats?.total_assignments || 1;
  const submitted = (stats?.submitted_assignments || 0);
  const completionRate = Math.min(100, Math.round((submitted / total) * 100));

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="w-full h-full border-4 border-blue-500/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <HardDrive className="w-6 h-6 text-blue-400 absolute inset-0 m-auto" />
          </div>
          <p className="text-xs text-slate-400 font-mono tracking-wider">Connecting to Cloud Storage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Visual Hero Header with Radial Progress Gauge */}
      <div className="glass-panel p-6 sm:p-8 glow-border relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Student Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hello, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Submit coursework directly to Cloud Object Storage, view server-evaluated deadline verification, and track real-time faculty feedback.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Cloud Storage: <strong className="text-white">Active</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Server UTC Time Sync: <strong className="text-white">Enforced</strong></span>
            </div>
          </div>
        </div>

        {/* Visual Progress Ring Card */}
        <div className="flex items-center gap-5 bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-white/10 shrink-0">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray={201}
                strokeDashoffset={201 - (201 * completionRate) / 100}
                className="text-cyan-400 transition-all duration-1000 ease-out"
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-base font-extrabold text-white">{completionRate}%</span>
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Submission Rate
            </span>
            <span className="text-sm font-semibold text-white">
              {stats?.submitted_assignments || 0} of {stats?.total_assignments || 0} Handed In
            </span>
            <span className="text-[10px] text-cyan-400 block mt-1">
              {stats?.pending_assignments || 0} Pending Assignments
            </span>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="glass-panel p-4 glass-panel-hover glow-border">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Assigned</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{stats?.total_assignments || 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Active coursework</div>
        </div>

        <div className="glass-panel p-4 glass-panel-hover glow-border">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">{stats?.pending_assignments || 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Due for upload</div>
        </div>

        <div className="glass-panel p-4 glass-panel-hover glow-border">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">In Storage</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400">{stats?.submitted_assignments || 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Files persisted</div>
        </div>

        <div className="glass-panel p-4 glass-panel-hover glow-border">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Late Submissions</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-orange-400">{stats?.late_assignments || 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Past deadline</div>
        </div>

        <div className="glass-panel p-4 glass-panel-hover glow-border col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Evaluated</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats?.graded_assignments || 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Feedback published</div>
        </div>
      </div>

      {/* Deliverables Section with View Switcher */}
      <div className="glass-panel p-5 sm:p-6 glow-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-cyan-400" />
              <span>Course Assignments & Deliverables</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any assignment to upload binaries or review feedback
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Grid vs Table */}
            <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={fetchDashboard}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Visual Grid Card View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stats?.upcoming_deadlines?.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 p-5 flex flex-col justify-between hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {item.course_code}
                    </span>
                    {getStatusBadge(item.submission_status)}
                  </div>

                  <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {item.description || 'Complete the deliverables as outlined in the course syllabus.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        Deadline:
                      </span>
                      <span className="font-mono text-slate-200">{formatDeadline(item.deadline)}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        Points:
                      </span>
                      <span className="font-semibold text-slate-200">{item.max_marks} Pts</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                        Format:
                      </span>
                      <span className="font-mono text-[11px] text-cyan-300">{item.allowed_extensions}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                  {item.submission_status === 'GRADED' ? (
                    <button
                      onClick={() => setViewFeedbackSub(item)}
                      className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Score: {item.my_marks} / {item.max_marks}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveUploadAssignment(item);
                        setSelectedFile(null);
                      }}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                        item.submission_status === 'NOT_SUBMITTED'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10'
                      }`}
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{item.submission_status === 'NOT_SUBMITTED' ? 'Upload Solution' : 'Resubmit Version'}</span>
                    </button>
                  )}

                  {item.my_submission_id && (
                    <a
                      href={`/api/submissions/${item.my_submission_id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition-all"
                      title="Download file from Object Storage"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Course & Deliverable</th>
                  <th className="py-3 px-3">Deadline (UTC)</th>
                  <th className="py-3 px-3">Max Marks</th>
                  <th className="py-3 px-3">Formats</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {stats?.upcoming_deadlines?.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-white">{item.title}</div>
                      <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                        {item.course_code} • {item.course_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDeadline(item.deadline)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-200">
                      {item.max_marks} pts
                    </td>
                    <td className="py-3.5 px-3 text-[11px] text-slate-400 font-mono">
                      {item.allowed_extensions}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getStatusBadge(item.submission_status)}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {item.submission_status === 'GRADED' && (
                          <button
                            onClick={() => setViewFeedbackSub(item)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Award className="w-3 h-3" />
                            <span>Grade ({item.my_marks})</span>
                          </button>
                        )}

                        {item.my_submission_id && (
                          <a
                            href={`/api/submissions/${item.my_submission_id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                            title="Download file from Cloud Object Storage"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => {
                            setActiveUploadAssignment(item);
                            setSelectedFile(null);
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                            item.submission_status === 'NOT_SUBMITTED'
                              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10'
                          }`}
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{item.submission_status === 'NOT_SUBMITTED' ? 'Submit' : 'Resubmit'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Evaluated Feedback Cards Feed */}
      <div className="glass-panel p-5 sm:p-6 glow-border">
        <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2 mb-1">
          <Award className="w-5 h-5 text-emerald-400" />
          <span>Faculty Evaluations & Grade Feedback</span>
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Detailed remarks, criteria feedback, and verified marks published by course instructors
        </p>

        {(!stats?.recent_feedback || stats.recent_feedback.length === 0) ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-white/5">
            No graded submissions yet. As instructors review your uploads, the evaluated results appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.recent_feedback.map((fb) => (
              <div 
                key={fb.id} 
                className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {fb.course_code}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-1">{fb.assignment_title}</h3>
                  </div>
                  <div className="text-right bg-emerald-950/50 px-3 py-1 rounded-xl border border-emerald-500/30">
                    <div className="text-base font-black text-emerald-400">
                      {fb.marks} / {fb.max_marks}
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-emerald-300 font-bold">Awarded</span>
                  </div>
                </div>

                <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 my-3 relative">
                  <span className="text-slate-500 text-lg leading-none absolute -top-1.5 left-2 font-serif">“</span>
                  <p className="text-xs text-slate-200 italic pl-3 leading-relaxed">
                    {fb.feedback || 'Excellent work.'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                  <span className="truncate max-w-[200px]">
                    Evaluator: <strong className="text-slate-300">{fb.grader_name || 'Course Instructor'}</strong>
                  </span>
                  <a
                    href={`/api/submissions/${fb.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {fb.file_name}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal Dialog */}
      {activeUploadAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 relative shadow-2xl border border-white/10 glow-border">
            <button
              onClick={() => setActiveUploadAssignment(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                <UploadCloud className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-lg">
                  Cloud Submission
                </h3>
                <p className="text-xs text-slate-400">
                  {activeUploadAssignment.title} ({activeUploadAssignment.course_code})
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-white/5 mb-5 text-xs text-slate-300 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Deadline (UTC):</span>
                <span className="font-mono font-semibold text-amber-400">
                  {formatDeadline(activeUploadAssignment.deadline)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Accepted Formats:</span>
                <span className="font-mono text-cyan-300">{activeUploadAssignment.allowed_extensions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max File Size:</span>
                <span className="font-mono text-slate-200">{activeUploadAssignment.max_file_size_mb} MB</span>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-white/20 hover:border-cyan-500 rounded-2xl p-7 text-center transition-all bg-slate-900/60 cursor-pointer group">
                <input
                  type="file"
                  id="assignment-file"
                  required
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="assignment-file" className="cursor-pointer block">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3 transition-all">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-white block">
                    {selectedFile ? selectedFile.name : 'Click to select solution file'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {selectedFile
                      ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Cloud Upload`
                      : 'PDF, DOCX, ZIP supported'}
                  </span>
                </label>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-300 font-mono">
                    <span>Uploading to Cloud Object Storage...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 h-1.5 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveUploadAssignment(null)}
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {uploading ? 'Transferring...' : 'Confirm Cloud Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Grade & Feedback Modal */}
      {viewFeedbackSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md glass-panel p-6 sm:p-7 relative shadow-2xl border border-white/10 glow-border">
            <button
              onClick={() => setViewFeedbackSub(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Graded Evaluation</h3>
                <p className="text-xs text-slate-400">{viewFeedbackSub.title}</p>
              </div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
                <span className="text-xs text-slate-400">Awarded Points:</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {viewFeedbackSub.my_marks} / {viewFeedbackSub.max_marks}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1">
                  Instructor Written Commentary:
                </span>
                <div className="p-3.5 bg-black/40 rounded-xl text-xs text-slate-200 border border-white/5 leading-relaxed italic">
                  "{viewFeedbackSub.my_feedback || 'Satisfactory work completed on time.'}"
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewFeedbackSub(null)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
