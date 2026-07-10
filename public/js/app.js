(() => {
  'use strict';

  const API_BASE = '/api';
  const STORAGE_TOKEN_KEY = 'student_mgmt_token';
  const STORAGE_USER_KEY = 'student_mgmt_user';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const authSection = $('#auth-section');
  const dashboardSection = $('#dashboard-section');
  const loginForm = $('#login-form');
  const registerForm = $('#register-form');
  const loginError = $('#login-error');
  const registerError = $('#register-error');
  const profileForm = $('#profile-form');
  const profileError = $('#profile-error');
  const enrollForm = $('#enroll-form');
  const enrollError = $('#enroll-error');
  const gradeForm = $('#grade-form');
  const gradeError = $('#grade-error');
  const transcriptBody = $('#transcript-body');
  const studentName = $('#student-name');
  const studentNumber = $('#student-number');
  const studentEmail = $('#student-email');
  const studentGpa = $('#student-gpa');
  const profileSetup = $('#profile-setup');
  const adminCard = $('#admin-card');

  let currentUser = null;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  });

  const getToken = () => localStorage.getItem(STORAGE_TOKEN_KEY);

  const setToken = (token) => localStorage.setItem(STORAGE_TOKEN_KEY, token);

  const clearToken = () => localStorage.removeItem(STORAGE_TOKEN_KEY);

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_USER_KEY));
    } catch {
      return null;
    }
  };

  const setUser = (user) => {
    currentUser = user;
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  };

  const clearUser = () => {
    currentUser = null;
    localStorage.removeItem(STORAGE_USER_KEY);
  };

  const showError = (el, message) => {
    if (!el) return;
    el.textContent = message;
  };

  const clearErrors = () => {
    showError(loginError, '');
    showError(registerError, '');
    showError(profileError, '');
    showError(enrollError, '');
    showError(gradeError, '');
  };

  const switchTab = (tab) => {
    clearErrors();
    $$('.auth-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    $$('.auth-form').forEach((form) => {
      form.classList.toggle('active', form.id === `${tab}-form`);
    });
  };

  const showAuth = () => {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
  };

  const showDashboard = () => {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
  };

  const renderProfile = (student) => {
    studentName.textContent = `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || 'Student';
    studentNumber.textContent = student.student_number || 'Pending';
    studentEmail.textContent = student.email || '';

    if (!student.student_number || !student.first_name || !student.last_name) {
      profileSetup.classList.remove('hidden');
    } else {
      profileSetup.classList.add('hidden');
    }
  };

  const renderEnrollments = (enrollments = []) => {
    if (!enrollments.length) {
      transcriptBody.innerHTML = `
        <tr class="empty-state">
          <td colspan="5">No enrollments yet. Sign up for a course below.</td>
        </tr>
      `;
      updateGpaDisplay(enrollments);
      return;
    }

    transcriptBody.innerHTML = enrollments
      .map(
        (e) => `
      <tr>
        <td>${escapeHtml(e.course_code)}</td>
        <td>${escapeHtml(e.course_name)}</td>
        <td>${escapeHtml(String(e.credits ?? ''))}</td>
        <td>${escapeHtml(formatGrade(e.grade))}</td>
        <td>${escapeHtml(formatDate(e.enrolled_at))}</td>
      </tr>
    `
      )
      .join('');

    updateGpaDisplay(enrollments);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const escapeHtml = (value) => {
    if (value == null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  const gradeToPoints = (grade) => {
    if (grade == null) return null;
    const g = String(grade).trim().toUpperCase();
    const map = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0,
      'F': 0.0,
    };
    return map[g];
  };

  const formatGrade = (grade) => {
    if (grade == null || grade === '') return '—';
    return String(grade);
  };

  const updateGpaDisplay = (enrollments) => {
    if (!studentGpa) return;

    if (!enrollments || !enrollments.length) {
      studentGpa.textContent = 'GPA: —';
      return;
    }

    let totalPoints = 0;
    let totalCredits = 0;

    for (const e of enrollments) {
      const points = gradeToPoints(e.grade);
      const credits = Number(e.credits) || 0;
      if (points !== null && credits > 0) {
        totalPoints += points * credits;
        totalCredits += credits;
      }
    }

    if (totalCredits === 0) {
      studentGpa.textContent = 'GPA: —';
      return;
    }

    const gpa = totalPoints / totalCredits;
    studentGpa.textContent = `GPA: ${gpa.toFixed(2)}`;
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/students/profile`, {
        headers: getHeaders(),
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError(profileError, data.message || 'Failed to load profile');
        return;
      }

      const data = await res.json();
      renderProfile(data.student);
      renderEnrollments(data.enrollments);
    } catch (err) {
      console.error('Fetch profile error:', err);
      showError(profileError, 'Network error while loading profile');
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    clearErrors();

    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;

    if (!email || !password) {
      showError(loginError, 'Email and password are required');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(loginError, data.message || 'Login failed');
        return;
      }

      if (!data.token) {
        showError(loginError, 'Invalid response from server');
        return;
      }

      setToken(data.token);
      setUser(data.user || currentUser);
      applyAuthState();
      await fetchProfile();
    } catch (err) {
      console.error('Login error:', err);
      showError(loginError, 'Network error. Please try again.');
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    clearErrors();

    const email = $('#register-email').value.trim();
    const password = $('#register-password').value;

    if (!email || !password) {
      showError(registerError, 'Email and password are required');
      return;
    }

    if (password.length < 6) {
      showError(registerError, 'Password must be at least 6 characters');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(registerError, data.message || 'Registration failed');
        return;
      }

      // Auto-login after registration
      showError(registerError, '');
      switchTab('login');
      $('#login-email').value = email;
      $('#login-password').value = '';
    } catch (err) {
      console.error('Register error:', err);
      showError(registerError, 'Network error. Please try again.');
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    clearErrors();

    const payload = {
      student_number: $('#profile-student-number').value.trim(),
      first_name: $('#profile-first-name').value.trim(),
      last_name: $('#profile-last-name').value.trim(),
      date_of_birth: $('#profile-dob').value || null,
    };

    if (!payload.student_number || !payload.first_name || !payload.last_name) {
      showError(profileError, 'Student number, first name, and last name are required');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/students/profile`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(profileError, data.message || 'Failed to save profile');
        return;
      }

      await fetchProfile();
    } catch (err) {
      console.error('Profile error:', err);
      showError(profileError, 'Network error. Please try again.');
    }
  };

  const handleEnroll = async (event) => {
    event.preventDefault();
    clearErrors();

    const courseId = $('#enroll-course-id').value.trim();

    if (!courseId) {
      showError(enrollError, 'Course ID is required');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/students/enroll`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ course_id: courseId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(enrollError, data.message || 'Enrollment failed');
        return;
      }

      $('#enroll-course-id').value = '';
      await fetchProfile();
    } catch (err) {
      console.error('Enroll error:', err);
      showError(enrollError, 'Network error. Please try again.');
    }
  };

  const handleGradeUpdate = async (event) => {
    event.preventDefault();
    clearErrors();

    if (!currentUser || currentUser.role !== 'admin') {
      showError(gradeError, 'Admin access required');
      return;
    }

    const studentId = $('#grade-student-id').value.trim();
    const courseId = $('#grade-course-id').value.trim();
    const grade = $('#grade-value').value.trim();

    if (!studentId || !courseId || !grade) {
      showError(gradeError, 'Student ID, course ID, and grade are required');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/students/grade`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ student_id: studentId, course_id: courseId, grade }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(gradeError, data.message || 'Failed to update grade');
        return;
      }

      $('#grade-student-id').value = '';
      $('#grade-course-id').value = '';
      $('#grade-value').value = '';
      await fetchProfile();
    } catch (err) {
      console.error('Grade update error:', err);
      showError(gradeError, 'Network error. Please try again.');
    }
  };

  const enforceRouteProtection = () => {
    const token = getToken();
    if (!token) {
      clearToken();
      clearUser();
      clearForms();
      studentName.textContent = '';
      studentNumber.textContent = '';
      studentEmail.textContent = '';
      studentGpa.textContent = '';
      transcriptBody.innerHTML = '';
      profileSetup.classList.add('hidden');
      adminCard.classList.add('hidden');
      showAuth();
      return false;
    }
    return true;
  };

  const handleLogout = () => {
    clearToken();
    clearUser();
    clearForms();
    studentName.textContent = '';
    studentNumber.textContent = '';
    studentEmail.textContent = '';
    studentGpa.textContent = '';
    transcriptBody.innerHTML = '';
    profileSetup.classList.add('hidden');
    adminCard.classList.add('hidden');
    showAuth();
  };

  const clearForms = () => {
    if (loginForm) loginForm.reset();
    if (registerForm) registerForm.reset();
    if (profileForm) profileForm.reset();
    if (enrollForm) enrollForm.reset();
    if (gradeForm) gradeForm.reset();
    clearErrors();
  };

  const applyAuthState = () => {
    const token = getToken();
    if (!token) {
      showAuth();
      return;
    }

    const user = getUser();
    if (user?.role === 'admin') {
      adminCard.classList.remove('hidden');
    } else {
      adminCard.classList.add('hidden');
    }

    showDashboard();
  };

  const handleUnauthorized = () => {
    clearToken();
    clearUser();
    clearForms();
    studentName.textContent = '';
    studentNumber.textContent = '';
    studentEmail.textContent = '';
    studentGpa.textContent = '';
    transcriptBody.innerHTML = '';
    profileSetup.classList.add('hidden');
    adminCard.classList.add('hidden');
    showAuth();
  };

  const init = () => {
    if (!loginForm || !registerForm) {
      console.error('Required form elements not found');
      return;
    }

    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    if (profileForm) profileForm.addEventListener('submit', handleProfileSubmit);
    if (enrollForm) enrollForm.addEventListener('submit', handleEnroll);
    if (gradeForm) gradeForm.addEventListener('submit', handleGradeUpdate);

    $('#logout-btn')?.addEventListener('click', handleLogout);

    $$('.auth-tab').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    enforceRouteProtection();
    applyAuthState();

    currentUser = getUser() || null;

    if (getToken()) {
      fetchProfile();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();