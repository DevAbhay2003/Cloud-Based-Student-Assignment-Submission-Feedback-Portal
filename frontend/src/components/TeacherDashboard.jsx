import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  Inbox, 
  Clock, 
  CheckCircle, 
  Plus, 
  Award, 
  Download, 
  X, 
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  Sliders,
  Send
} from 'lucide-react';
import { api } from '../services/api';

export default function TeacherDashboard({ user, onNotify }) {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeGradeSub, setActiveGradeSub] = useState(null);
  
  // Create Assignment Form
  const [newTitle, setNewTitle] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newMaxMarks, setNewMaxMarks] = useState(100);
  const [newAllowedExts, setNewAllowedExts] = useState('.pdf,.docx,.zip');
  const [newMaxMb, setNewMaxMb] = useState(25);
  const [newAllowLate, setNewAllowLate] = useState(true);
  const [creating, setCreating] = useState(false);

  // Grade Form
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashData, coursesData] = await Promise.all([
        api.getTeacherDashboard(),
        api.getCourses()
      ]);
      setStats(dashData);
      setCourses(coursesData);
      if (coursesData.length > 0 && !newCourseId) {
        setNewCourseId(coursesData[0].id);
      }
    } catch (err) {
      onNotify('Failed to load instructor metrics: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      if (!newDeadline) {
        throw new Error('Please select an assignment submission deadline.');
      }
      await api.createAssignment({
        course_id: newCourseId,
        title: newTitle,
        description: newDesc,
        deadline: new Date(newDeadline).toISOString(),
        max_marks: parseFloat(newMaxMarks),
        allowed_extensions: newAllowedExts,
        max_file_size_mb: parseInt(newMaxMb, 10),
        allow_late_submissions: newAllowLate
      });

      onNotify(`Assignment "${newTitle}" published successfully!`, 'success');
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewDeadline('');
      fetchDashboardData();
    } catch (err) {
      onNotify('Creation failed: ' + err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!activeGradeSub) return;
    setSubmittingGrade(true);
    try {
      const marksVal = parseFloat(gradeMarks);
      if (marksVal > (activeGradeSub.max_marks || 100)) {
        throw new Error(`Marks cannot exceed ${activeGradeSub.max_marks || 100} points.`);
      }

      await api.gradeSubmission(activeGradeSub.id, {
        marks: marksVal,
        feedback: gradeFeedback
      });

      onNotify(`Evaluation published for ${activeGradeSub.student_name}!`, 'success');
      setActiveGradeSub(null);
      setGradeMarks('');
      setGradeFeedback('');
      fetchDashboardData();
    } catch (err) {
      onNotify('Grading error: ' + err.message, 'error');
    } finally {
      setSubmittingGrade(false);
    }
  };

  const openGradeModal = (sub) => {
    setActiveGradeSub(sub);
    setGradeMarks(sub.marks !== null ? sub.marks : '');
    setGradeFeedback(sub.feedback || '');
  };

  const filteredSubmissions = (stats?.recent_submissions || []).filter((s) => {
    const matchesSearch = 
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.assignment_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.file_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'PENDING') return s.submission_status !== 'GRADED';
    if (filterStatus === 'GRADED') return s.submission_status === 'GRADED';
    if (filterStatus === 'LATE') return s.submission_status === 'LATE';
    return true;
  });

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-mono tracking-wider">Syncing Faculty Telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner with Actions */}
      <div className="glass-panel p-6 sm:p-8 glow-border relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Faculty Management Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, {user?.name || 'Professor'}! 👩‍🏫
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Monitor real-time student uploads in Cloud Object Storage, enforce deadline rules, and publish verified marks and feedback.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-all cursor-pointer"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="glass-panel p-4 glass-panel-hover glow-border">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Assignments</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats?.total_assignments || 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Live coursework</div>
        </div>

        <div className="glass-panel p-4 glass-panel-hover glow-border">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Enrolled</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{stats?.total_students || 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Active students</div>
        </div>

        <div className="glass-panel p-4 glass-panel-hover glow-border">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">In Storage</span>
            <Inbox className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400">{stats?.total_submissions || 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Student files</div>
        </div>

        <div className="glass-panel p-4 glass-panel-hover glow-border">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{stats?.pending_reviews || 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Awaiting grade</div>
        </div>

        <div className="glass-panel p-4 glass-panel-hover glow-border">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Late Submissions</span>
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400">{stats?.late_submissions || 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Past deadline</div>
        </div>

        <div className="glass-panel p-4 glass-panel-hover glow-border">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Evaluated</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats?.graded_submissions || 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Grades published</div>
        </div>
      </div>

      {/* Student Submissions Review Queue Table */}
      <div className="glass-panel p-5 sm:p-6 glow-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              <Inbox className="w-5 h-5 text-indigo-400" />
              <span>Student Submissions Review Queue</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Audit submitted files stored in Cloud Object Storage and record evaluations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or file..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl p-1 text-xs">
              {['ALL', 'PENDING', 'GRADED', 'LATE'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    filterStatus === st
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Student</th>
                <th className="py-3 px-3">Assignment & Course</th>
                <th className="py-3 px-3">Object Storage File</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Grade</th>
                <th className="py-3 px-3 text-right">Evaluation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No submissions matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                          {s.student_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white">{s.student_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{s.student_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-200">{s.assignment_title}</div>
                      <div className="text-[11px] text-cyan-400 font-mono mt-0.5">{s.course_code}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 font-mono text-slate-200">
                        <span className="truncate max-w-[150px]">{s.file_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                          v{s.version}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(s.submitted_at).toLocaleDateString()} at {new Date(s.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {s.submission_status === 'GRADED' && (
                        <span className="badge-status badge-graded">Graded</span>
                      )}
                      {s.submission_status === 'SUBMITTED' && (
                        <span className="badge-status badge-submitted">Submitted</span>
                      )}
                      {s.submission_status === 'LATE' && (
                        <span className="badge-status badge-late">Late</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {s.marks !== null ? (
                        <span className="font-black text-emerald-400 font-mono text-sm">
                          {s.marks} / {s.max_marks}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Ungraded</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/api/submissions/${s.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition-all"
                          title="Stream file from Cloud Object Storage"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => openGradeModal(s)}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600/30 to-blue-600/30 hover:from-indigo-600 hover:to-blue-600 text-white border border-indigo-500/40 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Award className="w-3.5 h-3.5 text-cyan-300" />
                          <span>{s.marks !== null ? 'Re-grade' : 'Grade'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Published Course Deliverables */}
      <div className="glass-panel p-5 sm:p-6 glow-border">
        <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-blue-400" />
          <span>Active Published Assignments</span>
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Assignments created under your faculty account with automated deadline rules
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stats?.upcoming_deadlines?.map((a) => (
            <div 
              key={a.id} 
              className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 flex flex-col justify-between hover:border-indigo-500/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {a.course_code}
                  </span>
                  <span className="text-xs font-black text-slate-200">{a.max_marks} Pts</span>
                </div>
                <h3 className="font-bold text-white text-base line-clamp-1">{a.title}</h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{a.description}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Deadline (UTC):</span>
                <span className="font-mono text-slate-200">
                  {new Date(a.deadline).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Create Assignment */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 relative shadow-2xl border border-white/10 glow-border max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-lg">Create New Assignment</h3>
                <p className="text-xs text-slate-400">Configure file formats and immutable server deadline</p>
              </div>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Course</label>
                <select
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_code}: {c.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Lab 4: Cloud Object Storage Replication"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Instructions</label>
                <textarea
                  rows="3"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe task objectives, submission formats, and guidelines..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Deadline Date & Time (UTC)</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Allowed Extensions</label>
                  <input
                    type="text"
                    value={newAllowedExts}
                    onChange={(e) => setNewAllowedExts(e.target.value)}
                    placeholder=".pdf,.docx,.zip"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max File Size (MB)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newMaxMb}
                    onChange={(e) => setNewMaxMb(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="allow-late"
                  checked={newAllowLate}
                  onChange={(e) => setNewAllowLate(e.target.checked)}
                  className="rounded border-white/10 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="allow-late" className="text-xs text-slate-300 cursor-pointer">
                  Accept late submissions (tagged as 'LATE' in Cloud Database)
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {creating ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Grade Submission with Graphical Score Slider */}
      {activeGradeSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 relative shadow-2xl border border-white/10 glow-border">
            <button
              onClick={() => setActiveGradeSub(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-lg">
                  Evaluate: {activeGradeSub.student_name}
                </h3>
                <p className="text-xs text-slate-400">{activeGradeSub.assignment_title}</p>
              </div>
            </div>

            {/* Submission File Preview Chip */}
            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-white/5 mb-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-slate-200 block">{activeGradeSub.file_name}</span>
                <span className="text-[10px] text-slate-400">
                  Version {activeGradeSub.version} • Status: {activeGradeSub.submission_status}
                </span>
              </div>
              <a
                href={`/api/submissions/${activeGradeSub.id}/download`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/30 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Open File</span>
              </a>
            </div>

            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-300">Marks Awarded</label>
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    Max: {activeGradeSub.max_marks || 100} Pts
                  </span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={activeGradeSub.max_marks || 100}
                  required
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(e.target.value)}
                  placeholder={`0 - ${activeGradeSub.max_marks || 100}`}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-base font-black text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Instructor Written Commentary & Rubric Breakdown
                </label>
                <textarea
                  rows="4"
                  required
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Provide constructive feedback, specific rubric criteria breakdown, and suggestions..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveGradeSub(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGrade}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingGrade ? 'Publishing...' : 'Publish Evaluation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
