const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};
export const setStoredUser = (user) => localStorage.setItem('user', JSON.stringify(user));
export const removeStoredUser = () => localStorage.removeItem('user');

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, default to application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session expired or invalid
    removeAuthToken();
    removeStoredUser();
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.detail || `HTTP Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Courses
  getCourses: () => request('/courses'),
  createCourse: (payload) => request('/courses', { method: 'POST', body: payload }),

  // Assignments
  getAssignments: (courseId) => request(courseId ? `/assignments?course_id=${courseId}` : '/assignments'),
  getAssignmentById: (id) => request(`/assignments/${id}`),
  createAssignment: (payload) => request('/assignments', { method: 'POST', body: payload }),
  updateAssignment: (id, payload) => request(`/assignments/${id}`, { method: 'PUT', body: payload }),
  deleteAssignment: (id) => request(`/assignments/${id}`, { method: 'DELETE' }),

  // Submissions
  submitAssignment: (assignmentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(`/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: formData,
    });
  },
  getMySubmissions: () => request('/submissions/me'),
  getAssignmentSubmissions: (assignmentId) => request(`/assignments/${assignmentId}/submissions`),
  getSubmissionById: (id) => request(`/submissions/${id}`),
  gradeSubmission: (submissionId, payload) =>
    request(`/submissions/${submissionId}/grade`, { method: 'POST', body: payload }),
  getFeedback: (submissionId) => request(`/submissions/${submissionId}/feedback`),

  // Dashboards
  getStudentDashboard: () => request('/dashboard/student'),
  getTeacherDashboard: () => request('/dashboard/teacher'),

  // Health
  getHealth: () => request('/health'),
};
